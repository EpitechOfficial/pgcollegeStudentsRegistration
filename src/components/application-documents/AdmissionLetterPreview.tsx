// @ts-nocheck
import { useEffect, useState } from "react";
import { getLetterOfficials, FALLBACK_LETTER_OFFICIALS } from "../../data/letterOfficials";
const logo = "/brand/ui-logo.png";
import TranscriptSubmissionNotice from "./TranscriptSubmissionNotice";

const pick = (data, keys, fallback = "N/A") => {
  const value = keys
    .map((key) => data?.[key])
    .find((item) => item !== undefined && item !== null && item !== "");

  return value || fallback;
};

const getOtherNames = (applicant) =>
  [applicant.firstname, applicant.other_names].filter(Boolean).join(" ");

const getCandidateName = (applicant) =>
  [applicant.surname, getOtherNames(applicant)].filter(Boolean).join(", ") ||
  "N/A";

const formatLongDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleString("en-GB", { month: "long" });

  return `${day}${suffix} ${month}, ${date.getFullYear()}.`;
};


const getActiveOfficials = (records) => {
  const rows = Array.isArray(records) ? records : Object.values(records || {});
  return rows.filter((record) => record && [true, 1, "1"].includes(record.is_active));
};

const credentialLines = (value) => String(value || "")
  .replace(/[ \t]+(?=MGIS\b)/gi, "\n").split(/\r?\n/)
  .map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < line.length; index++) {
      if (line[index] === "(") depth++;
      if (line[index] === ")") depth = Math.max(0, depth - 1);
      if (line[index] === "," && depth === 0) {
        parts.push(line.slice(start, index + 1).trim());
        start = index + 1;
      }
    }
    if (line.slice(start).trim()) parts.push(line.slice(start).trim());
    return parts;
  });

function OfficerBlock({ officer }) {
  if (!officer) return null;
  return <div className="pg-letter-office-block">
    <strong>{officer.title}</strong><p>{officer.name}</p>
    {officer.credentials && <p className="pg-letter-credentials">{credentialLines(officer.credentials).map((parts, lineIndex) =>
      <span className="pg-letter-credential-line" key={lineIndex}>{parts.map((part, index) =>
        <span key={index}>{index > 0 && " "}<span className="pg-letter-qualification">{part}</span></span>
      )}</span>
    )}</p>}
    {officer.mobile && <p>Mobile: {officer.mobile}</p>}
    {officer.email && <p>E-mail: {officer.email}</p>}
    {officer.secondary_email && <p>{officer.secondary_email}</p>}
  </div>;
}

function AdmissionLetterPreview({ data }) {
  const [officials, setOfficials] = useState([]);
  const [officialsLoading, setOfficialsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getLetterOfficials({ signal: controller.signal }).then((response) => {
      const payload = response.data;
      const records = payload?.data ?? payload?.letter_officials ?? payload;
      const rows = Array.isArray(records) ? records : records && typeof records === "object" ? Object.values(records) : null;
      if (!rows || !rows.every((record) => record && typeof record.officer_type === "string" && typeof record.name === "string" && typeof record.title === "string" && [true, false, 1, 0, "1", "0"].includes(record.is_active))) {
        throw new Error("Unexpected letter officials response");
      }
      if (!controller.signal.aborted) setOfficials(getActiveOfficials(rows));
    }).catch(() => {
      if (!controller.signal.aborted) setOfficials(getActiveOfficials(FALLBACK_LETTER_OFFICIALS));
    }).finally(() => {
      if (!controller.signal.aborted) setOfficialsLoading(false);
    });
    return () => controller.abort();
  }, []);
  const official = (type) => officials.find((record) => record.officer_type === type);
  const deputyRegistrar = official("deputy_registrar");
  const admissionOfficer = official("admission_officer");

  const applicant = data?.auth?.applicant || {};
  const application = data?.auth?.application || {};
  const admissionStatus = data?.auth?.admission_status || {};
  const deputyRegistrarSignature = admissionStatus.signature_url ||
    `${import.meta.env.BASE_URL}signatures/deputy-registrar.png`;
  const biodata = data?.biodata || {};
  const dashboard = data?.auth?.dashboard || {};
  const eligibility = dashboard.eligibility || {};
  const surname = pick(applicant, ["surname"], "Applicant");
  const session = pick(application, ["session", "apply_session"], "N/A");
  const department = pick(application, ["department_name", "department"]);
  const faculty = pick(application, ["faculty_name", "faculty"]);
  const degree = pick(application, ["degree_name", "degree"]);
  const modeOfStudy = pick(application, [
    "mode_of_study_name",
    "mode_of_study",
    "modeOfStudy",
  ]);
  const fieldOfInterest = pick(application, [
    "field_of_interest_name",
    "field_of_interest",
    "specialization",
  ]);
  const letterDate = admissionStatus.letter_date;
  const letterCode = admissionStatus.letter_code;
  const letterSignedValue = String(admissionStatus.letter_signed ?? "")
    .trim()
    .toLowerCase();
  const letterStatus = ["yes", "true", "1", "signed"].includes(letterSignedValue)
    ? "Signed"
    : "Not Signed";
  const letterReadyValue = String(
    admissionStatus.letter_ready || "",
  ).toLowerCase();
  const letterReady = ["yes", "true", "1", "ready"].includes(letterReadyValue);
  const supervisor = admissionStatus.supervisor || "N/A";
  const gender = String(pick(biodata, ["gender", "sex"], "")).toLowerCase();
  const salutationTitle = gender.includes("female") ? "Ms" : "Mr";

  if (!letterReady) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 74,
              height: 74,
              backgroundColor: "rgba(255, 184, 0, 0.14)",
              color: "#FFB800",
            }}
          >
            <i className="fas fa-clock fs-28"></i>
          </div>
          <h4 className="text-black font-w600 mb-2">
            Admission Letter Not Ready
          </h4>
          <p className="text-muted mb-0 mx-auto" style={{ maxWidth: 520 }}>
            Your admission letter is not available yet. Please check back after
            the admission office has prepared and approved your letter.
          </p>
        </div>
      </div>
    );
  }

  if (officialsLoading) {
    return <div className="card"><div className="card-body text-center py-5" role="status">Loading letter officialsâ€¦</div></div>;
  }

  return (
    <div className="pg-admission-letter-print">
      <style>
        {`
          .pg-admission-letter-print {
            background: #fff;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
            color: #111827;
            font-family: Roboto,Arial,Helvetica,sans-serif;
            font-size: 13.5px;
            line-height: 1;
            margin: 0 auto;
            max-width: 100%;
            min-height: 100vh;
            padding: 20px 26px;
            width: 100%;
          }
          .pg-letter-head {
            border-bottom: 2px solid #3C4CB8;
            margin-bottom: 16px;
            padding-bottom: 14px;
          }
          .pg-letter-title {
            text-align: center;
          }
          .pg-letter-title h2,
          .pg-letter-title h3,
          .pg-letter-title p {
            margin: 0;
          }
          .pg-letter-title h2 {
            color: #16206f;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0;
            text-transform: uppercase;
          }
          .pg-letter-title h3 {
            color: #3C4CB8;
            font-size: 17px;
            margin-top: 3px;
            text-transform: uppercase;
          }
          .pg-letter-title p {
            color: #4b5563;
            font-size: 12px;
            margin-top: 7px;
          }
          .pg-letter-officers {
            align-items: center;
            border-bottom: 1px solid #d7dee8;
            display: grid;
            gap: 18px;
            grid-template-columns: minmax(0, 1fr) 104px minmax(0, 1fr);
            margin-bottom: 18px;
            padding-bottom: 14px;
          }
          .pg-letter-office-side {
            display: grid;
            gap: 12px;
          }
          .pg-letter-office-left {
            text-align: left;
          }
          .pg-letter-office-right {
            text-align: left;
            justify-self: end;
          }
          .pg-letter-center-logo {
            align-items: center;
            display: flex;
            justify-content: center;
          }
          .pg-letter-center-logo img {
            max-height: 96px;
            max-width: 96px;
            object-fit: contain;
          }
          .pg-letter-office-block strong {
            color: #16206f;
            display: block;
            font-family: Arial, sans-serif;
            font-size: 11px;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .pg-letter-office-block p {
            margin: 0;
          }
          .pg-letter-meta {
            display: grid;
            gap: 18px;
            grid-template-columns: 1fr 190px;
            margin-bottom: 18px;
          }
          .pg-letter-meta p {
            margin: 0 0 4px;
          }
          .pg-letter-date {
            margin-top: 6px;
          }
          .pg-letter-body p {
            margin: 0 0 10px;
            text-align: justify;
          }
          .pg-letter-heading {
            font-weight: 700;
            margin: 12px 0;
            text-align: center;
            text-decoration: underline;
            text-transform: uppercase;
          }
          .pg-letter-body ol {
            margin: 0 0 10px 19px;
            padding: 0;
          }
          .pg-letter-body li {
            margin-bottom: 7px;
            text-align: justify;
          }
          .pg-letter-body ol ol {
            list-style: lower-alpha !important;
            margin-top: 6px;
          }
          .pg-letter-signatory {
            display: flex;
            justify-content: space-between;
          }
          .pg-letter-num-3{
            display: flex;
          }
            .pg-letter-address{
              display: flex;
              justify-content: space-between;
            }
          .pg-letter-num-3 .left {
            flex: 1;
          }
          .pg-letter-num-3 .right {
            flex: 1;
          }
          .pg-letter-copy {
            margin-top: 14px;
          }
          .pg-letter-signature {
            
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .pg-letter-code {
            color: #374151;
            font-size: 12px;
            margin-top: 12px;
          }
          .pg-letter-nb {
            border-top: 1px solid #d7dee8;
            color: #374151;
            font-size: 12px;
            margin-top: 16px;
            padding-top: 10px;
          }
          @media print {
            @page {
              size: A4;
            }
            html,
            body {
              height: 100%;
              margin: 0;
              padding: 0;
              width: 100%;
            }
            .pg-admission-letter-print {
              box-shadow: none;
              margin: 0;
              max-width: none;
              min-height: 297mm;
              padding: 9mm 10mm;
              width: 210mm;
            }
            .pg-letter-head,
            .pg-letter-title h2,
            .pg-letter-title h3,
            .pg-letter-office-block strong {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          @media screen and (max-width: 768px) {
            .pg-admission-letter-print {
              font-size: 13px;
              margin: 12px;
              padding: 22px;
            }
            .pg-letter-head,
            .pg-letter-officers,
            .pg-letter-meta {
              grid-template-columns: 1fr;
            }
            .pg-letter-center-logo {
              order: -1;
            }
            .pg-letter-title,
            .pg-letter-office-left,
            .pg-letter-office-right {
              text-align: left;
            }
          }

          .pg-admission-letter-print .pg-letter-officers {
            --office-column-width: calc((100% - 140px) / 2);
            grid-template-columns: var(--office-column-width) 104px var(--office-column-width);
            width: 100%; align-items: start; column-gap: 18px;
          }
          .pg-admission-letter-print .pg-letter-office-side { min-width: 0; width: 100%; max-width: 100%; }
          .pg-admission-letter-print .pg-letter-office-right { width: max-content; max-width: 100%; justify-self: end; text-align: left; }
          .pg-admission-letter-print .pg-letter-center-logo { align-self: center; min-width: 0; }
          .pg-admission-letter-print .pg-letter-office-block { min-width: 0; width: 100%; line-height: 1.4; }
          .pg-admission-letter-print .pg-letter-office-block p { overflow-wrap: anywhere; }
          .pg-admission-letter-print .pg-letter-office-block .pg-letter-credentials { font-size: 10.5px; line-height: 1.5; margin: 2px 0 3px; }
          .pg-letter-credential-line { display: block; }
          .pg-letter-qualification { display: inline-block; max-width: 100%; vertical-align: top; overflow-wrap: anywhere; }
          @media screen and (max-width: 768px) {
            .pg-admission-letter-print .pg-letter-officers { grid-template-columns: minmax(0, 1fr); }
            .pg-admission-letter-print .pg-letter-office-right { width: 100%; justify-self: stretch; }
          }
        `}
      </style>

      <div className="pg-letter-head">
        <div className="pg-letter-title">
          <h2>University of Ibadan, Nigeria</h2>
          <h3>The Postgraduate College</h3>
          <p>Telegram: University of Ibadan</p>
        </div>
      </div>

      <div className="pg-letter-officers">
        <div className="pg-letter-office-side pg-letter-office-left">
          <OfficerBlock officer={official("provost")} />
          <OfficerBlock officer={deputyRegistrar} />
        </div>
        <div className="pg-letter-center-logo"><img src={logo} alt="University of Ibadan logo" /></div>
        <div className="pg-letter-office-side pg-letter-office-right">
          <OfficerBlock officer={official("deputy_provost_admin")} />
          <OfficerBlock officer={official("deputy_provost_academic")} />
        </div>
      </div>

      <div className="pg-letter-meta">
        <div className="left">
          <p>{session} Admission</p>
          <br />
          <p>{getCandidateName(applicant)}</p>
          <br />
          <p>
            {pick(biodata, [
              "permanent_address",
              "permanent_home_address",
              "postal_address",
              "address",
            ])}
          </p>
        </div>
        <div className="right">
          <p>Tel. 02-8100704</p>
          <p>02-8100705</p>
          <p>Telex: Campus 31128 NG</p>
          <p>
            Ref: UI/PGS/
            {pick(applicant, ["form_number", "formno", "form_no"], "303")}
          </p>
          <div className="pg-letter-date">
            <p>{letterDate}</p>
          </div>
        </div>
      </div>

      <div className="pg-letter-body">
        <p>
          Dear {salutationTitle} {surname},
        </p>

        <div className="pg-letter-heading">
          Offer of Provisional Admission and Registration for Higher Degree
          Course
        </div>

        <p>
          With reference to your application for admission to a higher degree of
          this University in the <strong>Department of {department}</strong>, it
          is my pleasure to inform you that the application is successful. Your
          registration will be on <strong>{modeOfStudy} Basis</strong> for the
          degree of{" "}
          <strong>
            {degree} [ {fieldOfInterest} ] in the First Semester of the{" "}
            {session} academic session.
          </strong>{" "}
          Your supervisor(s) shall be <strong>{supervisor}</strong>.
        </p>

        <ol>
          <p>
            1. Please take note of the following conditions relating to your
            admission/registration
            <ol>
              <li>
                <p>
                  (a) Higher Degree Students are expected to commence their
                  courses at the beginning of the {session} Session.
                </p>

                <p>
                  (b) You will be required to present the originals of your
                  educational/other relevant credentials including the NYSC
                  Discharge/Exemption Certificate, and obtain a clearance from
                  the appropriate officer of the Postgraduate College before you
                  may be allowed to pay the prescribed fees.
                </p>
                <p>
                  (c) You will thereafter be required to make appropriate
                  payment in accordance with the invoice generated on-line.
                </p>
                <p>
                  (d) This offer is provisional and may be revoked if you fail
                  to produce the documents (b & c) above within a period of six
                  weeks.
                </p>
              </li>
            </ol>
          </p>
          <p>
            2. Information on the Financial Regulations of the University for
            Higher Degree/Diploma can be found on the Postgraduate College Web
            Site (www.pgcollege.ui.edu.ng)
          </p>
          <p>
            3. For international students, when applying for entry permit or
            visa, you may be requested to furnish the Director-General, Federal
            Ministry of Internal Affairs, Abuja with the following items of
            information to accelerate the processing of your application:
            <ol>
              <li>
                <div className="pg-letter-num-3">
                  <div className="left">
                    <p>(a) Your nationality</p>
                    <p>(c) Passport number, date and place of issue</p>
                    <p>
                      (e) Anticipated length of stay at the University of Ibadan
                    </p>
                  </div>
                  <div className="right">
                    <p>(b) Date and place of birth</p>
                    <p>(d) Validity of Passport</p>
                    <p>(f) Sponsorship information</p>
                  </div>
                </div>
              </li>
            </ol>
            <p>
              <strong>
                It is important to note that a residence permit is necessary for
                the confirmation of an offer of admission.
              </strong>
            </p>
          </p>
          <p>
            4. Very limited Hall accommodation is available for full-time Higher
            Degree students and will be allocated on the basis of first-come
            first-served.
          </p>
          <p>
            5. You are required to register for your Programme of study within
            six weeks of the beginning of the academic year and{" "}
            <strong>
              renew your registration annually until you finally complete the
              programme.
            </strong>
            Late Registration after six weeks will automatically attract
            penalty.
          </p>
          <p>
            6. If you accept the offer, kindly print and complete 2 copies of
            the acceptance form on the Web Site.
          </p>
          <p>
            7. It is mandatory that you appear in person for clearance at the
            Admissions Office of The Postgraduate College.{" "}
            <strong>
              Please note that this offer will be revoked and your slot given to
              someone else, if within six weeks from the date of this letter you
              have neither completed and returned the printed acceptance forms
              nor submitted the originals of your credentials for clearance.
            </strong>
          </p>
        </ol>

        <div className="pg-letter-signatory">
          <div className="pg-letter-copy">
            <p>cc: Dean, Faculty of {faculty}</p>
            <p>Head, Department of {department}</p>
          </div>

          <div className="pg-letter-signature">
            <p>Yours Sincerely</p>
            {deputyRegistrar && letterStatus === "Signed" && (
              <img src={deputyRegistrarSignature} alt="Deputy Registrar signature" />
            )}
            <p>
              {deputyRegistrar?.name || "Signatory not provided"} <br />
              {deputyRegistrar?.title || ""}
            </p>
            <p className="pg-letter-code">
              <strong>Admission Letter Code: {letterCode}</strong>
            </p>
          </div>
        </div>

        <p className="pg-letter-nb">
          <strong>NB:</strong> This Offer of Admission is also subject to the
          receipt and authentication of your documents and certificates.
        </p>
        
        {admissionOfficer && <p>{admissionOfficer.name}<br />{admissionOfficer.title}</p>}
      </div>
    </div>
  );
}

export default AdmissionLetterPreview;

