import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import clsx from "clsx";
import {
  NODE_COLORS,
  NODE_LABELS,
  NODE_TYPES,
  NODE_CHIP_CLASSES,
} from "../lib/nodeStyles";

function useContainerSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 480 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setSize({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export default function NetworkMap({ nodes, edges, onSelectNode, selectedNode }) {
  const containerRef = useRef(null);
  const fgRef = useRef();
  const { width, height } = useContainerSize(containerRef);
  const [activeTypes, setActiveTypes] = useState(() => new Set(NODE_TYPES));
  const [query, setQuery] = useState("");
  const [hoverId, setHoverId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const passes = (n) =>
      activeTypes.has(n.type) && (!q || n.label.toLowerCase().includes(q));

    const visibleNodes = nodes.filter(passes);
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );

    return {
      nodes: visibleNodes.map((n) => ({ ...n })),
      links: visibleEdges.map((e) => ({ ...e })),
    };
  }, [nodes, edges, activeTypes, query]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-180);
    fg.d3Force("link")?.distance(60);
    const t = setTimeout(() => fg.zoomToFit?.(400, 60), 200);
    return () => clearTimeout(t);
  }, [filtered.nodes.length]);

  const toggleType = (t) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="card overflow-hidden" data-tour-id="network-map">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Network map</h3>
          <p className="text-xs text-ink-muted">
            How segments, pains, competitors, features, and opportunities connect.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes…"
          aria-label="Search nodes by label"
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:border-slate-400"
        />
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-200/70 bg-slate-50/60"
        role="group"
        aria-label="Filter network nodes by type"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted mr-1">
          Show:
        </span>
        {NODE_TYPES.map((t) => {
          const active = activeTypes.has(t);
          return (
            <button
              type="button"
              key={t}
              onClick={() => toggleType(t)}
              aria-pressed={active}
              aria-label={`${active ? "Hide" : "Show"} ${NODE_LABELS[t]} nodes`}
              className={clsx(
                "chip transition cursor-pointer",
                active
                  ? NODE_CHIP_CLASSES[t]
                  : "bg-white text-slate-600 ring-1 ring-slate-200 line-through opacity-70"
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full mr-1.5"
                style={{ background: active ? NODE_COLORS[t] : "#cbd5e1" }}
              />
              {NODE_LABELS[t]}
            </button>
          );
        })}
      </div>

      <div
        ref={containerRef}
        className={`relative h-[520px] bg-slate-50/40 ${
          hoverId ? "cursor-pointer" : "cursor-default"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(203 213 225 / 0.4) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        role="img"
        aria-label={`Force-directed network of ${nodes.length} nodes across ${NODE_TYPES.length} types. The ranked opportunities table below carries the same scored insights for keyboard or screen-reader use.`}
      >
        {width > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={width}
            height={height || 520}
            graphData={filtered}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={4}
            nodeVal={(n) => Math.max(3, n.size / 4)}
            nodeColor={(n) => NODE_COLORS[n.type] || "#94a3b8"}
            linkColor={() => "rgba(100,116,139,0.35)"}
            linkWidth={(l) => Math.min(4, 0.5 + (l.weight || 1) * 0.5)}
            linkDirectionalParticles={0}
            cooldownTicks={120}
            onNodeHover={(n) => setHoverId(n?.id || null)}
            onNodeClick={(n) => onSelectNode?.(n)}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const isHover = node.id === hoverId;
              const isSelected = node.id === selectedNode?.id;
              if (isHover || isSelected) {
                ctx.beginPath();
                ctx.arc(
                  node.x,
                  node.y,
                  Math.max(4, node.size / 3),
                  0,
                  2 * Math.PI,
                  false
                );
                ctx.strokeStyle = isSelected ? "#0f172a" : "#64748b";
                ctx.lineWidth = isSelected ? 2 : 1.5;
                ctx.stroke();
              }
              if (globalScale > 1.2 || isHover || isSelected) {
                const fontSize = Math.max(10, 12 / globalScale);
                ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                ctx.fillStyle = "#0f172a";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(
                  node.label,
                  node.x,
                  node.y + Math.max(4, node.size / 3) + 2
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
