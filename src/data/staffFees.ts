import { STUDENT, currentStudent } from "./portal";
import { apiUrl } from "./api";
import { restoreSession } from "./auth";

export interface StaffFeeDetails {
  full_name: string;
  pf_number: string;
  application_number: string;
  staff_department: string;
  staff_category: string;
  department_of_study: string;
  faculty_of_study: string;
  programme: string;
}
export interface StaffFeeReview {
  approval_status: "pending" | "approved" | "rejected";
  staff: StaffFeeDetails;
  rebate_preview?: {
    rebate_type: string;
    total_original: number;
    total_rebated: number;
    items: { description: string; original_amount: number; percentage_pays: number; rebated_amount: number }[];
  };
}
// Demo only. Set approval_status to 'approved' to test invoice access after approval.
export const DEMO_STAFF_FEE_REVIEW: StaffFeeReview = {
  approval_status: "approved",
  staff: {
    full_name: STUDENT.name,
    pf_number: "PF12345",
    application_number: STUDENT.applicationNumber,
    staff_department: "Security",
    staff_category: "Non Teaching",
    department_of_study: STUDENT.department,
    faculty_of_study: STUDENT.faculty,
    programme: STUDENT.degree,
  },
};
export function verifyDemoStaffFees(pfNumber: string): StaffFeeReview {
  if (
    pfNumber.trim().toUpperCase() !==
    DEMO_STAFF_FEE_REVIEW.staff.pf_number.toUpperCase()
  )
    throw new Error(
      "PF number not found in the demo staff records. Check the number and try again.",
    );
  return {
    ...DEMO_STAFF_FEE_REVIEW,
    staff: { ...DEMO_STAFF_FEE_REVIEW.staff },
  };
}
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : "";
const amount = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : -1; };
export async function verifyStaffFees(pfNumber: string, signal: AbortSignal): Promise<StaffFeeReview> {
  const token = restoreSession();
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(apiUrl("invoice/verify-staff"), { method: "POST", signal, headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ pfno: pfNumber.trim() }) });
  let payload: Record<string, unknown> | null = null;
  try { payload = object(await response.json()); } catch { /* handled below */ }
  if (!response.ok || payload?.success !== true) throw new Error(text(payload?.message) || "Unable to verify this PF number.");
  const data = object(payload.data);
  const rebate = object(data?.rebate_preview);
  const rawItems = Array.isArray(rebate?.items) ? rebate.items : [];
  const items = rawItems.map(object).filter((item): item is Record<string, unknown> => !!item).map((item) => ({ description: text(item.description), original_amount: amount(item.original_amount), percentage_pays: amount(item.percentage_pays), rebated_amount: amount(item.rebated_amount) })).filter((item) => item.description && item.original_amount >= 0 && item.percentage_pays >= 0 && item.rebated_amount >= 0);
  const student = currentStudent();
  const pfno = text(data?.pfno);
  if (!data || !pfno || !text(data.name) || !rebate || amount(rebate.total_original) < 0 || amount(rebate.total_rebated) < 0 || !items.length) throw new Error("The server returned incomplete staff details. Please try again.");
  const status = text(data.approval_status).toLowerCase();
  const approval_status: StaffFeeReview["approval_status"] = status === "pending" || status === "rejected" ? status : "approved";
  return { approval_status, staff: { full_name: text(data.name), pf_number: pfno, application_number: text(data.student_appno) || student.applicationNumber, staff_department: text(data.dept), staff_category: text(data.category), department_of_study: student.department, faculty_of_study: student.faculty, programme: student.degree }, rebate_preview: { rebate_type: text(rebate.rebate_type), total_original: amount(rebate.total_original), total_rebated: amount(rebate.total_rebated), items } };
}
export function buildStaffFeeForm(review: StaffFeeReview): string {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character]!,
    );
  const brand = new URL(
    `${import.meta.env.BASE_URL}brand/`,
    window.location.origin,
  );
  const fields: [string, keyof StaffFeeDetails][] = [
    ["Full Name", "full_name"],
    ["PF Number", "pf_number"],
    ["Application Number", "application_number"],
    ["Staff Department / Centre", "staff_department"],
    ["Staff Category", "staff_category"],
    ["Department of Study", "department_of_study"],
    ["Faculty of Study", "faculty_of_study"],
    ["Program", "programme"],
  ];
  const message = review.approval_status === "approved"
    ? "Management approval has been received. Your school fee invoice is now available."
    : review.approval_status === "rejected"
      ? "Management has not approved this request. Please contact management for further guidance."
      : "Print and submit this form to management for internal approval. A school fee invoice will be available after approval.";
  const money = (value: number) => `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  const rebate = review.rebate_preview ? `<h2>Staff Rebate Preview</h2><div class="totals"><span>Original Fees <b>${money(review.rebate_preview.total_original)}</b></span><span>Amount Payable <b>${money(review.rebate_preview.total_rebated)}</b></span></div>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Staff Rebate Approval Form</title><style>body{font:14px/1.5 Arial;color:#172033;margin:0;padding:28px}header{display:flex;align-items:center;justify-content:space-between;gap:20px;text-align:center;border-bottom:2px solid #0A2B4F;padding-bottom:20px}header img{width:65px;height:65px;object-fit:contain}h1{font-size:18px;color:#0A2B4F}h2{font-size:16px;color:#0A2B4F}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;border:1px solid #ddd;text-align:left;overflow-wrap:anywhere}th{background:#f5f7fa}.totals{display:flex;gap:16px;margin:12px 0}.totals span{flex:1;border:1px solid #ddd;border-radius:6px;padding:12px}.totals b{display:block;margin-top:4px;color:#0A2B4F;font-size:17px}.rebate th:nth-child(n+2),.rebate td:nth-child(n+2){text-align:right;white-space:nowrap}.signatures{display:flex;gap:40px;margin-top:65px}.signatures p{flex:1;border-top:1px solid #888;padding-top:10px}.office{border:1px solid #ddd;padding:16px;margin-top:25px;min-height:150px;break-inside:avoid}@media print{@page{size:A4;margin:15mm}body{padding:0}}</style></head><body><header><img src="${escape(new URL("pgc-logo.png", brand).href)}" alt="Postgraduate College logo"><div><h1>UNIVERSITY OF IBADAN</h1><p>THE POSTGRADUATE COLLEGE</p><h2>Staff Rebate Approval Form</h2></div><img src="${escape(new URL("ui-logo.png", brand).href)}" alt="University of Ibadan logo"></header><p>${escape(message)}</p><table>${fields.map(([label, key]) => `<tr><th>${label}</th><td>${escape(review.staff[key] || "Not provided")}</td></tr>`).join("")}</table>${rebate}${review.approval_status !== "approved" ? `<div class="signatures"><p>Staff Signature</p><p>Date</p></div><section class="office"><b>FOR MANAGEMENT USE ONLY</b><p>Decision / Remarks: __________________________________</p><p>Authorised Signature / Date: __________________________</p></section>` : ""}</body></html>`;
}
