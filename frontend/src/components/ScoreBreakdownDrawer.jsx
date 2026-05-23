import { useEffect, useState } from "react";
import { getOpportunityBreakdown } from "../lib/api";
import { computeBreakdown } from "../lib/scoring";

const BUCKET_STYLES = {
  strong: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  worth_validating: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200",
  needs_more_research: "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
  low_priority: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const BAR_COLORS = {
  severity: "bg-rose-400",
  willingness_to_pay: "bg-blue-400",
  competition_intensity: "bg-violet-400",
  evidence_count: "bg-amber-400",
};

function useBreakdown(opportunity, datasetKey) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!opportunity) {
      setData(null);
      setError(null);
      return;
    }
    if (!datasetKey) {
      setData(computeBreakdown(opportunity));
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOpportunityBreakdown(opportunity.id, datasetKey)
      .then((b) => {
        if (!cancelled) setData(b);
      })
      .catch((err) => {
        if (!cancelled) {
          // Fall back to local computation if the API can't reach us
          setData(computeBreakdown(opportunity));
          setError(`${err.message} — showing local breakdown.`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opportunity, datasetKey]);

  return { data, error, loading };
}

function ComponentBar({ component, totalScore }) {
  const widthPct = totalScore > 0 ? (component.contribution / totalScore) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-1">
        <span className="font-medium text-ink">{component.label}</span>
        <span className="tabular-nums text-ink-soft">
          {component.raw_value}
          {component.raw_value_max ? ` / ${component.raw_value_max}` : ""}
          <span className="text-ink-muted mx-1.5">·</span>
          <span className="font-medium text-ink">+{component.contribution}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${BAR_COLORS[component.name] || "bg-slate-400"}`}
          style={{ width: `${Math.max(0, Math.min(100, widthPct))}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-ink-muted leading-snug">{component.note}</p>
    </div>
  );
}

function Signal({ signal }) {
  const isExternal = /^https?:\/\//i.test(signal.url || "");
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="chip bg-slate-100 text-slate-700">{signal.source_type}</span>
        {isExternal ? (
          <a
            href={signal.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline truncate max-w-[60%]"
            title={signal.url}
          >
            open ↗
          </a>
        ) : (
          <span className="text-[10px] text-ink-muted">local</span>
        )}
      </div>
      {signal.note && (
        <p className="text-xs text-ink-soft leading-snug">
          {signal.note}
          {signal.is_paraphrase && (
            <span className="ml-1 text-[10px] text-ink-muted">(paraphrase)</span>
          )}
        </p>
      )}
    </li>
  );
}

function buildBriefUrl(id, datasetKey, briefSource) {
  if (briefSource === "demo" && datasetKey) {
    return `/opportunity/${encodeURIComponent(id)}/brief?dataset=${encodeURIComponent(datasetKey)}`;
  }
  if (briefSource === "session") {
    return `/opportunity/${encodeURIComponent(id)}/brief?source=session`;
  }
  return null;
}

export default function ScoreBreakdownDrawer({
  opportunity,
  datasetKey,
  briefSource,
  onClose,
}) {
  const { data, error, loading } = useBreakdown(opportunity, datasetKey);

  useEffect(() => {
    if (!opportunity) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opportunity, onClose]);

  const open = !!opportunity;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity z-30 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      />
      <aside
        data-tour-id="drawer"
        className={`fixed top-0 right-0 h-full w-full max-w-[480px] bg-white border-l border-slate-200 shadow-cardLg z-40 transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Opportunity score breakdown"
      >
        {opportunity && (
          <div className="h-full flex flex-col">
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
              <div className="min-w-0">
                <div className="text-xs text-ink-muted uppercase tracking-wide">
                  {opportunity.segment} · {opportunity.competitor}
                </div>
                <h2 className="mt-1 text-base font-semibold text-ink leading-snug">
                  {opportunity.opportunity}
                </h2>
                <p className="mt-1 text-xs text-ink-muted leading-snug">
                  {opportunity.pain_point}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost px-2 py-1 text-xs flex-shrink-0"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
              {loading && <p className="text-xs text-ink-muted">Loading breakdown…</p>}

              {data && (
                <>
                  <section>
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <div className="text-xs text-ink-muted">Opportunity score</div>
                        <div className="text-3xl font-semibold tabular-nums text-ink leading-none">
                          {data.score}
                          <span className="text-base text-ink-muted ml-1">/100</span>
                        </div>
                      </div>
                      <span className={`chip ${BUCKET_STYLES[data.bucket_key] || ""}`}>
                        {data.bucket_label}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {data.components.map((c) => (
                        <ComponentBar key={c.name} component={c} totalScore={data.score} />
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-ink-muted leading-snug font-mono">
                      {data.formula_note}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
                      Supporting signals ({data.supporting_signals.length})
                    </h3>
                    {data.supporting_signals.length === 0 ? (
                      <p className="text-xs text-ink-muted">
                        No source URLs available for this opportunity. CSV uploads don't
                        include a sources column — paste your research links into the
                        sources field of your data to see them here.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {data.supporting_signals.map((s, i) => (
                          <Signal key={i} signal={s} />
                        ))}
                      </ul>
                    )}
                  </section>

                  {error && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      {error}
                    </p>
                  )}
                </>
              )}
            </div>

            {data && buildBriefUrl(data.id, datasetKey, briefSource) && (
              <footer className="border-t border-slate-200 px-5 py-3 bg-slate-50/50">
                <a
                  href={buildBriefUrl(data.id, datasetKey, briefSource)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-primary w-full justify-center"
                >
                  Generate brief →
                </a>
                <p className="mt-2 text-[11px] text-ink-muted text-center">
                  Opens a print-friendly one-pager in a new tab
                </p>
              </footer>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
