const COLUMNS = [
  { name: "segment", type: "text", desc: "customer group (e.g. \"Bootcamp graduates\")" },
  { name: "pain_point", type: "text", desc: "customer problem in their own words" },
  { name: "competitor", type: "text", desc: "existing solution or substitute" },
  { name: "feature", type: "text", desc: "competitor feature relevant to this pain" },
  { name: "pricing_tier", type: "text", desc: "Free / Freemium / Paid / Subscription / Enterprise" },
  { name: "opportunity", type: "text", desc: "possible product hypothesis to score" },
  { name: "severity", type: "1–10", desc: "how bad the pain is" },
  { name: "willingness_to_pay", type: "1–10", desc: "how much they'd pay to fix it" },
  { name: "competition_intensity", type: "1–10", desc: "how crowded the solution space is" },
  { name: "evidence_count", type: "≥ 0", desc: "research signals: interviews, threads, reviews" },
];

export default function CsvFormatCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">CSV format</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            10 required columns, one row per signal you collected. Numeric columns must be integers.
          </p>
        </div>
        <a
          className="text-xs font-medium text-ink hover:underline whitespace-nowrap"
          href="/sample_market_data.csv"
          download
        >
          Download sample →
        </a>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-1.5">
        {COLUMNS.map((c) => (
          <code
            key={c.name}
            title={c.desc}
            className="font-mono text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-ink truncate"
          >
            {c.name}
          </code>
        ))}
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-ink-soft list-none flex items-center gap-1">
          <span className="transition group-open:rotate-90">›</span>
          Column meanings
        </summary>
        <dl className="mt-2 text-xs grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
          {COLUMNS.map((c) => (
            <FragmentRow key={c.name} col={c} />
          ))}
        </dl>
      </details>
    </div>
  );
}

function FragmentRow({ col }) {
  return (
    <>
      <dt className="font-mono text-ink whitespace-nowrap">
        {col.name}
        <span className="ml-1.5 text-[10px] text-ink-muted">({col.type})</span>
      </dt>
      <dd className="text-ink-muted">{col.desc}</dd>
    </>
  );
}
