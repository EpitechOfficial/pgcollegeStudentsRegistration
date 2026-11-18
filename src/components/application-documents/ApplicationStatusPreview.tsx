// @ts-nocheck
const logo = "/brand/pgc-logo.png";
const pgcLogo = "/brand/ui-logo.png";
import TranscriptSubmissionNotice from "./TranscriptSubmissionNotice";

const pick = (data, keys, fallback = "N/A") => {
  const value = keys
    .map((key) => data?.[key])
    .find((item) => item !== undefined && item !== null && item !== "");

  return value || fallback;
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

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getOtherNames = (applicant) =>
  [applicant.firstname, applicant.other_names].filter(Boolean).join(" ") ||
  "N/A";

const copyrightYear = new Date().getFullYear();

function StatusRow({ label, value }) {
  return (
    <div className="pg-status-row">
      <strong>{label}</strong>
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

function ApplicationStatusPreview({ data }) {
  const applicant = data.auth?.applicant || {};
  const application = data.auth?.application || {};
  const dashboard = data.auth?.dashboard || {};
  const eligibility = dashboard.eligibility || {};
  const admissionStatus = data.auth?.admission_status || {};
  const acceptanceStatus = data.auth?.acceptance || {};
  const referees = normalizeList(data.referees);
  const completedReferees = referees.filter(isCompletedRefereeReport).length;
  const transcriptUpload =
    data.auth?.transcript_upload &&
    typeof data.auth.transcript_upload === "object"
      ? data.auth.transcript_upload
      : {};
  const transcriptCount = Number(transcriptUpload.count) || 0;
  const transcriptStatus = transcriptUpload.uploaded
    ? "Received"
    : "Pending";
  const statusValue = String(eligibility.status || "").trim().toLowerCase();
  const applicantEligible = admissionStatus.eligibility;
  const applicantClearance = admissionStatus.clearance;
  const applicantRecommendation = admissionStatus.recommendation || "N/A";
  const applicantRecommendationDate = admissionStatus.recommendation_date || "N/A";
  const acceptanceFeePayment = acceptanceStatus.paid ? "Paid" : "Not Paid";
  const isAdmissionLetterPrepared = admissionStatus.letter_ready;
  const isAdmissionLetterSigned = admissionStatus.letter_signed;
  const admissionLetterSignedDate = admissionStatus.letter_date || "N/A";

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
          .pg-print-header h2,
          .pg-print-header h3 {
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
            margin-top: 14px;
            padding: 7px 18px;
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
          .pg-status-row {
            border-bottom: 1px solid #e5e7eb;
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 14px;
            padding: 6px 0;
          }
          .pg-status-row strong {
            color: #374151;
          }
          .pg-status-row span {
            color: #111827;
            overflow-wrap: anywhere;
          }
          .pg-status-note {
            color: #4b5563;
            font-size: 12px;
            margin: 8px 0 12px;
          }
          .pg-instructions {
            margin: 0;
            padding-left: 18px;
          }
          .pg-instructions li {
            margin-bottom: 10px;
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
            .pg-status-row {
              grid-template-columns: 280px 1fr;
            }
            .pg-print-header,
            .pg-print-section h4 {
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
            .pg-status-row {
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
        <div>
          <h2>The Postgraduate College</h2>
          <h2>University of Ibadan</h2>
          <h3>APPLICATION STATUS</h3>
        </div>
        <div className="pg-print-header-logo">
          <img src={pgcLogo} alt="The Postgraduate College logo" />
        </div>
      </div>

      <Section title="Basic">
        <StatusRow
          label="Application Number"
          value={pick(applicant, [
            "application_number",
            "applicationNumber",
            "appno",
            "numeration",
          ])}
        />
        <StatusRow label="Surname" value={pick(applicant, ["surname"])} />
        <StatusRow label="Other Names" value={getOtherNames(applicant)} />
        <StatusRow
          label="Form Number"
          value={pick(application, ["form_number", "formno", "form_no"])}
        />
        <StatusRow
          label="Proposed Faculty of Study"
          value={pick(application, ["faculty_name", "faculty"])}
        />
        <StatusRow
          label="Proposed Department of Study"
          value={pick(application, ["department_name", "department"])}
        />
        <StatusRow
          label="Proposed Degree / Diploma"
          value={pick(application, ["degree_name", "degree"])}
        />
        <StatusRow
          label="Proposed Mode of Study"
          value={pick(application, [
            "mode_of_study_name",
            "mode_of_study",
            "modeOfStudy",
          ])}
        />
        <StatusRow
          label="Field of Interest"
          value={pick(application, [
            "field_of_interest_name",
            "field_of_interest",
            "specialization",
          ])}
        />
      </Section>

      <Section title="APPLICATION STATUS">
        <StatusRow label="Applicant Eligibility" value={applicantEligible} />
        <StatusRow label="No. of Referees Added" value={referees.length} />
        <StatusRow
          label="No. of Referee Reports Completed"
          value={completedReferees}
        />
        <p className="pg-status-note">
          Please note that the determination of eligibility as Yes/No does not
          translate to being admitted.
        </p>
        <StatusRow
          label="English Proficiency Test"
          value={pick(dashboard.sections?.tpe || {}, ["status", "score"], "")}
        />
        <StatusRow
          label="Candidate Transcript"
          value={transcriptStatus}
        />
        <StatusRow label="No. of Transcripts Uploaded" value={transcriptCount} />
        <StatusRow
          label="Department's Decision on Application"
          value={applicantRecommendation}
        />
        <StatusRow
          label="Date Determined"
          value={applicantRecommendationDate}
        />
        <StatusRow
          label="Acceptance Fee Payment"
          value={acceptanceFeePayment}
        />
        <StatusRow
          label="Admission Letter Prepared"
          value={isAdmissionLetterPrepared}
        />
        <StatusRow
          label="Admission Approved and Admission Letter Signed by Deputy Registrar"
          value={isAdmissionLetterSigned}
        />
        <StatusRow
          label="Date Approved"
          value={admissionLetterSignedDate}
        />
      </Section>

      <Section title="PLEASE STRICTLY OBEY THE FOLLOWING INSTRUCTIONS">
        <ol className="pg-instructions">
          <li>
            Please login to your Application online through the Login to Print
            Documents options. On the Application Menu Page, Click the 'Print
            Admission Letter' Button and Print your copy of the Admission Letter
            for yourself. Also on the Application Menu Page, Click the 'Print
            Acceptance Form' Button to print your Acceptance Form.
          </li>
          <li>
            Go to http://pgcollege.ui.edu.ng and Click on Admission then Click on
            'Print Acceptance Invoice' to generate Acceptance Invoice.
          </li>
          <li>
            After you had defrayed the Acceptance Fee, The Schedule Officer
            managing your faculty at the Admissions Office of the PG College
            will communicate with you within a short time and schedule a
            specific date and time you are to come for physical inspection of
            ALL your credentials. You will be required to present the originals
            of your educational/other relevant credentials including the NYSC
            Certificates (Statement of Results is NOT acceptable), and obtain a
            clearance from the appropriate officer of the Postgraduate College.
            Please strictly follow the date and time scheduled. Otherwise, you
            MAY FORFEIT THE ADMISSION.
          </li>
          <li>
            This offer is provisional and The PG College UI reserves the right to
            revoke it.
          </li>
        </ol>
        <p className="pg-status-note">
          <strong>NB:</strong> This Offer of Admission is also subject to the
          receipt of your Masters Certificate.
        </p>
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

export default ApplicationStatusPreview;

