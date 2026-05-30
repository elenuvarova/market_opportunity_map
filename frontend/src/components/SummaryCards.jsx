// Accent colors mirror the node-type palette used in NetworkMap so the
// summary anchors the color system at first glance.
const ACCENT = {
  segment: "before:bg-blue-500",
  competitor: "before:bg-purple-500",
  opportunity: "before:bg-yellow-500",
  pain: "before:bg-red-500",
  feature: "before:bg-emerald-500",
  pricing: "before:bg-amber-500",
};

function Stat({ label, value, hint, accent }) {
  const isNumeric = typeof value === "number";
  const accentClass = accent
    ? `relative before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-l-2xl ${ACCENT[accent] || ""}`
    : "";
  return (
    <div className={`card p-5 overflow-hidden ${accentClass}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div
        className={`mt-2 font-semibold text-ink leading-tight break-words text-balance ${
          isNumeric ? "text-3xl tabular-nums" : "text-lg"
        }`}
        title={isNumeric ? undefined : String(value)}
      >
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
      <Stat label="Segments" value={summary.total_segments} accent="segment" />
      <Stat label="Competitors" value={summary.total_competitors} accent="competitor" />
      <Stat label="Opportunities" value={summary.total_opportunities} accent="opportunity" />
      <Stat
        label="Top opportunity"
        value={summary.top_opportunity || "—"}
        accent="opportunity"
        hint={
          summary.top_opportunity_score != null
            ? `score ${summary.top_opportunity_score}/100`
            : null
        }
      />
      <Stat
        label="Most underserved"
        value={summary.most_underserved_segment || "—"}
        accent="segment"
        hint="High pain, low competition"
      />
      <Stat
        label="Most crowded area"
        value={summary.most_crowded_area || "—"}
        accent="competitor"
        hint="Feature with highest competition"
      />
    </div>
  );
}
