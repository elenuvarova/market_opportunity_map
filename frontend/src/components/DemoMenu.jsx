import { useEffect, useRef, useState } from "react";
import { DEMO_DATASETS } from "../lib/api";

export default function DemoMenu({ onPick, disabled, loading, activeKey }) {
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {loading ? "Analyzing…" : activeKey ? "Switch demo" : "Try demo"}
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
          className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-cardLg p-1 z-dropdown"
        >
          {DEMO_DATASETS.map((d) => {
            const active = d.key === activeKey;
            return (
              <button
                key={d.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onPick(d.key);
                }}
                className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-slate-50 disabled:opacity-50"
                disabled={disabled}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink text-sm">{d.label}</span>
                  {active && (
                    <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      Loaded
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-muted mt-0.5">
                  {d.description}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
