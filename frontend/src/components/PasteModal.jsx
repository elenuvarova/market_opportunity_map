import { useEffect, useRef, useState } from "react";
import { assembleFromPaste } from "../lib/api";
import { setupFocusTrap } from "../lib/focusTrap";
import { useOverlayLock } from "../lib/useOverlayLock";

const TABS = [
  {
    key: "competitors",
    label: "Competitors",
    placeholder:
      "One competitor per line. Optional format:\nName | what they do | rough price tier\n\nNotion | docs and templates | Freemium\nAirtable | spreadsheet-database | Paid\nMonday | project tracking | Enterprise",
    field: "competitors_text",
  },
  {
    key: "pains",
    label: "Pains",
    placeholder:
      "One pain per line. Optional format:\nSegment :: pain :: severity 1-10\n\nStartup founders :: Hard to keep org docs current :: 8\nProduct managers :: PRDs disconnected from execution :: 9",
    field: "pains_text",
  },
  {
    key: "quotes",
    label: "Interview quotes",
    placeholder:
      "Paste customer quotes, one per blank-line-separated block.\n\nKeywords like 'frustrated', 'hate', 'painful', 'broken', 'slow' bump severity automatically.\n\nWe hate that our PRDs sit in Google Docs while engineering uses Linear. It's painful to keep them in sync.\n\nDocumentation gets stale within weeks. We'd happily pay for a tool that auto-updates from real activity.",
    field: "quotes_text",
  },
];

export default function PasteModal({ open, onClose, onSubmit }) {
  const [activeTab, setActiveTab] = useState("competitors");
  const [values, setValues] = useState({
    competitors_text: "",
    pains_text: "",
    quotes_text: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const firstTextarea = useRef(null);
  const dialogRef = useRef(null);
  const titleId = "paste-modal-title";

  useEffect(() => {
    if (!open) return;
    setError(null);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    return setupFocusTrap(dialogRef.current, "textarea");
  }, [open]);

  // Lock body scroll + make the app shell inert while the modal is open.
  useOverlayLock(open);

  const hasInput =
    values.competitors_text.trim() ||
    values.pains_text.trim() ||
    values.quotes_text.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await assembleFromPaste(values);
      onSubmit(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillExample = () => {
    setValues({
      competitors_text: TABS[0].placeholder.split("\n\n").slice(-1)[0],
      pains_text: TABS[1].placeholder.split("\n\n").slice(-1)[0],
      quotes_text: TABS[2].placeholder.split("\n\n").slice(2).join("\n\n"),
    });
  };

  if (!open) return null;

  const current = TABS.find((t) => t.key === activeTab);

  return (
    <div
      className="fixed inset-0 z-modal grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col bg-white rounded-2xl shadow-cardLg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-ink">Paste your own scenario</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Rough text in, playable graph out. For higher-fidelity analysis,
              upload a CSV instead.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-xs min-h-[44px] min-w-[44px] p-0"
            aria-label="Close paste modal"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div
          role="tablist"
          aria-label="Paste input categories"
          className="px-5 pt-3 border-b border-slate-100 flex items-center gap-1 flex-shrink-0"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`paste-tab-${t.key}`}
              aria-selected={t.key === activeTab}
              aria-controls={`paste-panel-${t.key}`}
              tabIndex={t.key === activeTab ? 0 : -1}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-2 text-sm rounded-t-lg border-b-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 ${
                t.key === activeTab
                  ? "border-ink text-ink font-medium"
                  : "border-transparent text-ink-muted hover:text-ink-soft"
              }`}
            >
              {t.label}
              {values[t.field].trim() && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={fillExample}
            className="ml-auto text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline"
          >
            Fill with example
          </button>
        </div>

        <div
          className="p-5 flex-1 overflow-auto"
          role="tabpanel"
          id={`paste-panel-${current.key}`}
          aria-labelledby={`paste-tab-${current.key}`}
        >
          <label htmlFor={`paste-textarea-${current.key}`} className="sr-only">
            {current.label} input
          </label>
          <textarea
            ref={firstTextarea}
            id={`paste-textarea-${current.key}`}
            value={values[current.field]}
            onChange={(e) =>
              setValues({ ...values, [current.field]: e.target.value })
            }
            placeholder={current.placeholder}
            rows={12}
            maxLength={100_000}
            className="input p-3 font-mono leading-snug resize-none"
            spellCheck={false}
          />
          <div className="mt-1 text-2xs text-ink-muted text-right tabular-nums">
            {values[current.field].length.toLocaleString()} / 100,000 chars
          </div>
          {error && (
            <p role="alert" className="notice-danger mt-3 text-xs">
              {error}
            </p>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-2xs text-ink-muted">
            Data lives in this browser tab only. Reload or close = lose it.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasInput || submitting}
              className="btn-primary"
            >
              {submitting ? "Assembling…" : "Generate graph →"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
