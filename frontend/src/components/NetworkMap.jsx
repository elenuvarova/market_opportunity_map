import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import clsx from "clsx";
import {
  NODE_COLORS,
  NODE_LABELS,
  NODE_TYPES,
  NODE_CHIP_CLASSES,
} from "../lib/nodeStyles";
import { NEUTRALS, neutralRgba } from "../lib/tokens";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

// How many of the largest nodes always show a label (regardless of zoom). Keeps
// the graph legible on touch, where there's no hover and the default zoom is < 1.2.
const ALWAYS_LABELED = 7;

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
  const prefersReducedMotion = usePrefersReducedMotion();

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

  // The largest few visible nodes always carry a label so the map is readable
  // on touch (no hover, default zoom < 1.2). Ties broken by id for stability.
  const alwaysLabeledIds = useMemo(() => {
    const ranked = [...filtered.nodes].sort(
      (a, b) => (b.size || 0) - (a.size || 0) || String(a.id).localeCompare(String(b.id))
    );
    return new Set(ranked.slice(0, ALWAYS_LABELED).map((n) => n.id));
  }, [filtered.nodes]);

  // A stable signature of the visible node IDs (not just their count) so the
  // layout re-fits when a filter swaps to a different same-size node set, plus
  // `hasWidth` so the initial fit fires once the canvas actually has a size —
  // on first render width is 0, the graph (and thus fgRef) isn't mounted yet,
  // and a count-only dependency never re-runs to apply the forces or fit.
  const nodeSig = useMemo(
    () => filtered.nodes.map((n) => n.id).join("|"),
    [filtered.nodes]
  );
  const hasWidth = width > 0;

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !hasWidth) return;
    fg.d3Force("charge")?.strength(-180);
    fg.d3Force("link")?.distance(60);
    const t = setTimeout(() => fg.zoomToFit?.(400, 60), 200);
    return () => clearTimeout(t);
  }, [nodeSig, hasWidth]);

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
          className="input w-full sm:w-48"
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
                "chip transition cursor-pointer min-h-touch",
                active
                  ? NODE_CHIP_CLASSES[t]
                  : "bg-white text-slate-600 ring-1 ring-slate-200 line-through opacity-70"
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full mr-1.5"
                style={{ background: active ? NODE_COLORS[t] : NEUTRALS.slate300 }}
              />
              {NODE_LABELS[t]}
            </button>
          );
        })}
      </div>

      <div
        ref={containerRef}
        className={`relative h-chart-sm md:h-chart-lg bg-slate-50/40 ${
          hoverId ? "cursor-pointer" : "cursor-default"
        }`}
        style={{
          backgroundImage: `radial-gradient(circle, ${neutralRgba(
            "slate300",
            0.4
          )} 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
        role="img"
        aria-label={`Force-directed network of ${nodes.length} nodes across ${NODE_TYPES.length} types. The ranked opportunities table below carries the same scored insights for keyboard or screen-reader use.`}
      >
        <button
          type="button"
          onClick={() => fgRef.current?.zoomToFit?.(400, 60)}
          className="btn-secondary btn-sm absolute right-3 top-3 z-dropdown shadow-card min-h-touch"
          aria-label="Reset zoom and fit the whole network in view"
        >
          Reset view
        </button>
        {width > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={width}
            height={height || 520}
            graphData={filtered}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={4}
            nodeVal={(n) => Math.max(3, n.size / 4)}
            nodeColor={(n) => NODE_COLORS[n.type] || NEUTRALS.slate400}
            linkColor={() => neutralRgba("slate500", 0.35)}
            linkWidth={(l) => Math.min(4, 0.5 + (l.weight || 1) * 0.5)}
            linkDirectionalParticles={0}
            // Reduced-motion: pre-run the layout off-frame (warmupTicks) and
            // stop immediately (cooldownTicks=0) so the graph renders settled
            // with no visible drift. Otherwise animate the settle as usual.
            warmupTicks={prefersReducedMotion ? 120 : 0}
            cooldownTicks={prefersReducedMotion ? 0 : 120}
            onNodeHover={(n) => setHoverId(n?.id || null)}
            onNodeClick={(n) => onSelectNode?.(n)}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const isHover = node.id === hoverId;
              const isSelected = node.id === selectedNode?.id;
              // Always-on subtle ring so every node has a >=3:1 edge against the
              // ~#f8fafc graph background (WCAG 1.4.11). Light fills (feature,
              // pricing, opportunity) measure <3:1 on their own; this slate-500
              // outline (#64748b, ~4.6:1 on the bg) guarantees a visible boundary
              // regardless of fill. Hover/selection draw a heavier ring on top.
              const baseR = Math.max(4, node.size / 3);
              ctx.beginPath();
              ctx.arc(node.x, node.y, baseR, 0, 2 * Math.PI, false);
              ctx.strokeStyle = NEUTRALS.slate500;
              ctx.lineWidth = 1;
              ctx.stroke();
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
                ctx.strokeStyle = isSelected ? NEUTRALS.ink : NEUTRALS.slate500;
                ctx.lineWidth = isSelected ? 2 : 1.5;
                ctx.stroke();
              }
              const alwaysLabeled = alwaysLabeledIds.has(node.id);
              if (globalScale > 1.2 || isHover || isSelected || alwaysLabeled) {
                const fontSize = Math.max(10, 12 / globalScale);
                ctx.font = `${fontSize}px "Inter Variable", Inter, system-ui, sans-serif`;
                ctx.fillStyle = NEUTRALS.ink;
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
