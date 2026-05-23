// Local fallback breakdown for opportunities that don't have a dataset key
// (e.g. CSV uploads). The canonical source of truth is backend/analysis.py;
// if you change SCORE_WEIGHTS there, mirror the change here.

const WEIGHTS = {
  severity: 0.35,
  willingness_to_pay: 0.25,
  competition_intensity: 0.25,
  evidence_count: 0.15,
};

export const FORMULA_NOTE =
  "score = (severity × 0.35 + WTP × 0.25 + (10 − competition_intensity) × 0.25 + min(evidence_count / 10, 1) × 10 × 0.15) × 10, rounded and clipped to 0–100";

export function decisionBucket(score) {
  if (score >= 75) return { key: "strong", label: "Strong opportunity" };
  if (score >= 60) return { key: "worth_validating", label: "Worth validating" };
  if (score >= 40) return { key: "needs_more_research", label: "Needs more research" };
  return { key: "low_priority", label: "Low priority" };
}

export function computeBreakdown(opp) {
  const evidenceCapped = Math.min(opp.evidence_count / 10, 1) * 10;
  const components = [
    {
      name: "severity",
      label: "Severity",
      raw_value: opp.severity,
      raw_value_max: 10,
      weight: WEIGHTS.severity,
      contribution: +(opp.severity * WEIGHTS.severity * 10).toFixed(1),
      note: "How bad the pain is for this segment (1–10).",
    },
    {
      name: "willingness_to_pay",
      label: "Willingness to pay",
      raw_value: opp.willingness_to_pay,
      raw_value_max: 10,
      weight: WEIGHTS.willingness_to_pay,
      contribution: +(opp.willingness_to_pay * WEIGHTS.willingness_to_pay * 10).toFixed(1),
      note: "How much customers in this segment would pay to fix it (1–10).",
    },
    {
      name: "competition_intensity",
      label: "Low competition",
      raw_value: opp.competition_intensity,
      raw_value_max: 10,
      weight: WEIGHTS.competition_intensity,
      contribution: +((10 - opp.competition_intensity) * WEIGHTS.competition_intensity * 10).toFixed(1),
      note: `Crowded space scores low. Inverted: (10 − ${opp.competition_intensity}) × ${WEIGHTS.competition_intensity} × 10.`,
      inverted: true,
    },
    {
      name: "evidence_count",
      label: "Evidence strength",
      raw_value: opp.evidence_count,
      raw_value_max: null,
      weight: WEIGHTS.evidence_count,
      contribution: +(evidenceCapped * WEIGHTS.evidence_count * 10).toFixed(1),
      note: `min(${opp.evidence_count} / 10, 1) × 10 × ${WEIGHTS.evidence_count} × 10.`,
      capped_at: 10,
    },
  ];
  const bucket = decisionBucket(opp.opportunity_score);
  return {
    id: opp.id,
    opportunity: opp.opportunity,
    segment: opp.segment,
    pain_point: opp.pain_point,
    competitor: opp.competitor,
    score: opp.opportunity_score,
    bucket_key: bucket.key,
    bucket_label: bucket.label,
    formula_note: FORMULA_NOTE,
    components,
    supporting_signals: opp.sources || [],
  };
}
