import { DEMO_DATASETS } from "../lib/api";
import CsvFormatCard from "./CsvFormatCard";

export default function EmptyState({ onTryDemo, onPickFile, onOpenPaste, loading }) {
  return (
    <section className="card p-8 sm:p-10 lg:p-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Market research → strategy
        </span>
        <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          Find underserved segments, crowded clusters, and the gaps in between.
        </h2>
        <p className="mt-3 text-ink-muted text-base">
          Load a researched demo dataset, paste rough notes, or upload a CSV — get a scored opportunity map in seconds.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {DEMO_DATASETS.map((d) => (
          <button
            key={d.key}
            type="button"
            disabled={loading}
            onClick={() => onTryDemo(d.key)}
            className="surface text-left hover:border-slate-300 hover:shadow-card transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <div className="flex items-center gap-2">
              <span className="chip chip-neutral">Demo</span>
              <span className="font-medium text-ink">{d.label}</span>
            </div>
            <p className="mt-1.5 text-sm text-ink-muted">{d.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-ink-soft">
              {loading ? "Loading…" : "Load this demo →"}
            </span>
          </button>
        ))}
      </div>

      {/* One shared tour entry below the grid (was duplicated per-card). */}
      <p className="mt-4 text-center text-xs text-ink-muted">
        New here?{" "}
        <a
          href={`/?tour=${DEMO_DATASETS[0]?.key}`}
          className="font-medium text-ink hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
        >
          Take the 90-second tour →
        </a>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={onPickFile}
          disabled={loading}
        >
          Upload your CSV
        </button>
        {onOpenPaste && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenPaste}
            disabled={loading}
          >
            Paste rough notes
          </button>
        )}
      </div>

      <div className="mt-8 max-w-2xl mx-auto">
        <CsvFormatCard />
      </div>
    </section>
  );
}
