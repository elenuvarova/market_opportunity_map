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

function DecisionChip({ score }) {
  const d = decisionForScore(score);
  return (
    <span className={`chip-decision ${d.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
      {d.label}
    </span>
  );
}

function OnePagerLink({ href, tourId }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      data-tour-id={tourId}
      className="btn-secondary btn-sm min-h-touch"
    >
      Open one-pager →
    </a>
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
          Open any opportunity to see the score breakdown and supporting signals.
        </p>
      </div>

      {/* Mobile: stacked cards. Avoids a 10-column horizontal scroll on phones. */}
      <ul className="md:hidden divide-y divide-slate-100">
        {opportunities.map((o, i) => (
          <li key={i} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs text-ink-muted tabular-nums">#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => onSelectOpportunity?.(o)}
                  className="block text-left font-medium text-ink break-words hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 rounded"
                >
                  {o.opportunity}
                </button>
                <p className="mt-0.5 text-xs text-ink-soft break-words">
                  {o.segment} · {o.pain_point}
                </p>
              </div>
              <DecisionChip score={o.opportunity_score} />
            </div>

            <div className="mt-3">
              <ScoreBar score={o.opportunity_score} />
            </div>

            <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <dt className="text-2xs uppercase tracking-wide text-ink-muted">Severity</dt>
                <dd className="text-sm font-medium tabular-nums text-ink">{o.severity}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wide text-ink-muted">WTP</dt>
                <dd className="text-sm font-medium tabular-nums text-ink">{o.willingness_to_pay}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wide text-ink-muted">Comp.</dt>
                <dd className="text-sm font-medium tabular-nums text-ink">{o.competition_intensity}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wide text-ink-muted">Evidence</dt>
                <dd className="text-sm font-medium tabular-nums text-ink">{o.evidence_count}</dd>
              </div>
            </dl>

            {briefUrlFor(o.id) && (
              <div className="mt-3">
                <OnePagerLink href={briefUrlFor(o.id)} tourId={undefined} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop: full table. Native tr/td semantics are preserved; the
          Opportunity-name cell is a real <button> that opens the breakdown, so
          keyboard users get a proper focusable control without role-on-tr. The
          row onClick is a mouse convenience only. */}
      <div className="hidden md:block overflow-x-auto md:overflow-x-visible">
        <table className="w-full text-sm md:table-fixed">
          <thead>
            <tr className="bg-slate-50 text-ink-muted text-xs uppercase tracking-wide">
              <th scope="col" className="text-left font-medium px-3 py-2 md:w-[3%]">#</th>
              <th scope="col" className="text-left font-medium px-3 py-2 md:w-[22%]">Opportunity</th>
              <th scope="col" className="text-left font-medium px-3 py-2 md:w-[12%]">Segment</th>
              <th scope="col" className="text-left font-medium px-3 py-2 md:w-[22%]">Pain point</th>
              <th scope="col" className="text-right font-medium px-2 py-2 md:w-[4%]">
                <abbr title="Severity" className="no-underline">Sev.</abbr>
              </th>
              <th scope="col" className="text-right font-medium px-2 py-2 md:w-[4%]">
                <abbr title="Willingness to pay" className="no-underline">WTP</abbr>
              </th>
              <th scope="col" className="text-right font-medium px-2 py-2 md:w-[4%]">
                <abbr title="Competition" className="no-underline">Comp.</abbr>
              </th>
              <th scope="col" className="text-right font-medium px-2 py-2 md:w-[4%]">
                <abbr title="Evidence" className="no-underline">Ev.</abbr>
              </th>
              <th scope="col" className="text-left font-medium px-3 py-2 md:w-[10%]">Score</th>
              <th scope="col" className="text-left font-medium px-3 py-2 md:w-[15%]">Decision</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o, i) => (
              <tr
                key={i}
                onClick={() => onSelectOpportunity?.(o)}
                className="border-t border-slate-100 hover:bg-slate-100/70 cursor-pointer transition-colors"
              >
                <td className="px-3 py-3 text-ink-muted tabular-nums align-top">{i + 1}</td>
                <td className="px-3 py-3 align-top break-words">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOpportunity?.(o);
                    }}
                    aria-label={`Open score breakdown for ${o.opportunity}`}
                    className="text-left font-medium text-ink hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 rounded"
                  >
                    {o.opportunity}
                  </button>
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
                <td className="px-3 py-3 align-middle">
                  <div className="flex flex-col items-start gap-2">
                    <DecisionChip score={o.opportunity_score} />
                    <OnePagerLink
                      href={briefUrlFor(o.id)}
                      tourId={i === 0 ? "brief-link-top" : undefined}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
