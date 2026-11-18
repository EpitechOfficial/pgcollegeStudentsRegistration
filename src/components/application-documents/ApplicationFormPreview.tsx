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

const normalizeList = (value) => (Array.isArray(value) ? value : []);

const isCompletedRefereeReport = (referee = {}) => {
  if (
    referee.responded === true ||
    referee.report_submitted === true ||
    referee.completed === true
  ) {
    return true;
  }

  const status = String(
    referee.status || referee.report_status || referee.reportStatus || "",
  )
    .trim()
    .toLowerCase();

  return ["completed", "submitted", "responded"].includes(status);
};

const getApplicantName = (applicant) =>
  [applicant.firstname, applicant.other_names]
    .filter(Boolean)
    .join(" ") || "N/A";

const getOlevelSubjects = (record) =>
  Array.from({ length: 9 }, (_, index) => ({
    subject: pick(record, [`sub${index + 1}`, `subject${index + 1}`], "N/A"),
    grade: pick(record, [`grade${index + 1}`], "N/A"),
  }));

const getDocumentName = (document) =>
  pick(document, ["document_name", "original_name", "file_name", "degree"], "Document");

const copyrightYear = new Date().getFullYear();

function FieldRow({ label, value }) {
  const displayValue =
    value === undefined || value === null || value === "" ? "N/A" : value;

  return (
    <div className="pg-print-row">
      <strong>{label}:</strong>
      <span>{displayValue}</span>
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

function ApplicationFormPreview({ data }) {
  const applicant = data.auth?.applicant || {};
  const application = data.auth?.application || {};
  const biodata = data.biodata || {};
  const previousAdmission = data.auth?.previous_admission || {};
  const dashboard = data.auth?.dashboard || {};
  const tpe = dashboard.sections?.tpe || dashboard.eligibility?.tpe || {};
  const education = normalizeList(data.education);
  const olevel = normalizeList(data.olevel);
  const employment = normalizeList(data.employment);
  const publications = normalizeList(data.publications);
  const referees = normalizeList(data.referees);
  const completedReferees = referees.filter(isCompletedRefereeReport).length;
  const sponsors = normalizeList(data.sponsors);
  const documents = normalizeList(data.documents);

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
            position: relative;
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
          .pg-print-header p {
            color: #4b5563;
            font-size: 14px;
            margin-top: 4px;
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
          .pg-print-table tbody tr:nth-child(even) td {
            background: #fbfdff;
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
            .pg-print-table th {
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
            .pg-print-biodata {
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
          <h3>APPLICATION FORM</h3>
        </div>
        <div className="pg-print-header-logo">
          <img src={pgcLogo} alt="The Postgraduate College logo" />
        </div>
      </div>

      <div className="pg-print-meta">
        <FieldRow
          label="Application Number"
          value={pick(applicant, ["application_number", "applicationNumber", "appno", "numeration"])}
        />
        <FieldRow label="Form Number" value={pick(application, ["form_number", "formno", "form_no"])} />
        <FieldRow label="Session" value={pick(application, ["session", "apply_session"])} />
      </div>

      <Section title="BIODATA INFORMATION">
        <div className="pg-print-biodata">
          <div>
            <FieldRow label="Surname" value={pick(applicant, ["surname"])} />
            <FieldRow label="Other Name(s)" value={getApplicantName(applicant)} />
            <FieldRow label="Gender" value={pick(biodata, ["gender", "sex", "sex_name"])} />
            <FieldRow label="Maiden Name" value={pick(biodata, ["maiden_name", "maidenName"], "Not Applicable")} />
            <FieldRow label="Date of Birth" value={formatDate(pick(biodata, ["date_of_birth", "dob"], ""))} />
            <FieldRow label="Marital Status" value={pick(biodata, ["marital_status", "maritalStatus"])} />
            <FieldRow label="Physical Challenges" value={pick(biodata, ["physical_challenge", "physical_challenges"], "None")} />
            <FieldRow label="Country of Origin" value={pick(biodata, ["country", "country_of_origin", "nationality"], pick(applicant, ["nationality"]))} />
            <FieldRow label="State of Origin" value={pick(biodata, ["state", "state_of_origin"])} />
            <FieldRow label="Local Government Area" value={pick(biodata, ["lga", "local_govt_area"])} />
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

      <Section title="CONTACT INFORMATION">
        <FieldRow label="Postal Address" value={pick(biodata, ["postal_address", "postalAddress", "address"])} />
        <FieldRow label="Permanent Home Address" value={pick(biodata, ["permanent_address", "permanentAddress", "home_address"])} />
        <FieldRow label="Telephone Number" value={pick(applicant, ["telephone", "phone", "phone_number"])} />
        <FieldRow label="E-Mail Address" value={pick(applicant, ["email"])} />
      </Section>

      <Section title="PROPOSED PROGRAM OF STUDY">
        <FieldRow label="Proposed Faculty of Study" value={pick(application, ["faculty_name", "faculty"])} />
        <FieldRow label="Proposed Department of Study" value={pick(application, ["department_name", "department"])} />
        <FieldRow label="Proposed Degree / Diploma" value={pick(application, ["degree_name", "degree"])} />
        <FieldRow label="Proposed Mode of Study" value={pick(application, ["mode_of_study_name", "mode_of_study", "modeOfStudy"])} />
        <FieldRow label="Field of Interest" value={pick(application, ["field_of_interest_name", "field_of_interest", "specialization"])} />
      </Section>

      <Section title="EDUCATIONAL RECORD(S)">
        <table className="pg-print-table">
          <thead>
            <tr>
              <th>School</th>
              <th>From</th>
              <th>To</th>
              <th>Degree / Diploma</th>
              <th>Date of Award</th>
              <th>Course of Study/Discipline</th>
              <th>Class Obtained</th>
            </tr>
          </thead>
          <tbody>
            {education.length ? (
              education.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{pick(record, ["school", "institution", "institution_name"])}</td>
                  <td>{pick(record, ["from_month"])}, {pick(record, ["from_year"])}</td>
                  <td>{pick(record, ["to_month"])}, {pick(record, ["to_year"])}</td>
                  <td>{pick(record, ["degree", "degree_name", "qualification"])}</td>
                  <td>{formatDate(pick(record, ["award_date", "date_award", "date_of_award"], ""))}</td>
                  <td>{pick(record, ["course", "course_of_study", "discipline"])}</td>
                  <td>{pick(record, ["class", "class_name", "obtained"])}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No educational record provided.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="HAVE YOU EVER BEEN ADMITTED TO THIS UNIVERSITY ?">
        <FieldRow label="Response" value={pick(previousAdmission, ["response", "prev_apply"], pick(application, ["prev_apply"], "No"))} />
        <FieldRow label="Session of Application" value={pick(previousAdmission, ["session", "apply_session"], pick(application, ["apply_session"]))} />
        <FieldRow label="Matric Number" value={pick(previousAdmission, ["matric", "matric_number"], pick(application, ["matric"]))} />
      </Section>

      <Section title="O'LEVEL INFORMATION">
        {olevel.length ? (
          olevel.map((record, index) => (
            <div key={record.id || index} className="mb-3">
              <FieldRow label="Sitting(s)" value={index + 1} />
              <FieldRow label="Certificate Title" value={pick(record, ["certificate", "certificate_title"])} />
              <FieldRow label="Month" value={pick(record, ["month"])} />
              <FieldRow label="Year" value={pick(record, ["year"])} />
              <table className="pg-print-table">
                <tbody>
                  <tr>
                    <th>Subject</th>
                    {getOlevelSubjects(record).map((entry, subjectIndex) => (
                      <td key={`subject-${subjectIndex}`}>{entry.subject}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>Grade</th>
                    {getOlevelSubjects(record).map((entry, gradeIndex) => (
                      <td key={`grade-${gradeIndex}`}>{entry.grade}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p>No O-Level record provided.</p>
        )}
      </Section>

      <Section title="LIST OF APPOINTMENT IN THE PAST FIVE YEARS">
        <table className="pg-print-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Employer</th>
              <th>Period Covered (From - To)</th>
            </tr>
          </thead>
          <tbody>
            {employment.length ? (
              employment.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{pick(record, ["postheld", "position"])}</td>
                  <td>{pick(record, ["employer", "organization"])}</td>
                  <td>
                    {pick(record, ["from", "start_date"], "")} -{" "}
                    {pick(record, ["to", "end_date"], "")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No appointment record provided.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="PUBLICATIONS AND TITLE OF THESIS, DISSERTATION OR ESSAY SUBMITTED FOR ANY DEGREE">
        <table className="pg-print-table">
          <thead>
            <tr>
              <th>Publication</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {publications.length ? (
              publications.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{pick(record, ["pub_title", "title"])}</td>
                  <td>{formatDate(pick(record, ["date", "pub_date"], ""))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No publication record provided.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="THREE PERSONS TO WHOM REFERENCE MAY BE MADE">
        <table className="pg-print-table">
          <thead>
            <tr>
              <th>Name of Referee</th>
              <th>Position/Rank</th>
              <th>Email</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {referees.length ? (
              referees.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{pick(record, ["referee_name"])}</td>
                  <td>{pick(record, ["referee_position"])}</td>
                  <td>{pick(record, ["referee_email"])}</td>
                  <td>{pick(record, ["referee_address"])}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No referee record provided.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="REFEREES REPORT">
        <FieldRow
          label="Number of Referees who have responded to mail"
          value={completedReferees}
        />
      </Section>

      <Section title="SPONSORSHIP INFORMATION">
        <table className="pg-print-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.length ? (
              sponsors.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{pick(record, ["name", "sponsor_name"])}</td>
                  <td>{pick(record, ["address", "sponsor_address"])}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No sponsorship record provided.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="TEST OF PROFICIENCY IN ENGLISH">
        <FieldRow label="Test Location" value={pick(tpe, ["location"], "None")} />
        <FieldRow label="Test Score" value={pick(tpe, ["score", "candidate_score"], "Pending")} />
      </Section>

      <Section title="Uploaded Document(s)">
        <table className="pg-print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Document(s)</th>
            </tr>
          </thead>
          <tbody>
            {documents.length ? (
              documents.map((document, index) => (
                <tr key={document.id || index}>
                  <td>{index + 1}</td>
                  <td>{getDocumentName(document)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No uploaded document found.</td>
              </tr>
            )}
          </tbody>
        </table>
        <p>Number of Uploaded Document(s): {documents.length}</p>
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

export default ApplicationFormPreview;

