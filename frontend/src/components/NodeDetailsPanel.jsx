import { NODE_LABELS, NODE_CHIP_CLASSES } from "../lib/nodeStyles";

export default function NodeDetailsPanel({ node, edges, nodes, onClose }) {
  if (!node) return null;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = edges
    .filter((e) => e.source === node.id || e.source?.id === node.id)
    .map((e) => ({
      ...e,
      target: byId.get(e.target?.id || e.target),
    }))
    .filter((e) => e.target);
  const incoming = edges
    .filter((e) => e.target === node.id || e.target?.id === node.id)
    .map((e) => ({
      ...e,
      source: byId.get(e.source?.id || e.source),
    }))
    .filter((e) => e.source);

  return (
    <aside className="card p-5 space-y-4 sticky top-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`chip ${NODE_CHIP_CLASSES[node.type] || ""}`}>
            {NODE_LABELS[node.type] || node.type}
          </span>
          <h3 className="mt-2 text-base font-semibold text-ink leading-tight">
            {node.label}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost px-2 py-1 text-xs"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs text-ink-muted">Frequency</div>
          <div className="text-sm font-semibold">{node.frequency}</div>
        </div>
        <div>
          <div className="text-xs text-ink-muted">Centrality</div>
          <div className="text-sm font-semibold">
            {(node.centrality ?? 0).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-muted">Betweenness</div>
          <div className="text-sm font-semibold">
            {(node.betweenness ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      {outgoing.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1.5">
            Connects to
          </div>
          <ul className="space-y-1 text-sm">
            {outgoing.slice(0, 6).map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 text-ink-soft"
              >
                <span className="truncate">{e.target.label}</span>
                <span
                  className={`chip ${NODE_CHIP_CLASSES[e.target.type] || ""}`}
                >
                  {NODE_LABELS[e.target.type] || e.target.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {incoming.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1.5">
            Connected from
          </div>
          <ul className="space-y-1 text-sm">
            {incoming.slice(0, 6).map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 text-ink-soft"
              >
                <span className="truncate">{e.source.label}</span>
                <span
                  className={`chip ${NODE_CHIP_CLASSES[e.source.type] || ""}`}
                >
                  {NODE_LABELS[e.source.type] || e.source.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
