import { useMemo } from "react";
import { nodeColorRgba } from "../lib/tokens";

export default function CompetitorFeatureHeatmap({ data }) {
  const { competitors, features, has } = useMemo(() => {
    const competitorSet = new Set();
    const featureSet = new Set();
    const map = new Set();
    for (const row of data) {
      competitorSet.add(row.competitor);
      featureSet.add(row.feature);
      if (row.value > 0) map.add(`${row.competitor}|||${row.feature}`);
    }
    return {
      competitors: [...competitorSet].sort(),
      features: [...featureSet].sort(),
      has: map,
    };
  }, [data]);

  const featureCounts = useMemo(() => {
    const counts = new Map();
    for (const f of features) {
      let n = 0;
      for (const c of competitors) {
        if (has.has(`${c}|||${f}`)) n += 1;
      }
      counts.set(f, n);
    }
    return counts;
  }, [features, competitors, has]);

  return (
    // min-w-0 lets the grid/flex track shrink below the table's intrinsic width
    // so the inner overflow-auto actually scrolls instead of widening the page.
    <div className="card p-5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">
            Competitor × feature coverage
          </h3>
          <p className="text-xs text-ink-muted">
            Filled cells = competitor has the feature. Darker columns = crowded areas.
          </p>
        </div>
        {/* Inline legend so the opacity ramp reads without hovering. The ramp
            itself is decorative (aria-hidden), but the container carries a text
            equivalent so the meaning isn't color-only for AT. */}
        <div
          className="flex items-center gap-2 text-2xs text-ink-muted"
          role="img"
          aria-label="Cell shade shows how many competitors cover a feature: lighter = fewer, darker = more."
        >
          <span aria-hidden="true">Fewer</span>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {[0.35, 0.55, 0.75, 1].map((o) => (
              <span
                key={o}
                className="h-3 w-4 rounded-md border border-slate-200"
                style={{ background: nodeColorRgba("competitor", o) }}
              />
            ))}
          </span>
          <span aria-hidden="true">More competitors</span>
        </div>
      </div>

      <div className="overflow-auto">
        {/* mx-auto centers the table when it's narrower than the card (common at
            lg, where the matrix sets the column height) so the card isn't
            half-empty; it still scrolls horizontally when it overflows. */}
        <table className="mx-auto text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-white text-left font-medium text-ink-muted px-2 pb-2 align-bottom"
              >
                Competitor
              </th>
              {features.map((f) => (
                <th
                  key={f}
                  scope="col"
                  className="px-0 pb-2 align-bottom"
                  title={f}
                >
                  <div
                    className="mx-auto font-medium text-ink-muted whitespace-nowrap"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {f}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr key={c} className="hover:bg-slate-50">
                <th
                  scope="row"
                  className="sticky left-0 bg-white px-2 py-1.5 text-left font-medium text-ink whitespace-nowrap"
                >
                  {c}
                </th>
                {features.map((f) => {
                  const present = has.has(`${c}|||${f}`);
                  const crowd = featureCounts.get(f) || 0;
                  const opacity = present
                    ? Math.min(1, 0.35 + crowd / Math.max(1, competitors.length))
                    : 0;
                  const label = present
                    ? `${c} covers ${f} (${crowd} competitor${crowd === 1 ? "" : "s"} cover this feature)`
                    : `${c} does not cover ${f}`;
                  return (
                    <td key={f} className="p-1">
                      {/* aria-label carries the AT-readable description (the cell
                          otherwise conveys data via color only). role="img" so
                          screen readers announce the label, not an empty box. */}
                      <div
                        role="img"
                        aria-label={label}
                        className={`h-6 w-10 rounded-md border border-slate-200 ${
                          present ? "" : "bg-slate-50"
                        }`}
                        style={
                          present
                            ? // competitor-purple matches the network-map competitor
                              // node color (single-sourced) — darker = more crowded.
                              { background: nodeColorRgba("competitor", opacity) }
                            : undefined
                        }
                        title={`${c} → ${f}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
