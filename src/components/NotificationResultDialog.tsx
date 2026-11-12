import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, Printer, X } from "lucide-react";
import {
  buildNotificationResultDocument,
  loadNotificationResult,
  type NotificationResultData,
} from "../data/notificationResult";
import {
  loadLetterOfficials,
  type LetterOfficial,
} from "../data/letterOfficials";
import FlashToast from "./FlashToast";
import { useFlashToast } from "./useFlashToast";

const primary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50";

export default function NotificationResultDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const mounted = useRef(false);
  const busy = useRef(false);
  const [ready, setReady] = useState(false);
  const [officials, setOfficials] = useState<LetterOfficial[] | null>(null);
  const [result, setResult] = useState<NotificationResultData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadMessage, setLoadMessage] = useState(
    "Unable to load your notification of result.",
  );
  const [attempt, setAttempt] = useState(0);
  const [action, setAction] = useState<"download" | "print" | null>(null);
  const { toast, showToast, dismissToast } = useFlashToast();
  const html = useMemo(
    () =>
      officials && result
        ? buildNotificationResultDocument(result, officials)
        : "",
    [officials, result],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    setOfficials(null);
    setResult(null);
    setReady(false);
    void Promise.all([
      loadLetterOfficials(controller.signal),
      loadNotificationResult(controller.signal),
    ])
      .then(([records, nor]) => {
        if (!controller.signal.aborted) {
          setOfficials(records);
          setResult(nor);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Unable to load your notification of result.";
          setLoadError(true);
          setLoadMessage(message);
          showToast("error", message);
        }
      });
    return () => controller.abort();
  }, [attempt, showToast]);

  useEffect(() => {
    mounted.current = true;
    const dialog = dialogRef.current!;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      mounted.current = false;
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  async function run(next: "download" | "print") {
    if (busy.current || !officials || !result) return;
    busy.current = true;
    setAction(next);
    try {
      await new Promise((resolve) => setTimeout(resolve, 40));
      if (!mounted.current) return;
      if (next === "download") {
        const url = URL.createObjectURL(
          new Blob([html], { type: "text/html;charset=utf-8" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "notification-of-result.html";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast("success", "Notification of result download started.");
      } else {
        const frame = previewRef.current?.contentWindow;
        if (!frame) throw new Error("Preview unavailable");
        frame.focus();
        frame.print();
      }
    } catch {
      if (mounted.current)
        showToast("error", "Unable to prepare the document. Please try again.");
    } finally {
      busy.current = false;
      if (mounted.current) setAction(null);
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="result-title"
      className="suspension-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-[#071D36]/60"
    >
      <FlashToast toast={toast} onDismiss={dismissToast} />
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h2 id="result-title" className="text-lg font-bold">
            Notification of Result
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Your approved Notification of Higher Degree Result.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification of result"
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p role="alert" className="text-sm text-red-700">
            {loadMessage}
          </p>
          <button
            type="button"
            className={primary}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : !officials || !result ? (
        <div
          role="status"
          className="flex flex-1 items-center justify-center gap-2 text-sm text-navy"
        >
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading notification of result…
        </div>
      ) : (
        <iframe
          ref={previewRef}
          onLoad={() => setReady(true)}
          title="Notification of higher degree result preview"
          srcDoc={html}
          className="min-h-0 w-full flex-1 border-0 bg-slate-50"
        />
      )}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 p-4">
        <p className="mr-auto text-xs text-slate-500">
          Issued from your approved result record.
        </p>
        <button
          type="button"
          disabled={!!action || !ready || !result}
          aria-busy={action === "print"}
          className={primary}
          onClick={() => void run("print")}
        >
          {action === "print" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          {action === "print" ? "Preparing…" : "Print / Save PDF"}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
