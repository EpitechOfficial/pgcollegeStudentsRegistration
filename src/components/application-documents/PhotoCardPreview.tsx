// @ts-nocheck
const logo = "/brand/pgc-logo.png";
const pgcLogo = "/brand/ui-logo.png";
import { formatDateEnGb } from "./dateFormat";
import TranscriptSubmissionNotice from "./TranscriptSubmissionNotice";

const pick = (data, keys, fallback = "N/A") => {
  const value = keys
    .map((key) => data?.[key])
    .find((item) => item !== undefined && item !== null && item !== "");

  return value || fallback;
};

const formatDate = (value) => {
  return formatDateEnGb(value, { fallback: "N/A" });
};

const formatTpeDate = (value) => {
  return formatDateEnGb(value, { month: "long", fallback: "N/A" });
};

const formatTpeTime = (value) => {
  if (!value) return "N/A";

  const input = String(value).trim();
  const match = input.match(/(?:^|[T\s])(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);

  if (!match) return input;

  let hour = Number(match[1]);
  const minute = match[2];
  const suppliedPeriod = match[3]?.toUpperCase();

  if (suppliedPeriod === "PM" && hour < 12) hour += 12;
  if (suppliedPeriod === "AM" && hour === 12) hour = 0;

  if (hour === 12 && minute === "00") return "12 Noon";

  const period = (hour < 12 && hour > 6) ? "AM" : "PM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
};

const getCandidateName = (applicant) => {
  const otherNames = [applicant.firstname, applicant.other_names]
    .filter(Boolean)
    .join(" ");
  return [applicant.surname, otherNames].filter(Boolean).join(", ") || "N/A";
};

const copyrightYear = new Date().getFullYear();

function FieldRow({ label, value }) {
  return (
    <div className="pg-print-row">
      <strong>{label}:</strong>
      <span>{value || "N/A"}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="pg-print-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function PhotoCardPreview({ data }) {
  const applicant = data.auth?.applicant || {};
  const application = data.auth?.application || {};
  const biodata = data.biodata || {};
  const dashboard = data.auth?.dashboard || {};
  const sectionTpe =
    dashboard.sections?.tpe && typeof dashboard.sections.tpe === "object"
      ? dashboard.sections.tpe
      : {};
  const eligibilityTpe =
    dashboard.eligibility?.tpe && typeof dashboard.eligibility.tpe === "object"
      ? dashboard.eligibility.tpe
      : {};
  const tpe = { ...eligibilityTpe, ...sectionTpe };

  return (
    <div className="pg-application-print">
      <style>
        {`
          .pg-application-print {
            background: #fff;
            color: #1f2933;
            font-family: Arial, sans-serif;
            font-size: 13px;
            line-height: 1.45;
            margin: 6px auto;
            max-width: 1100px;
            min-height: 1120px;
            padding: 18px 22px;
          }
          .pg-print-header {
            align-items: center;
            border: 2px solid #3C4CB8;
            border-radius: 4px;
            display: grid;
            grid-template-columns: 90px 1fr 90px;
            gap: 18px;
            margin-bottom: 18px;
            padding: 12px;
            text-align: center;
          }
          .pg-print-header-logo {
            align-items: center;
            display: flex;
            justify-content: center;
          }
          .pg-print-header-logo img {
            max-height: 76px;
            max-width: 86px;
            object-fit: contain;
          }
          .pg-print-header-content {
            min-width: 0;
          }
          .pg-print-header h2,
          .pg-print-header h3,
          .pg-print-header p {
            margin: 0;
          }
          .pg-print-header h2 {
            color: #4b5563;
            font-size: 22px;
            font-weight: 700;
            line-height: 1.25;
          }
          .pg-print-header h3 {
            background: #3C4CB8;
            color: #fff;
            display: inline-block;
            font-size: 15px;
            letter-spacing: 0;
            margin-top: 14px;
            padding: 7px 18px;
          }
          .pg-print-meta {
            background: #f8fafc;
            border: 1px solid #d7dee8;
            border-radius: 4px;
            margin: 18px 0 8px;
            padding: 12px 14px;
          }
          .pg-print-section {
            break-inside: avoid;
            margin-top: 20px;
          }
          .pg-print-section h4 {
            background: #eef0ff;
            border-left: 4px solid #3C4CB8;
            color: #26337f;
            font-size: 14px;
            margin-bottom: 10px;
            padding: 8px 10px;
          }
          .pg-print-row {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 12px;
            margin-bottom: 6px;
          }
          .pg-print-row strong {
            color: #374151;
          }
          .pg-print-row span {
            color: #111827;
            overflow-wrap: anywhere;
          }
          .pg-print-biodata {
            display: grid;
            grid-template-columns: 1fr 120px;
            gap: 20px;
          }
          .pg-print-passport {
            align-items: center;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            color: #6b7280;
            display: flex;
            height: 120px;
            justify-content: center;
            text-align: center;
            width: 120px;
          }
          .pg-print-passport img {
            height: 100%;
            object-fit: cover;
            width: 100%;
          }
          .pg-print-two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 18px;
          }
          .pg-print-table {
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 10px;
            width: 100%;
          }
          .pg-print-table th,
          .pg-print-table td {
            border: 1px solid #cbd5e1;
            padding: 6px;
            text-align: left;
            vertical-align: top;
          }
          .pg-print-table th {
            background: #f1f5f9;
            color: #374151;
            font-weight: 700;
          }
          .pg-print-declaration {
            border-top: 1px solid #d7dee8;
            margin-top: 24px;
            padding-top: 14px;
          }
          .pg-print-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 26px 0 14px;
          }
          .pg-print-sign-line {
            border-bottom: 1px dotted #111827;
            height: 26px;
          }
          .pg-print-note {
            background: #f8fafc;
            border: 1px solid #d7dee8;
            padding: 10px;
          }
          .pg-print-footer {
            border-top: 1px solid #d7dee8;
            color: #4b5563;
            margin-top: 30px;
            padding-top: 12px;
            text-align: center;
          }
          .pg-print-footer p {
            margin: 2px 0;
          }
          @media print {
            @page {
              size: A4;
            }

            .pg-application-print {
              margin: 0 auto;
              max-width: 100%;
              padding: 12px 14px;
            }
            .pg-print-header {
              grid-template-columns: 90px 1fr 90px;
            }
            .pg-print-biodata {
              grid-template-columns: 1fr 120px;
            }
            .pg-print-row {
              grid-template-columns: 220px 1fr;
              gap: 12px;
            }
            .pg-print-header,
            .pg-print-meta,
            .pg-print-section h4,
            .pg-print-table th,
            .pg-print-note {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          @media screen and (max-width: 768px) {
            .pg-application-print {
              margin: 6px;
              padding: 14px;
            }
            .pg-print-header {
              grid-template-columns: 56px 1fr 56px;
              gap: 10px;
              padding: 14px;
            }
            .pg-print-header-logo img {
              max-height: 52px;
              max-width: 52px;
            }
            .pg-print-header h2 {
              font-size: 17px;
            }
            .pg-print-biodata,
            .pg-print-two-column,
            .pg-print-signatures {
              grid-template-columns: 1fr;
            }
            .pg-print-row {
              grid-template-columns: 1fr;
              gap: 2px;
            }
          }
        `}
      </style>

      <div className="pg-print-header">
        <div className="pg-print-header-logo">
          <img src={logo} alt="University of Ibadan logo" />
        </div>
        <div className="pg-print-header-content">
          <h2>The Postgraduate College</h2>
          <h2>University of Ibadan</h2>
          <h3>Photo Card</h3>
        </div>
        <div className="pg-print-header-logo">
          <img src={pgcLogo} alt="The Postgraduate College logo" />
        </div>
      </div>

      <div className="pg-print-meta">
        <FieldRow
          label="Application Number"
          value={pick(applicant, [
            "application_number",
            "applicationNumber",
            "appno",
            "numeration",
          ])}
        />
        <FieldRow
          label="Form Number"
          value={pick(application, ["form_number", "formno", "form_no"])}
        />
        <FieldRow
          label="Session"
          value={pick(application, ["session", "apply_session"])}
        />
      </div>

      <Section title="BIODATA INFORMATION">
        <div className="pg-print-biodata">
          <div>
            <FieldRow label="Name of Candidate" value={getCandidateName(applicant)} />
            <FieldRow
              label="Maiden Name"
              value={pick(biodata, ["maiden_name", "maidenName"], "Not Applicable")}
            />
            <FieldRow
              label="Date of Birth"
              value={formatDate(pick(biodata, ["date_of_birth", "dob"], ""))}
            />
            <FieldRow
              label="State of Origin"
              value={pick(biodata, ["state", "state_of_origin"])}
            />
            <FieldRow
              label="Country of Origin"
              value={pick(
                biodata,
                ["country", "country_of_origin", "nationality"],
                pick(applicant, ["nationality"]),
              )}
            />
            <FieldRow
              label="Local Government Area"
              value={pick(biodata, ["lga", "local_govt_area"])}
            />
          </div>
          <div className="pg-print-passport">
            {pick(biodata, ["passport_photo_url", "passport_photo", "photo_url"], "") ? (
              <img
                alt="Passport"
                src={pick(biodata, ["passport_photo_url", "passport_photo", "photo_url"], "")}
              />
            ) : (
              <span>No Passport</span>
            )}
          </div>
        </div>
      </Section>

      <Section title="PROPOSED PROGRAM OF STUDY">
        <div className="pg-print-two-column">
          <FieldRow
            label="Proposed Faculty of Study"
            value={pick(application, ["faculty_name", "faculty"])}
          />
          <FieldRow
            label="Proposed Department of Study"
            value={pick(application, ["department_name", "department"])}
          />
          <FieldRow
            label="Proposed Degree / Diploma"
            value={pick(application, ["degree_name", "degree"])}
          />
          <FieldRow
            label="Proposed Mode of Study"
            value={pick(application, [
              "mode_of_study_name",
              "mode_of_study",
              "modeOfStudy",
            ])}
          />
          <FieldRow
            label="Field of Interest"
            value={pick(application, [
              "field_of_interest_name",
              "field_of_interest",
              "specialization",
            ])}
          />
        </div>
      </Section>

      <Section title="Test of Proficiency Details">
        <div className="pg-print-two-column">
          <FieldRow
            label="TPE Date"
            value={formatTpeDate(
              pick(tpe, ["date", "tpe_date", "test_date", "exam_date"], ""),
            )}
          />
          <FieldRow
            label="TPE Time"
            value={formatTpeTime(
              pick(tpe, ["time", "tpe_time", "test_time", "exam_time"], ""),
            )}
          />
          <FieldRow
            label="Hall"
            value={pick(tpe, ["hall", "tpe_hall", "test_hall", "venue", "location"])}
          />
          <FieldRow
            label="Seat Number"
            value={pick(tpe, ["seat_number", "seat_no", "seatNumber", "seat"])}
          />
        </div>
      </Section>

      <TranscriptSubmissionNotice />

      <div className="pg-print-footer">
        <p>Copyright Â© {copyrightYear} The Postgraduate College, I.T. Unit</p>
        <p>Contact: Tel: 09090561432</p>
        <p>Email: informationdesk@pgcollege.ui.edu.ng</p>
      </div>
    </div>
  );
}

export default PhotoCardPreview;

