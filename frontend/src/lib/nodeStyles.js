import { NODE_COLORS as TOKEN_NODE_COLORS } from "./tokens.js";

export const NODE_TYPES = [
  "segment",
  "pain_point",
  "competitor",
  "feature",
  "pricing_tier",
  "opportunity",
];

export const NODE_LABELS = {
  segment: "Segment",
  pain_point: "Pain point",
  competitor: "Competitor",
  feature: "Feature",
  pricing_tier: "Pricing tier",
  opportunity: "Opportunity",
};

// Hex values come from the single source of truth (lib/tokens.js). This map only
// re-keys them onto the raw node `type` strings the graph data uses.
export const NODE_COLORS = {
  segment: TOKEN_NODE_COLORS.segment,
  pain_point: TOKEN_NODE_COLORS.pain,
  competitor: TOKEN_NODE_COLORS.competitor,
  feature: TOKEN_NODE_COLORS.feature,
  pricing_tier: TOKEN_NODE_COLORS.pricing,
  opportunity: TOKEN_NODE_COLORS.opportunity,
};

export const NODE_CHIP_CLASSES = {
  segment: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  pain_point: "bg-red-50 text-red-700 ring-1 ring-red-100",
  competitor: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
  feature: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  pricing_tier: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  opportunity: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-100",
};
