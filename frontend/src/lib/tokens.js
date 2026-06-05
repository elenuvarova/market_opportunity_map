// SINGLE SOURCE OF TRUTH for raw color values used at runtime by Canvas
// (react-force-graph), Recharts, and inline SVG — surfaces Tailwind classes
// can't reach. Tailwind utility classes (chip bg/text/ring) still live next to
// the components that use them (nodeStyles.js / decisionStyles.js), but every
// HEX in the app must originate HERE. Do not redeclare these literals elsewhere.
//
// Keep in lockstep with tailwind.config.js theme.extend.colors.node / .decision
// and with backend/analysis.py decision_bucket() thresholds.

// Node-type palette. Keyed by the canonical short type name. NetworkMap looks
// up by the raw node `type` string ("pain_point", "pricing_tier"); nodeStyles.js
// owns that mapping and derives its hex from these values.
export const NODE_COLORS = {
  segment: "#3b82f6", // blue-500
  pain: "#ef4444", // red-500
  competitor: "#a855f7", // purple-500
  feature: "#10b981", // emerald-500
  pricing: "#f59e0b", // amber-500
  opportunity: "#eab308", // yellow-500
};

// Decision-bucket palette. Keyed by short bucket name.
// `strong` is emerald-600 (#059669) — deliberately DARKER than the feature-node
// green (#10b981) to break the collision where a "strong opportunity" dot read
// identically to a "feature" node in the same view.
export const DECISION_COLORS = {
  strong: "#059669", // emerald-600 (darker than feature #10b981 on purpose)
  validate: "#eab308", // yellow-500
  research: "#f97316", // orange-500
  low: "#94a3b8", // slate-400
};
