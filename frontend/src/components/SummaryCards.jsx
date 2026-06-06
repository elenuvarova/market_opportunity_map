import { NODE_COLORS } from "../lib/tokens";

// The summary has two very different shapes: three small COUNTS and three
// long-text NAMED INSIGHTS. Rendering them as six identical cards mixed uneven
// densities, so they're split: counts go in a compact equal-height stat strip,
// named insights become richer accent cards.

// Accent colors mirror the node-type palette used in NetworkMap so the summary
// anchors the color system at first glance. Hex comes from the single source of
// truth (lib/tokens.js); the bar is painted via a CSS var on the ::before
// pseudo-element (bg-[color:var(...)]), so no raw palette literals live here.

function CountStat({ label, value }) {
  return (
    <div className="card p-4 flex flex-col justify-center min-h-[88px]">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-ink leading-tight">
        {value}
      </div>
    </div>
  );
}

function InsightCard({ label, value, hint, accent }) {
  const accentColor = accent ? NODE_COLORS[accent] : null;
  const accentClass = accentColor
    ? "relative before:absolute before:left-0 before:top-0 before:h-full before:w-accent-bar before:rounded-l-2xl before:bg-[color:var(--accent)]"
    : "";
  return (
    <div
      className={`card p-5 overflow-hidden flex flex-col min-h-[120px] ${accentClass}`}
      style={accentColor ? { "--accent": accentColor } : undefined}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div
        className="mt-2 text-lg font-semibold text-ink leading-tight break-words text-balance"
        title={String(value)}
      >
        {value}
      </div>
      {hint && <div className="mt-auto pt-2 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export default function SummaryCards({ summary }) {
  if (!summary) return null;
  return (
    <div className="space-y-4">
      {/* Compact count strip. */}
      <div className="grid grid-cols-3 gap-3">
        <CountStat label="Segments" value={summary.total_segments} />
        <CountStat label="Competitors" value={summary.total_competitors} />
        <CountStat label="Opportunities" value={summary.total_opportunities} />
      </div>

      {/* Richer named-insight cards. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InsightCard
          label="Top opportunity"
          value={summary.top_opportunity || "—"}
          accent="opportunity"
          hint={
            summary.top_opportunity_score != null
              ? `score ${summary.top_opportunity_score}/100`
              : null
          }
        />
        <InsightCard
          label="Most underserved"
          value={summary.most_underserved_segment || "—"}
          accent="segment"
          hint="High pain, low competition"
        />
        <InsightCard
          label="Most crowded area"
          value={summary.most_crowded_area || "—"}
          accent="competitor"
          hint="Feature with highest competition"
        />
      </div>
    </div>
  );
}
