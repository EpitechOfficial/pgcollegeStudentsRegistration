import { CURRENT_SESSION, STUDENT } from "./portal";
import { apiUrl } from "./api";
import { isDemoSession, restoreSession } from "./auth";

type JsonRecord = Record<string, unknown>;

export interface AdmissionClearanceData {
  student: { applicationNumber: string; fullName: string; sessionOfEntry: string };
  programme: { faculty: string; department: string; degree: string; fieldTitle: string };
  verification: {
    firstDegree: string;
    secondDegree: string;
    otherDocument: string;
    nysc: string;
    transcript: string;
    oLevel: string;
    previousAdmission: string;
    previousMatricNumber: string;
    verifierName: string;
    verifierDesignation: string;
    dateCleared: string;
  };
  clearance: {
    cleared: boolean;
    status: string;
    approverName: string;
    approverDesignation: string;
    signatureUrl: string;
  };
  certificate: { id: string; generatedAt: string };
}

export interface AdmissionClearanceResult {
  source: "backend" | "demo";
  data: AdmissionClearanceData;
}

function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`Admission clearance ${label} is missing.`);
  return value as JsonRecord;
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function first(source: JsonRecord, keys: string[]): string {
  for (const key of keys) {
    const value = text(source[key]);
    if (value) return value;
  }
  return "";
}

function affirmative(value: unknown): boolean {
  if (value === true || value === 1) return true;
  return ["yes", "cleared", "approved", "1", "true"].includes(
    text(value).toLowerCase(),
  );
}

export function admissionClearanceData(value: unknown): AdmissionClearanceData {
  const root = record(value, "response");
  const student = record(root.student, "student details");
  const programme = record(root.programme, "programme details");
  const verification = record(root.verification, "verification details");
  const clearance = record(root.clearance, "approval details");
  const certificate =
    root.certificate && typeof root.certificate === "object"
      ? record(root.certificate, "certificate details")
      : {};

  const applicationNumber = first(student, ["application_number", "numeration", "appno"]);
  const fullName =
    first(student, ["full_name", "name"]) ||
    [first(student, ["surname"]), first(student, ["other_names"])]
      .filter(Boolean)
      .join(" ");
  if (!applicationNumber || !fullName)
    throw new Error("Admission clearance student details are incomplete.");

  const status = first(clearance, ["status", "clearance"]);
  return {
    student: {
      applicationNumber,
      fullName,
      sessionOfEntry: first(student, ["session_of_entry", "form_year", "session"]),
    },
    programme: {
      faculty: first(programme, ["faculty"]),
      department: first(programme, ["department"]),
      degree: first(programme, ["degree"]),
      fieldTitle: first(programme, ["field_title", "field_of_interest"]),
    },
    verification: {
      firstDegree: first(verification, ["first_degree"]),
      secondDegree: first(verification, ["second_degree"]),
      otherDocument: first(verification, ["other_document", "other_degree"]),
      nysc: first(verification, ["nysc_verified", "nysc"]),
      transcript: first(verification, ["transcript_verified", "transcript"]),
      oLevel: first(verification, ["olevel_verified", "o_level"]),
      previousAdmission: first(verification, ["previous_admission", "prev_admission"]),
      previousMatricNumber: first(verification, ["previous_matric_number", "prev_matric_number"]),
      verifierName: first(verification, ["verifier_name", "verifier_fullname", "admin_username"]),
      verifierDesignation: first(verification, ["verifier_designation"]),
      dateCleared: first(verification, ["date_cleared", "verification_date"]),
    },
    clearance: {
      cleared: affirmative(clearance.cleared ?? clearance.status ?? clearance.clearance),
      status,
      approverName: first(clearance, ["approver_name", "approver_fullname", "staff_name"]),
      approverDesignation: first(clearance, ["approver_designation"]) || "Admissions Officer",
      signatureUrl: first(clearance, ["signature_url"]),
    },
    certificate: {
      id: first(certificate, ["id", "certificate_id", "doc_id"]),
      generatedAt: first(certificate, ["generated_at", "issued_at"]),
    },
  };
}

export async function loadAdmissionClearance(signal: AbortSignal): Promise<AdmissionClearanceResult> {
  if (isDemoSession()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    signal.throwIfAborted();
    return {
      source: "demo",
      data: {
        student: {
          applicationNumber: STUDENT.applicationNumber,
          fullName: STUDENT.name,
          sessionOfEntry: CURRENT_SESSION,
        },
        programme: {
          faculty: STUDENT.faculty,
          department: STUDENT.department,
          degree: STUDENT.degree,
          fieldTitle: STUDENT.programme,
        },
        verification: {
          firstDegree: "Yes",
          secondDegree: "No",
          otherDocument: "Discharge",
          nysc: "Yes",
          transcript: "Yes",
          oLevel: "Yes",
          previousAdmission: "No",
          previousMatricNumber: "",
          verifierName: "Admissions Verification Officer",
          verifierDesignation: "Admissions Unit",
          dateCleared: "2026-11-16 10:30:00",
        },
        clearance: {
          cleared: true,
          status: "Yes",
          approverName: "Admissions Officer",
          approverDesignation: "Admissions Officer",
          signatureUrl: "",
        },
        certificate: {
          id: `DEMO-${STUDENT.applicationNumber}`,
          generatedAt: "2026-11-16 10:30:00",
        },
      },
    };
  }

  const token = restoreSession();
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(apiUrl("clearance"), {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid admission clearance response. Please try again.");
  }
  const body = record(payload, "response");
  if (!response.ok || body.success !== true)
    throw new Error(text(body.message) || "Unable to retrieve admission clearance details.");
  const result: AdmissionClearanceResult = {
    source: "backend",
    data: admissionClearanceData(body.data),
  };
  return result;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

function display(value: string, fallback = "Not Available"): string {
  return escapeHtml(value || fallback);
}

function formatDate(value: string, includeTime = false): string {
  if (!value) return "Not Available";
  const normalized = /^\d{4}-\d{2}-\d{2}(?:\s|$)/.test(value)
    ? value.replace(" ", "T")
    : value;
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
  });
}

function safeImageUrl(value: string): string {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "";
  } catch {
    return "";
  }
}

function statusClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (["yes", "verified", "cleared", "approved"].includes(normalized)) return "yes";
  if (normalized === "discharge") return "discharge";
  return "no";
}

export function buildAdmissionClearanceDocument(result: AdmissionClearanceResult): string {
  const { student, programme, verification, clearance, certificate } = result.data;
  const brand = new URL(`${import.meta.env.BASE_URL}brand/`, window.location.origin);
  const signature = safeImageUrl(clearance.signatureUrl);
  const verificationRow = (label: string, value: string) =>
    `<tr><td>${escapeHtml(label)}</td><td class="center"><span class="badge ${statusClass(value)}">${display(value, "None")}</span></td></tr>`;
  const previousAdmission = verification.previousAdmission || "No";
  const verifier = verification.verifierName
    ? `${verification.verifierName}${verification.verifierDesignation ? ` (${verification.verifierDesignation})` : ""}`
    : verification.verifierDesignation;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Student Clearance Certificate - ${escapeHtml(student.fullName)}</title><style>
*{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}body{margin:0;background:#f4f4f9;color:#222;font:12px/1.4 Arial,sans-serif}.document{width:min(760px,calc(100% - 24px));margin:12px auto;background:#fff;padding:18px}.certificate{position:relative;border:1px solid #111;padding:22px}.certificate:before{content:"";position:absolute;inset:5px;border:1px solid #111;pointer-events:none}.content{position:relative;z-index:1}.issued{text-align:right;font-size:11px}.header{display:grid;grid-template-columns:70px 1fr 70px;align-items:center;gap:14px;text-align:center;margin:8px 0 14px}.header img{width:68px;height:68px;object-fit:contain}.college{font-size:20px;font-weight:700;color:#0a2b4f}.university,.unit{font-size:13px}.title{margin:14px 0 18px;text-align:center;font-size:18px;font-weight:700;text-transform:uppercase;color:#0a2b4f}.section{margin-top:14px}.section-head{display:flex;justify-content:space-between;gap:15px;background:#0a2b4f;color:#fff;padding:7px 9px;font-size:12px;font-weight:700}.section-head span:last-child{text-align:right}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d5d8dc;padding:6px 8px;text-align:left;vertical-align:top}th{width:36%;background:#f2f2f2}.verification td:first-child{width:55%}.center{text-align:center}.badge{display:inline-block;min-width:62px;border-radius:999px;padding:2px 9px;color:#fff;font-size:11px;text-align:center}.badge.yes{background:#148447}.badge.no{background:#b7791f}.badge.discharge{background:#1565c0}.signature{width:280px;max-width:80%;margin:34px auto 10px;text-align:center}.signature img{display:block;max-width:150px;height:62px;object-fit:contain;margin:0 auto -4px}.signature-space{height:48px}.signature-line{border-top:1px solid #111;padding-top:5px}.signature-name{font-weight:700}.signature-title{font-style:italic}.footer{border-top:1px solid #ddd;margin-top:20px;padding-top:10px;text-align:center;color:#555}.certificate-id{margin-top:7px;border:1px dashed #bbb;background:#f8f9fa;padding:4px;font:10px monospace;overflow-wrap:anywhere}@media(max-width:560px){.document{width:100%;margin:0;padding:8px}.certificate{padding:14px}.header{grid-template-columns:45px 1fr 45px}.header img{width:44px;height:44px}.college{font-size:16px}.section-head{display:block}.section-head span{display:block!important;text-align:left!important}}@media print{@page{size:A4;margin:12mm}body{background:#fff}.document{width:100%;margin:0;padding:0}.certificate{break-inside:avoid}}
</style></head><body><main class="document"><article class="certificate"><div class="content">
<div class="issued">${display(formatDate(certificate.generatedAt, true))}</div>
<header class="header"><img src="${escapeHtml(new URL("ui-logo.png", brand).href)}" alt="University of Ibadan logo"><div><div class="college">The Postgraduate College</div><div class="university">University of Ibadan</div><div class="unit">Admissions Unit</div></div><img src="${escapeHtml(new URL("pgc-logo.png", brand).href)}" alt="Postgraduate College logo"></header>
<div class="title">Student Clearance Certificate</div>
<section class="section"><div class="section-head"><span>Student Information</span><span>Session of Entry: ${display(student.sessionOfEntry)}</span></div><table><tbody><tr><th>Application Number</th><td>${display(student.applicationNumber)}</td></tr><tr><th>Full Name</th><td>${display(student.fullName)}</td></tr><tr><th>Faculty</th><td>${display(programme.faculty)}</td></tr><tr><th>Department</th><td>${display(programme.department)}</td></tr><tr><th>Degree</th><td>${display(programme.degree)}</td></tr><tr><th>Field of Interest</th><td>${display(programme.fieldTitle)}</td></tr></tbody></table></section>
<section class="section"><div class="section-head"><span>Document Verification Status</span></div><table class="verification"><tbody>${verificationRow("First Degree", verification.firstDegree)}${verificationRow("Second Degree", verification.secondDegree)}${verificationRow("Other Document", verification.otherDocument)}${verificationRow("NYSC Verification", verification.nysc)}${verificationRow("Transcript Verification", verification.transcript)}${verificationRow("O'Level Verification", verification.oLevel)}<tr><td>Previous Admission</td><td><b>Previous Admission:</b> ${display(previousAdmission)}${affirmative(previousAdmission) ? `<br><b>Matric Number:</b> ${display(verification.previousMatricNumber, "N/A")}` : ""}</td></tr><tr><td>Verifying Officer</td><td>${display(verifier)}</td></tr><tr><td>Date Cleared</td><td>${display(formatDate(verification.dateCleared, true))}</td></tr></tbody></table></section>
<div class="signature">${signature ? `<img src="${signature}" alt="Admissions Officer signature">` : '<div class="signature-space"></div>'}<div class="signature-line"><div class="signature-name">${display(clearance.approverName)}</div><div class="signature-title">${display(clearance.approverDesignation, "Admissions Officer")}</div></div></div>
<footer class="footer"><p>This document certifies that the above student has fulfilled all verification and clearance requirements.</p><div class="certificate-id">CERTIFICATE ID: ${display(certificate.id)}</div></footer>
</div></article></main></body></html>`;
}
