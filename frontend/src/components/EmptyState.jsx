import { DEMO_DATASETS } from "../lib/api";
import CsvFormatCard from "./CsvFormatCard";

export default function EmptyState({ onTryDemo, onPickFile, loading }) {
  return (
    <section className="card p-10 lg:p-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Market research → strategy
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
          Turn raw market data into a strategic opportunity map
        </h2>
        <p className="mt-3 text-ink-muted">
          Upload a CSV with segments, pain points, competitors, features, pricing, and opportunities. We score them and visualize where the strongest unmet needs live.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {DEMO_DATASETS.map((d) => (
          <button
            key={d.key}
            type="button"
            disabled={loading}
            onClick={() => onTryDemo(d.key)}
            className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-card transition disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="chip bg-slate-100 text-slate-700">Demo</span>
              <span className="font-medium text-ink">{d.label}</span>
            </div>
            <p className="mt-1.5 text-sm text-ink-muted">{d.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-ink-soft">
              {loading ? "Loading…" : "Load this demo →"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl mx-auto">
        <CsvFormatCard />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={onPickFile}
          disabled={loading}
        >
          Upload your CSV
        </button>
      </div>
    </section>
  );
}
