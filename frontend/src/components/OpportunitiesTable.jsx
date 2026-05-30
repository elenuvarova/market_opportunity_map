import { decisionForScore } from "../lib/decisionStyles";

function ScoreBar({ score }) {
  const d = decisionForScore(score);
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 flex-1 min-w-[40px] max-w-[80px] rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={`Opportunity score ${score} out of 100, ${d.label}`}
      >
        <div className={`h-full ${d.dot}`} style={{ width: `${score}%` }} />
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
      <div className="overflow-x-auto md:overflow-x-visible">
        <table className="w-full text-sm md:table-fixed">
          <thead>
            <tr className="bg-slate-50 text-ink-muted text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-3 py-2 md:w-[3%]">#</th>
              <th className="text-left font-medium px-3 py-2 md:w-[22%]">Opportunity</th>
              <th className="text-left font-medium px-3 py-2 md:w-[12%]">Segment</th>
              <th className="text-left font-medium px-3 py-2 md:w-[24%]">Pain point</th>
              <th className="text-right font-medium px-2 py-2 md:w-[4%]">Sev.</th>
              <th className="text-right font-medium px-2 py-2 md:w-[4%]">WTP</th>
              <th className="text-right font-medium px-2 py-2 md:w-[4%]">Comp.</th>
              <th className="text-right font-medium px-2 py-2 md:w-[4%]">Ev.</th>
              <th className="text-left font-medium px-3 py-2 md:w-[10%]">Score</th>
              <th className="text-left font-medium px-3 py-2 md:w-[13%]">Decision</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o, i) => {
              const d = decisionForScore(o.opportunity_score);
              return (
                <tr
                  key={i}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open score breakdown for ${o.opportunity}`}
                  onClick={() => onSelectOpportunity?.(o)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectOpportunity?.(o);
                    }
                  }}
                  className="border-t border-slate-100 hover:bg-slate-100/70 focus-visible:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-3 text-ink-muted tabular-nums align-top">{i + 1}</td>
                  <td className="px-3 py-3 font-medium text-ink align-top break-words">
                    {o.opportunity}
                  </td>
                  <td className="px-3 py-3 text-ink-soft align-top break-words">
                    {o.segment}
                  </td>
                  <td className="px-3 py-3 text-ink-soft align-top break-words">
                    {o.pain_point}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums align-top">{o.severity}</td>
                  <td className="px-2 py-3 text-right tabular-nums align-top">{o.willingness_to_pay}</td>
                  <td className="px-2 py-3 text-right tabular-nums align-top">{o.competition_intensity}</td>
                  <td className="px-2 py-3 text-right tabular-nums align-top">{o.evidence_count}</td>
                  <td className="px-3 py-3 align-top">
                    <ScoreBar score={o.opportunity_score} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col items-start gap-2">
                      <span className={`chip-decision ${d.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
                        {d.label}
                      </span>
                      {briefUrlFor(o.id) && (
                        <a
                          href={briefUrlFor(o.id)}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          data-tour-id={i === 0 ? "brief-link-top" : undefined}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-ink hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 transition"
                        >
                          Open one-pager →
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
