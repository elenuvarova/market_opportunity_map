import { useMemo } from "react";

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
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">
            Competitor × feature coverage
          </h3>
          <p className="text-xs text-ink-muted">
            Filled cells = competitor has the feature. Darker columns = crowded areas.
          </p>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white text-left font-medium text-ink-muted px-2 pb-2 align-bottom">
                Competitor
              </th>
              {features.map((f) => (
                <th
                  key={f}
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
                <td className="sticky left-0 bg-white px-2 py-1.5 font-medium text-ink whitespace-nowrap">
                  {c}
                </td>
                {features.map((f) => {
                  const present = has.has(`${c}|||${f}`);
                  const crowd = featureCounts.get(f) || 0;
                  const opacity = present
                    ? Math.min(1, 0.35 + crowd / Math.max(1, competitors.length))
                    : 0;
                  return (
                    <td key={f} className="p-1">
                      <div
                        className="h-6 w-10 rounded-md border border-slate-200"
                        style={{
                          background: present
                            ? `rgba(15, 23, 42, ${opacity})`
                            : "transparent",
                        }}
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
