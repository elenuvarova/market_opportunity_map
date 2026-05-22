function decisionFor(score) {
  if (score >= 75) return { label: "Strong opportunity", color: "bg-emerald-100 text-emerald-800" };
  if (score >= 60) return { label: "Worth validating", color: "bg-yellow-100 text-yellow-800" };
  if (score >= 40) return { label: "Needs more research", color: "bg-orange-100 text-orange-800" };
  return { label: "Low priority", color: "bg-slate-100 text-slate-600" };
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

export default function OpportunitiesTable({ opportunities }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200/70">
        <h3 className="text-sm font-semibold text-ink">Ranked opportunities</h3>
        <p className="text-xs text-ink-muted">
          Scored on severity, willingness to pay, low competition, and evidence.
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
              <th className="text-left font-medium px-4 py-2">Decision</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o, i) => {
              const d = decisionFor(o.opportunity_score);
              return (
                <tr
                  key={i}
                  className="border-t border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-2.5 text-ink-muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{o.opportunity}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{o.segment}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{o.pain_point}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.severity}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.willingness_to_pay}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.competition_intensity}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.evidence_count}</td>
                  <td className="px-4 py-2.5">
                    <ScoreBar score={o.opportunity_score} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`chip ${d.color}`}>{d.label}</span>
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
