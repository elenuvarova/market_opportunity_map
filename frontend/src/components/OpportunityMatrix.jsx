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
} from "recharts";

// Keep hexes in sync with COMPONENT_BAR_COLORS / dot classes in decisionStyles.js.
// Recharts needs raw values, not Tailwind classnames.
const SCORE_HEX = {
  strong: "#10b981",        // emerald-500
  worth_validating: "#eab308", // yellow-500
  needs_more_research: "#f97316", // orange-500
  low_priority: "#94a3b8",   // slate-400
};

function scoreColor(score) {
  if (score >= 75) return SCORE_HEX.strong;
  if (score >= 60) return SCORE_HEX.worth_validating;
  if (score >= 40) return SCORE_HEX.needs_more_research;
  return SCORE_HEX.low_priority;
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
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-emerald-600" /> ≥75
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-yellow-500" /> 60–74
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> 40–59
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> &lt;40
          </span>
        </div>
      </div>

      <div className="h-[380px] w-full">
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
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
