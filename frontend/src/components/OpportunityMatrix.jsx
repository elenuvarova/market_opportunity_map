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
} from "recharts";
import { DECISION_COLORS, NEUTRALS } from "../lib/tokens";

// Deterministic jitter: opportunities frequently share the exact same
// (competition, severity) cell AND the same decision band, so their identical
// glyphs would stack into an unreadable blob. Group by the rounded cell and fan
// any group with >1 member out on a small circle (golden-angle spacing so the
// fan looks even). Plotted x/y carry the offset; the ORIGINAL values stay on
// the point for the tooltip. Single-occupancy cells are untouched.
const JITTER_RADIUS = 0.3; // axis units
const GOLDEN_ANGLE = 2.399963; // radians
const clamp10 = (v) => Math.max(0, Math.min(10, v));

function withJitter(matrix) {
  const groups = new Map();
  for (const d of matrix) {
    const key = `${Math.round(d.x_competition)}|${Math.round(d.y_severity)}`;
    const arr = groups.get(key);
    if (arr) arr.push(d);
    else groups.set(key, [d]);
  }
  const out = [];
  for (const members of groups.values()) {
    if (members.length === 1) {
      const d = members[0];
      out.push({ ...d, x: d.x_competition, y: d.y_severity });
      continue;
    }
    members.forEach((d, i) => {
      const angle = i * GOLDEN_ANGLE;
      out.push({
        ...d,
        x: clamp10(d.x_competition + JITTER_RADIUS * Math.cos(angle)),
        y: clamp10(d.y_severity + JITTER_RADIUS * Math.sin(angle)),
      });
    });
  }
  return out;
}

// Decision bands carry BOTH a color and a distinct point SHAPE. Color alone is
// insufficient (WCAG 1.4.1), and numeric per-point labels can't be used here:
// multiple opportunities often share the exact same (severity, competition) cell,
// so their labels would print on top of each other. Shape is a non-color channel
// that survives overlapping points; exact scores live in the tooltip and the
// adjacent (fully accessible) opportunities table. Thresholds + colors mirror
// decisionStyles / lib/tokens (single source of truth).
const BANDS = [
  { key: "strong", label: "Strong", range: "≥75", shape: "star", color: DECISION_COLORS.strong, test: (s) => s >= 75 },
  { key: "validate", label: "Worth validating", range: "60–74", shape: "circle", color: DECISION_COLORS.validate, test: (s) => s >= 60 && s < 75 },
  { key: "research", label: "Needs research", range: "40–59", shape: "diamond", color: DECISION_COLORS.research, test: (s) => s >= 40 && s < 60 },
  { key: "low", label: "Low", range: "<40", shape: "triangle", color: DECISION_COLORS.low, test: (s) => s < 40 },
];

// Tiny inline marker so the legend shows the shape↔band mapping, not just color.
function LegendMarker({ shape, color }) {
  const common = { fill: color };
  let glyph;
  if (shape === "star") {
    glyph = <path d="M6 0.5l1.6 3.6 3.9.3-3 2.6.95 3.8L6 9.3 2.6 11.4l.95-3.8-3-2.6 3.9-.3z" {...common} />;
  } else if (shape === "diamond") {
    glyph = <path d="M6 0.5L11.5 6 6 11.5.5 6z" {...common} />;
  } else if (shape === "triangle") {
    glyph = <path d="M6 1l5 9.5H1z" {...common} />;
  } else {
    glyph = <circle cx="6" cy="6" r="5" {...common} />;
  }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      {glyph}
    </svg>
  );
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
  const jittered = withJitter(matrix);
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
          {BANDS.map((b) => (
            <span key={b.key} className="inline-flex items-center gap-1 whitespace-nowrap">
              <LegendMarker shape={b.shape} color={b.color} />
              {b.label}
              <span className="text-ink-muted/70">({b.range})</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-[440px] sm:h-chart-sm w-full">
        {/* Faint quadrant guidance — only the top-left "best play" corner, the
            actionable signal a PM is hunting for. The other three quadrants are
            self-evident from the axes and just add clutter. Hidden on mobile so
            it doesn't crowd the jittered points. aria-hidden: decorative. */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] text-2xs font-medium text-ink-muted/70"
          aria-hidden="true"
        >
          <span className="hidden sm:block absolute left-10 top-3 max-w-[45%]">
            High pain · low competition = best play
          </span>
        </div>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={NEUTRALS.slate200} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 10]}
              tickCount={6}
              stroke={NEUTRALS.slate500}
              fontSize={12}
              label={{
                value: "Competition intensity",
                position: "insideBottom",
                offset: -12,
                fill: NEUTRALS.slate500,
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 10]}
              tickCount={6}
              stroke={NEUTRALS.slate500}
              fontSize={12}
              label={{
                value: "Pain severity",
                angle: -90,
                position: "insideLeft",
                offset: 8,
                fill: NEUTRALS.slate500,
                fontSize: 12,
              }}
            />
            <ZAxis
              type="number"
              dataKey="bubble_size"
              range={[60, 360]}
              name="evidence"
            />
            <ReferenceLine x={5} stroke={NEUTRALS.slate300} strokeDasharray="4 4" />
            <ReferenceLine y={5} stroke={NEUTRALS.slate300} strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            {/* One series per decision band: each gets a distinct SHAPE (the
                non-color channel) plus its band color. Bubble size = evidence.
                A thin white stroke separates overlapping/jittered glyphs at
                their edges. */}
            {BANDS.map((b) => {
              const pts = jittered.filter((d) => b.test(d.score));
              if (!pts.length) return null;
              return (
                <Scatter
                  key={b.key}
                  name={b.label}
                  data={pts}
                  shape={b.shape}
                  fill={b.color}
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
