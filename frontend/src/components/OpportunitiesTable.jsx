function decisionFor(score) {
  if (score >= 75)
    return {
      label: "Strong opportunity",
      color: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
      dot: "bg-emerald-500",
    };
  if (score >= 60)
    return {
      label: "Worth validating",
      color: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200",
      dot: "bg-yellow-500",
    };
  if (score >= 40)
    return {
      label: "Needs research",
      color: "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
      dot: "bg-orange-500",
    };
  return {
    label: "Low priority",
    color: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    dot: "bg-slate-400",
  };
}

function ScoreBar({ score }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${score}%`,
            background:
              score >= 75
                ? "#16a34a"
                : score >= 60
                ? "#eab308"
                : score >= 40
                ? "#f97316"
                : "#94a3b8",
          }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums text-ink">{score}</span>
    </div>
  );
}

export default function OpportunitiesTable({
  opportunities,
  onSelectOpportunity,
  datasetKey,
  briefSource,
}) {
  const briefUrlFor = (id) => {
    if (briefSource === "demo" && datasetKey) {
      return `/opportunity/${encodeURIComponent(id)}/brief?dataset=${encodeURIComponent(datasetKey)}`;
    }
    if (briefSource === "session") {
      return `/opportunity/${encodeURIComponent(id)}/brief?source=session`;
    }
    return null;
  };
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200/70">
        <h3 className="text-sm font-semibold text-ink">Ranked opportunities</h3>
        <p className="text-xs text-ink-muted">
          Click any row to see the score breakdown and supporting signals.
        </p>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-ink-muted text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-4 py-2 w-10">#</th>
              <th className="text-left font-medium px-4 py-2">Opportunity</th>
              <th className="text-left font-medium px-4 py-2">Segment</th>
              <th className="text-left font-medium px-4 py-2">Pain point</th>
              <th className="text-right font-medium px-4 py-2">Sev.</th>
              <th className="text-right font-medium px-4 py-2">WTP</th>
              <th className="text-right font-medium px-4 py-2">Comp.</th>
              <th className="text-right font-medium px-4 py-2">Ev.</th>
              <th className="text-left font-medium px-4 py-2">Score</th>
              <th className="text-left font-medium px-4 py-2 min-w-[160px]">Decision</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o, i) => {
              const d = decisionFor(o.opportunity_score);
              return (
                <tr
                  key={i}
                  onClick={() => onSelectOpportunity?.(o)}
                  className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                >
                  <td className="px-4 py-2.5 text-ink-muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-ink max-w-[280px]">
                    <span className="block truncate" title={o.opportunity}>
                      {o.opportunity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft max-w-[160px]">
                    <span className="block truncate" title={o.segment}>
                      {o.segment}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft max-w-[280px]">
                    <span className="block truncate" title={o.pain_point}>
                      {o.pain_point}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.severity}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.willingness_to_pay}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.competition_intensity}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.evidence_count}</td>
                  <td className="px-4 py-2.5">
                    <ScoreBar score={o.opportunity_score} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`chip-decision ${d.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
                        {d.label}
                      </span>
                      {briefUrlFor(o.id) && (
                        <a
                          href={briefUrlFor(o.id)}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          data-tour-id={i === 0 ? "brief-link-top" : undefined}
                          className="text-[11px] text-ink-soft hover:text-ink underline-offset-2 hover:underline"
                        >
                          Brief →
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
