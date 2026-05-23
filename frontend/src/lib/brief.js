// Local fallback for building an Opportunity Brief from data we already have
// in the browser (CSV uploads, pasted input). Mirrors backend/analysis.py
// build_brief — if you change backend logic, mirror here.
import { computeBreakdown } from "./scoring";

const NEXT_STEP_TEMPLATES = {
  strong: "Build a 2-week prototype with 5–10 customers from this segment.",
  worth_validating: 'Run 5 customer interviews focused on: "{pain}".',
  needs_more_research: "Collect 10+ additional signals from sources like {sources}.",
  low_priority: "Park. Re-evaluate in 3 months when more signals accumulate.",
};

const DEFAULT_OPEN_QUESTIONS = [
  "Market sizing — how many customers in this segment actually feel this pain enough to switch?",
  "Retention — does solving this pain create stickiness, or is it a one-shot need?",
  "Willingness to pay — does the WTP score hold up against a real $/mo question, or is it directional?",
];

function competitiveLandscape(allOpportunities, segment) {
  const segmentOpps = allOpportunities.filter((o) => o.segment === segment);
  if (segmentOpps.length === 0) return [];

  const allPains = new Set(segmentOpps.map((o) => o.pain_point));
  const byCompetitor = new Map();
  for (const o of segmentOpps) {
    if (!byCompetitor.has(o.competitor)) {
      byCompetitor.set(o.competitor, { features: new Set(), pains: new Set() });
    }
    const bucket = byCompetitor.get(o.competitor);
    bucket.pains.add(o.pain_point);
    if (o.feature) bucket.features.add(o.feature);
  }

  const items = [...byCompetitor.entries()].map(([competitor, b]) => ({
    competitor,
    features_covered: [...b.features].sort(),
    pains_addressed: [...b.pains].sort(),
    pains_not_addressed: [...allPains].filter((p) => !b.pains.has(p)).sort(),
  }));
  items.sort((a, b) => b.features_covered.length - a.features_covered.length);
  return items.slice(0, 3);
}

export function computeBriefLocally(opportunity, allOpportunities) {
  const breakdown = computeBreakdown(opportunity);
  const signals = opportunity.sources || [];
  const topSignals = signals.slice(0, 3);
  const sourceTypes = Array.from(
    new Set(signals.map((s) => s.source_type).filter(Boolean))
  ).slice(0, 3);
  const sourcesHint = sourceTypes.length
    ? sourceTypes.join(", ")
    : "HackerNews, Reddit, industry reports";

  const template = NEXT_STEP_TEMPLATES[breakdown.bucket_key];
  const nextStep = template
    .replace("{pain}", opportunity.pain_point)
    .replace("{sources}", sourcesHint);

  return {
    id: opportunity.id,
    title: opportunity.opportunity,
    one_liner: `${opportunity.segment} struggling with: ${opportunity.pain_point}.`,
    segment: opportunity.segment,
    pain_point: opportunity.pain_point,
    competitor_in_row: opportunity.competitor,
    feature_in_row: "—",
    pricing_tier_in_row: "—",
    score_block: {
      score: breakdown.score,
      bucket_key: breakdown.bucket_key,
      bucket_label: breakdown.bucket_label,
      components: breakdown.components,
      formula_note: breakdown.formula_note,
    },
    top_signals: topSignals,
    total_signals: signals.length,
    competitive_landscape: competitiveLandscape(allOpportunities, opportunity.segment),
    open_questions: [...DEFAULT_OPEN_QUESTIONS],
    next_step: {
      bucket_key: breakdown.bucket_key,
      bucket_label: breakdown.bucket_label,
      recommendation: nextStep,
    },
  };
}
