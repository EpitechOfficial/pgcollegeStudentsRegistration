// @ts-nocheck
import { useState } from "react";

const TRANSCRIPT_EMAIL = "admissions@pgcollege.ui.edu.ng";

function TranscriptSubmissionNotice({ compact = false }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(TRANSCRIPT_EMAIL);
    } catch {
      const input = document.createElement("textarea");
      input.value = TRANSCRIPT_EMAIL;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>
        {`
          @media print {
            .transcript-email-copy-button {
              display: none !important;
            }
          }
        `}
      </style>
      <div
        style={{
          backgroundColor: "#f0f7ff",
          border: "1px solid #b7d4f4",
          borderLeft: "4px solid #1b4b8f",
          borderRadius: "4px",
          color: "#26374a",
          fontSize: compact ? "12px" : "13px",
          lineHeight: 1.5,
          margin: compact ? "14px 0 0" : "20px 0 12px",
          padding: compact ? "9px 11px" : "11px 13px",
        }}
      >
        <strong>Electronic Transcript Submission:</strong>{" "}
        If your institution is sending an electronic copy of your academic
        transcript for the admission process, it should be sent directly to{" "}
        <strong style={{ color: "#1b4b8f", overflowWrap: "anywhere" }}>
          {TRANSCRIPT_EMAIL}
        </strong>{" "}
        <button
          type="button"
          className="transcript-email-copy-button"
          onClick={copyEmail}
          title="Copy transcript email address"
          style={{
            background: "transparent",
            border: 0,
            color: copied ? "#198754" : "#1b4b8f",
            cursor: "pointer",
            fontSize: "inherit",
            fontWeight: 700,
            padding: "0 3px",
          }}
        >
          <i className={`fa ${copied ? "fa-check" : "fa-copy"} me-1`}></i>
          {copied ? "Copied" : "Copy"}
        </button>
        .
      </div>
    </>
  );
}

export default TranscriptSubmissionNotice;

