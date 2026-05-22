function Stat({ label, value, hint }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink leading-tight">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export default function SummaryCards({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <Stat label="Segments" value={summary.total_segments} />
      <Stat label="Competitors" value={summary.total_competitors} />
      <Stat label="Opportunities" value={summary.total_opportunities} />
      <Stat
        label="Top opportunity"
        value={summary.top_opportunity || "—"}
        hint={
          summary.top_opportunity_score != null
            ? `score ${summary.top_opportunity_score}/100`
            : null
        }
      />
      <Stat
        label="Most underserved"
        value={summary.most_underserved_segment || "—"}
        hint="High pain, low competition"
      />
      <Stat
        label="Most crowded area"
        value={summary.most_crowded_area || "—"}
        hint="Feature with highest competition"
      />
    </div>
  );
}
