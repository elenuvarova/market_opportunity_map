import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import { DECISION_COLORS } from "../lib/tokens";

// Legend rows reuse the named decision buckets used everywhere else (table chip,
// drawer badge, brief) so the matrix reads in the same language. Color alone is
// insufficient (WCAG 1.4.1) — every point also carries its score as a label.
const LEGEND = [
  { label: "Strong", range: "≥75", color: DECISION_COLORS.strong },
  { label: "Worth validating", range: "60–74", color: DECISION_COLORS.validate },
  { label: "Needs research", range: "40–59", color: DECISION_COLORS.research },
  { label: "Low", range: "<40", color: DECISION_COLORS.low },
];

// Recharts needs raw hex, not Tailwind classnames. Colors come from the single
// source of truth (lib/tokens.js). Thresholds mirror decisionStyles.decisionForScore.
function scoreColor(score) {
  if (score >= 75) return DECISION_COLORS.strong;
  if (score >= 60) return DECISION_COLORS.validate;
  if (score >= 40) return DECISION_COLORS.research;
  return DECISION_COLORS.low;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-card">
      <div className="font-semibold text-ink">{d.opportunity}</div>
      <div className="text-ink-muted mt-0.5">{d.segment}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-ink-soft">
        <div>Severity</div>
        <div className="font-medium text-right">{d.y_severity}</div>
        <div>Competition</div>
        <div className="font-medium text-right">{d.x_competition}</div>
        <div>Evidence</div>
        <div className="font-medium text-right">{d.bubble_size}</div>
        <div>Score</div>
        <div className="font-medium text-right">{d.score}</div>
      </div>
    </div>
  );
}

export default function OpportunityMatrix({ matrix }) {
  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Opportunity matrix</h3>
          <p className="text-xs text-ink-muted">
            Severity × competition. Top-left is the strongest play.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          {LEGEND.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              {l.label}
              <span className="text-ink-muted/70">({l.range})</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-chart-sm w-full">
        {/* Faint quadrant guidance — the top-left "best play" corner is the
            actionable signal a PM is hunting for. aria-hidden: decorative. */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] text-2xs font-medium text-ink-muted/70"
          aria-hidden="true"
        >
          <span className="absolute left-10 top-3 max-w-[45%]">
            High pain · low competition = best play
          </span>
          <span className="absolute right-5 top-3 max-w-[40%] text-right">
            High pain · crowded
          </span>
          <span className="absolute left-10 bottom-10 max-w-[40%]">
            Low pain · open space
          </span>
          <span className="absolute right-5 bottom-10 max-w-[40%] text-right">
            Low pain · crowded
          </span>
        </div>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x_competition"
              domain={[0, 10]}
              tickCount={6}
              stroke="#64748b"
              fontSize={12}
              label={{
                value: "Competition intensity",
                position: "insideBottom",
                offset: -12,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y_severity"
              domain={[0, 10]}
              tickCount={6}
              stroke="#64748b"
              fontSize={12}
              label={{
                value: "Pain severity",
                angle: -90,
                position: "insideLeft",
                offset: 8,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
            <ZAxis
              type="number"
              dataKey="bubble_size"
              range={[60, 360]}
              name="evidence"
            />
            <ReferenceLine x={5} stroke="#cbd5e1" strokeDasharray="4 4" />
            <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={matrix} fillOpacity={0.85}>
              {matrix.map((d, i) => (
                <Cell key={i} fill={scoreColor(d.score)} />
              ))}
              {/* Non-color channel: every point shows its score, so the
                  decision bands are legible without relying on hue (WCAG 1.4.1). */}
              <LabelList
                dataKey="score"
                position="top"
                offset={6}
                fontSize={10}
                fill="#0f172a"
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
