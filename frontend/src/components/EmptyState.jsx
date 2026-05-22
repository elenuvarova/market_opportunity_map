export default function EmptyState({ onTryDemo, onPickFile, loading }) {
  return (
    <section className="card p-10 lg:p-14 text-center">
      <div className="mx-auto max-w-xl">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Market research → strategy
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
          Turn raw market data into a strategic opportunity map
        </h2>
        <p className="mt-3 text-ink-muted">
          Upload a CSV with segments, pain points, competitors, features, pricing, and opportunities. We score them and visualize where the strongest unmet needs live.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={onTryDemo}
            disabled={loading}
          >
            {loading ? "Loading…" : "Try demo data"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onPickFile}
            disabled={loading}
          >
            Upload CSV
          </button>
          <a className="btn-ghost" href="/sample_market_data.csv" download>
            Download sample CSV
          </a>
        </div>
      </div>
    </section>
  );
}
