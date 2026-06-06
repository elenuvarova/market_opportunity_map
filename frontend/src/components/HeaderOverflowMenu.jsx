import { useEffect, useRef, useState } from "react";

// Collapses the secondary header actions (Paste, Take a tour, Reset) behind a
// single "More" menu on narrow viewports so the header stays one row. The
// primary actions (Upload CSV / demo) remain visible alongside this.
export default function HeaderOverflowMenu({ disabled, onPaste, onTour, onReset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    onPaste && { label: "Paste", action: onPaste },
    onTour && { label: "Take a tour", action: onTour },
    onReset && { label: "Reset", action: onReset },
  ].filter(Boolean);

  if (items.length === 0) return null;

  const run = (action) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-ghost min-h-touch"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
      >
        More
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5 opacity-80"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 7l5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-cardLg p-1 z-dropdown"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => run(it.action)}
              disabled={disabled}
              className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-slate-50 disabled:opacity-50 min-h-touch"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
