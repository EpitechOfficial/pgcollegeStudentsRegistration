// @ts-nocheck
const logo = "/brand/pgc-logo.png";
const pgcLogo = "/brand/ui-logo.png";
import { generateAcceptanceInvoice } from "./documentSupport";
import {
  closeAcceptancePaymentLoading,
  showAcceptancePaymentConfirmation,
  showAcceptancePaymentLoading,
} from "./documentSupport";
import { formatDateEnGb } from "./dateFormat";
import { notifyError, notifySuccess } from "./documentSupport";
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

const getCandidateName = (applicant) => {
  const otherNames = [applicant.firstname, applicant.other_names]
    .filter(Boolean)
    .join(" ");
  return [applicant.surname, otherNames].filter(Boolean).join(", ") || "N/A";
};

const copyrightYear = new Date().getFullYear();

const hasPaidAcceptanceFee = (acceptance) => {
  if (typeof acceptance === "boolean") return acceptance;
  return acceptance?.paid === true;
};

const isTruthyStatus = (value, accepted = ["yes", "true", "1"]) => {
  if (typeof value === "boolean") return value;
  return accepted.includes(String(value || "").trim().toLowerCase());
};
  const isEligible =(admissionStatus) => isTruthyStatus(admissionStatus.eligibility, ["eligible", "yes", "true", "1"]);

const isRecommendedForAdmission = (admissionStatus) =>
  isTruthyStatus(admissionStatus?.recommendation, ["recommended",]);

const isAdmissionLetterReady = (admissionStatus) =>
  isTruthyStatus(admissionStatus?.letter_ready, ["yes", "true", "1", "ready"]);

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

function AcceptanceFormPreview({ data }) {
  const applicant = data?.auth?.applicant || {};
  const application = data?.auth?.application || {};
  const admissionStatus = data?.auth?.admission_status || {};
  const biodata = data?.biodata || {};
  const previousAdmission = data?.auth?.previous_admission || {};
  const education = normalizeList(data?.education);
  const sponsors = normalizeList(data?.sponsors);
  const isAcceptancePaid = hasPaidAcceptanceFee(data?.auth?.acceptance);
  const isRecommended = isRecommendedForAdmission(admissionStatus);
  const letterReady = isAdmissionLetterReady(admissionStatus);
  const isEligibleForAdmission = isEligible(admissionStatus);
  const canPayAcceptanceFee = !isAcceptancePaid && isRecommended && letterReady && isEligibleForAdmission;
  const paymentUnavailableReason = !isRecommended
    ? "Acceptance payment will be available after your application has been recommended."
    : !letterReady
      ? "Acceptance payment will be available after your admission letter is ready."
      : !isEligibleForAdmission
        ? "Acceptance payment will be available after your eligibility for admission has been confirmed."
        : "";

  const handleAcceptancePayment = async () => {
    if (!canPayAcceptanceFee) {
      notifyError(paymentUnavailableReason || "Acceptance payment is not available yet.");
      return;
    }

    const result = await showAcceptancePaymentConfirmation();

    if (!result.isConfirmed) return;

    showAcceptancePaymentLoading();

    try {
      const response = await generateAcceptanceInvoice();
      const invoiceData = response.data?.data || response.data || {};
      const paymentUrl =
        invoiceData.authorization_url ||
        invoiceData.payment_link ||
        invoiceData.url;

      closeAcceptancePaymentLoading();
      notifySuccess(
        response.data?.message ||
          "Acceptance invoice generated successfully. Redirecting to payment page...",
      );

      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (error) {
      closeAcceptancePaymentLoading();
      notifyError(
        error.response?.data?.message ||
          "Unable to generate acceptance invoice. Please try again.",
      );
    }
  };

  if (!isAcceptancePaid ) {
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
            Acceptance Fee Payment Required
          </h4>

          <p className="text-muted mb-0 mx-auto" style={{ maxWidth: 520 }}>
            {canPayAcceptanceFee
              ? "Payment of the acceptance fee is required before you can print the acceptance form. Please proceed to make the payment and try again."
              : paymentUnavailableReason}
          </p>
          {canPayAcceptanceFee && (
            <button
              type="button"
              title="Click to make acceptance payment"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              className="btn btn-secondary mt-3"
              onClick={handleAcceptancePayment}
            >
              Pay Acceptance Fee
              <i className="fas fa-credit-card ms-2"></i>
            </button>
          )}
        </div>
      </div>
    );
  }
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
          <h3>ACCEPTANCE OF OFFER OF PROVISIONAL ADMISSION</h3>
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
            <FieldRow
              label="Name of Candidate"
              value={getCandidateName(applicant)}
            />
            <FieldRow
              label="Maiden Name"
              value={pick(
                biodata,
                ["maiden_name", "maidenName"],
                "Not Applicable",
              )}
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
              label="Local Government Area"
              value={pick(biodata, [
                "lga",
                "local_government",
                "local_government_area",
              ])}
            />
            <FieldRow
              label="Permanent Home Address"
              value={pick(biodata, [
                "permanent_address",
                "permanentAddress",
                "home_address",
              ])}
            />
          </div>
          <div className="pg-print-passport">
            {pick(
              biodata,
              ["passport_photo_url", "passport_photo", "photo_url"],
              "",
            ) ? (
              <img
                alt="Passport"
                src={pick(
                  biodata,
                  ["passport_photo_url", "passport_photo", "photo_url"],
                  "",
                )}
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

      <Section title="SPONSORSHIP">
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
                  <td>
                    {pick(record, [
                      "school",
                      "institution",
                      "institution_name",
                    ])}
                  </td>
                  <td>
                    {pick(record, ["from_month"])},{" "}
                    {pick(record, ["from_year"])}
                  </td>
                  <td>
                    {pick(record, ["to_month"])}, {pick(record, ["to_year"])}
                  </td>
                  <td>
                    {pick(record, ["degree", "degree_name", "qualification"])}
                  </td>
                  <td>
                    {formatDate(
                      pick(
                        record,
                        ["award_date", "date_award", "date_of_award"],
                        "",
                      ),
                    )}
                  </td>
                  <td>
                    {pick(record, ["course", "course_of_study", "discipline"])}
                  </td>
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

      <div className="pg-print-declaration">
        <p>
          Declaration: I
          ................................................................
          accept the offer of admission into the above programme. Any alteration
          renders the document invalid
        </p>
        <div className="pg-print-signatures">
          <div>
            <div className="pg-print-sign-line"></div>
            <strong>Signature</strong>
          </div>
          <div>
            <div className="pg-print-sign-line"></div>
            <strong>Date</strong>
          </div>
        </div>
        <p className="pg-print-note">
          <strong>Note:</strong> The University is not bound to honour any
          request for the deferment of an offer not taken up in any given
          academic year. Candidates requesting for deferment offers are
          therefore advised to re-apply for admission in the following year.
        </p>
      </div>

      <TranscriptSubmissionNotice />

      <div className="pg-print-footer">
        <p>Copyright Â© {copyrightYear} The Postgraduate College, I.T. Unit</p>
        <p>Contact: Tel: 09090561432</p>
        <p>Email: informationdesk@pgcollege.ui.edu.ng</p>
      </div>
    </div>
  );
}

export default AcceptanceFormPreview;

