import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getOpportunityBrief } from "../lib/api";
import { briefToMarkdown } from "../lib/markdown";
import { loadCurrentData } from "../lib/sessionStore";
import { computeBriefLocally } from "../lib/brief";

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

function ComponentBar({ component, totalScore }) {
  const widthPct = totalScore > 0 ? (component.contribution / totalScore) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1">
        <span className="font-medium text-ink">{component.label}</span>
        <span className="tabular-nums text-ink-soft text-xs">
          {component.raw_value}
          {component.raw_value_max ? ` / ${component.raw_value_max}` : ""}
          <span className="text-ink-muted mx-1.5">·</span>
          <span className="font-medium text-ink">+{component.contribution}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${BAR_COLORS[component.name] || "bg-slate-400"}`}
          style={{ width: `${Math.max(0, Math.min(100, widthPct))}%` }}
        />
      </div>
    </div>
  );
}

function Signal({ signal }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="chip bg-slate-100 text-slate-700">{signal.source_type}</span>
        <a
          href={signal.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline truncate max-w-[60%]"
          title={signal.url}
        >
          {signal.url}
        </a>
      </div>
      {signal.note && (
        <p className="text-sm text-ink-soft leading-snug">
          {signal.note}
          {signal.is_paraphrase && (
            <span className="ml-1 text-[10px] text-ink-muted">(paraphrase)</span>
          )}
        </p>
      )}
    </li>
  );
}

function CompetitorCard({ entry }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-ink">{entry.competitor}</h4>
      <dl className="mt-2 text-xs space-y-1.5">
        <div>
          <dt className="inline text-ink-muted">Covers in this segment: </dt>
          <dd className="inline text-ink-soft">
            {entry.features_covered.join(", ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="inline text-ink-muted">Does not address: </dt>
          <dd className="inline text-ink-soft">
            {entry.pains_not_addressed.length > 0
              ? entry.pains_not_addressed.map((p) => `"${p}"`).join("; ")
              : "fully covers the known pains in this segment"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function OpportunityBrief() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dataset = searchParams.get("dataset");
  const source = searchParams.get("source");

  const [brief, setBrief] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (source === "session") {
      // Pasted or CSV data — read from this tab's sessionStorage and compute locally
      const stash = loadCurrentData();
      if (!stash?.data?.opportunities) {
        setError(
          "No data found in this tab. Open the brief from the dashboard where the data is loaded."
        );
        setLoading(false);
        return;
      }
      const opp = stash.data.opportunities.find((o) => o.id === id);
      if (!opp) {
        setError(`Opportunity '${id}' not in current data.`);
        setLoading(false);
        return;
      }
      setBrief(computeBriefLocally(opp, stash.data.opportunities));
      setLoading(false);
      return;
    }
    getOpportunityBrief(id, dataset)
      .then((b) => setBrief(b))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, dataset, source]);

  const onCopyMarkdown = async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(briefToMarkdown(brief));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  };

  const onPrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-muted text-sm">
        Loading brief…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="card p-6 max-w-md">
          <h2 className="font-semibold text-ink">Could not load brief</h2>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <Link to="/" className="btn-secondary mt-4 inline-flex">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!brief) return null;

  const sb = brief.score_block;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="print-hide flex items-center justify-between mb-6">
          <Link to="/" className="text-sm text-ink-soft hover:text-ink">
            ← Back to dashboard
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={onCopyMarkdown}>
              {copied ? "✓ Copied" : "Copy as Markdown"}
            </button>
            <button type="button" className="btn-primary" onClick={onPrint}>
              Print
            </button>
          </div>
        </div>

        <article className="card print-page p-8 lg:p-12 space-y-8">
          <header>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Opportunity brief · {brief.segment}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink leading-tight">
              {brief.title}
            </h1>
            <p className="mt-3 text-base text-ink-soft leading-snug">
              {brief.one_liner}
            </p>
          </header>

          <section>
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-muted">
                  Opportunity score
                </div>
                <div className="text-4xl font-semibold tabular-nums text-ink leading-none">
                  {sb.score}
                  <span className="text-base text-ink-muted ml-1">/100</span>
                </div>
              </div>
              <span className={`chip ${BUCKET_STYLES[sb.bucket_key] || ""}`}>
                {sb.bucket_label}
              </span>
            </div>
            <div className="space-y-3">
              {sb.components.map((c) => (
                <ComponentBar key={c.name} component={c} totalScore={sb.score} />
              ))}
            </div>
            <p className="mt-4 text-[11px] text-ink-muted leading-snug font-mono">
              {sb.formula_note}
            </p>
          </section>

          {brief.top_signals?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-3">
                Top supporting signals ({brief.total_signals} total)
              </h2>
              <ul className="space-y-2">
                {brief.top_signals.map((s, i) => (
                  <Signal key={i} signal={s} />
                ))}
              </ul>
            </section>
          )}

          {brief.competitive_landscape?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-3">
                Competitive landscape
              </h2>
              <div className="space-y-2">
                {brief.competitive_landscape.map((c, i) => (
                  <CompetitorCard key={i} entry={c} />
                ))}
              </div>
            </section>
          )}

          {brief.open_questions?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-3">
                Open questions &amp; risks
              </h2>
              <ul className="space-y-2 text-sm text-ink-soft list-disc pl-5">
                {brief.open_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-2">
              Recommended next step
            </h2>
            <p className="text-base font-medium text-ink leading-snug">
              {brief.next_step.recommendation}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Bucket: {brief.next_step.bucket_label}
            </p>
          </section>

          <footer className="text-xs text-ink-muted print-hide">
            Market Opportunity Map · regenerated on view
          </footer>
        </article>
      </div>
    </div>
  );
}
