"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { submitPlagiarismReport } from "@/app/actions/plagiarismReports";

type Props = {
  storyId: string;
  chapterId?: string | null;
};

export default function ReportPlagiarismButton({
  storyId,
  chapterId = null,
}: Props) {
  const [open, setOpen] = useState(false);
  const [originalUrl, setOriginalUrl] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setMessage(null);
  }

  function submit() {
    startTransition(async () => {
      const result = await submitPlagiarismReport({
        storyId,
        chapterId,
        originalUrl,
        details,
      });

      if (result.ok) {
        setMessage({
          ok: true,
          text: "Thank you. Our team will review your report.",
        });
        setDetails("");
        setOriginalUrl("");
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm opacity-60 transition hover:opacity-100"
      >
        <Flag size={14} />
        Report plagiarism
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10001] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
        >
          <div
            role="dialog"
            aria-label="Report plagiarism"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-card-border bg-background p-5 text-foreground shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Report plagiarism</h2>

                <p className="mt-1 text-sm opacity-70">
                  Think this story copies someone else&apos;s work? Tell us
                  where the original is and what was copied. Our team reviews
                  every report.
                </p>
              </div>

              <button
                onClick={close}
                aria-label="Close"
                className="opacity-60 hover:opacity-100"
              >
                <X size={20} />
              </button>
            </div>

            {message?.ok ? (
              <p className="mt-5 rounded-lg border border-card-border p-4 text-sm">
                {message.text}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                <label className="block text-sm">
                  <span className="font-medium">
                    Link to the original (optional)
                  </span>

                  <input
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-card-border bg-background p-3"
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-medium">What was copied?</span>

                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={5}
                    placeholder="For example: chapters 1 to 3 are word-for-word the same as the original, which was published earlier."
                    className="mt-1 w-full rounded-lg border border-card-border bg-background p-3"
                  />
                </label>

                {message && !message.ok && (
                  <p className="text-sm text-red-500">{message.text}</p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={close}
                    className="rounded-lg px-4 py-2 text-sm opacity-70 hover:opacity-100"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={submit}
                    disabled={pending || details.trim().length < 20}
                    className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--button)",
                      color: "var(--button-text)",
                    }}
                  >
                    {pending ? "Sending..." : "Send report"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}