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

// Neutral slate ramp + ink, for the runtime contexts (Canvas/Recharts/inline
// SVG) that can't reach Tailwind utility classes. Mirrors Tailwind's slate
// scale and the `ink` token. Single-source these instead of scattering raw
// #cbd5e1/#94a3b8/#64748b literals through the chart/graph code.
export const NEUTRALS = {
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  ink: "#0f172a",
};

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Express a NODE_COLORS hex as an rgba() string at the given alpha. Used by the
// heatmap opacity ramp (competitor purple) so the ramp derives from the single
// color source instead of a hardcoded rgba(168,85,247,…).
export function nodeColorRgba(key, alpha) {
  return hexToRgba(NODE_COLORS[key], alpha);
}

// Express a NEUTRALS hex as an rgba() string at the given alpha — for the
// NetworkMap dot-grid (slate-300) and link color (slate-500), which need
// translucent neutrals at runtime (Canvas/CSS) the Tailwind tokens can't reach.
export function neutralRgba(key, alpha) {
  return hexToRgba(NEUTRALS[key], alpha);
}

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
