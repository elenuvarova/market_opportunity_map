// Single source of truth for the 4 decision buckets — used by the
// OpportunitiesTable row chip, the ScoreBreakdownDrawer bucket badge,
// and the OpportunityBrief score block. Keep this in lockstep with
// backend/analysis.py decision_bucket().

export const DECISION_BUCKETS = {
  strong: {
    label: "Strong opportunity",
    chip: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    accent: "border-emerald-400",
  },
  worth_validating: {
    label: "Worth validating",
    chip: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200",
    dot: "bg-yellow-500",
    accent: "border-yellow-400",
  },
  needs_more_research: {
    label: "Needs research",
    chip: "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
    dot: "bg-orange-500",
    accent: "border-orange-400",
  },
  low_priority: {
    label: "Low priority",
    chip: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    dot: "bg-slate-400",
    accent: "border-slate-300",
  },
};

export function decisionForScore(score) {
  if (score >= 75) return { key: "strong", ...DECISION_BUCKETS.strong };
  if (score >= 60)
    return { key: "worth_validating", ...DECISION_BUCKETS.worth_validating };
  if (score >= 40)
    return { key: "needs_more_research", ...DECISION_BUCKETS.needs_more_research };
  return { key: "low_priority", ...DECISION_BUCKETS.low_priority };
}

export function decisionByKey(key) {
  const meta = DECISION_BUCKETS[key] || DECISION_BUCKETS.low_priority;
  return { key, ...meta };
}

// Component-bar colors are tied to the network-map node-type palette,
// so the score breakdown visually echoes the graph the user just looked
// at: severity = pain (red), competition = competitor (purple),
// willingness_to_pay = segment (blue), evidence = pricing (amber).
export const COMPONENT_BAR_COLORS = {
  severity: "bg-red-500",
  willingness_to_pay: "bg-blue-500",
  competition_intensity: "bg-purple-500",
  evidence_count: "bg-amber-500",
};
