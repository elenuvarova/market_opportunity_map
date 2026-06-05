import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { analyzeCsv, loadDemoData, DEMO_DATASETS } from "./lib/api";
import FileUpload from "./components/FileUpload";
import EmptyState from "./components/EmptyState";
import ErrorMessage from "./components/ErrorMessage";
import SummaryCards from "./components/SummaryCards";
import NetworkMap from "./components/NetworkMap";
import NodeDetailsPanel from "./components/NodeDetailsPanel";
import OpportunityMatrix from "./components/OpportunityMatrix";
import CompetitorFeatureHeatmap from "./components/CompetitorFeatureHeatmap";
import OpportunitiesTable from "./components/OpportunitiesTable";
import DemoMenu from "./components/DemoMenu";
import ScoreBreakdownDrawer from "./components/ScoreBreakdownDrawer";
import DashboardSkeleton from "./components/DashboardSkeleton";
import TourController, { isTourAvailable } from "./components/TourController";
import PasteModal from "./components/PasteModal";
import HeaderOverflowMenu from "./components/HeaderOverflowMenu";
import { saveCurrentData, clearCurrentData } from "./lib/sessionStore";
import { NODE_COLORS } from "./lib/tokens";

// The tour anchors and copy are desktop-tuned; only offer it at md+ where the
// graph it highlights is laid out as designed.
function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sourceLabel, setSourceLabel] = useState(null);
  const [activeDemoKey, setActiveDemoKey] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [tourRunning, setTourRunning] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [dataSource, setDataSource] = useState(null); // "demo" | "csv" | "paste"
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInput = useRef(null);
  const isDesktop = useIsDesktop();
  const tourOffered = data && isTourAvailable(activeDemoKey) && !tourRunning && isDesktop;

  const runDemo = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadDemoData(key);
      setData(result);
      const meta = DEMO_DATASETS.find((d) => d.key === key);
      const label = `Demo · ${meta?.label || key || "data"}`;
      setSourceLabel(label);
      setActiveDemoKey(key || null);
      setDataSource("demo");
      setSelectedNode(null);
      saveCurrentData(result, { source: "demo", datasetKey: key, label });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-start tour when the URL has ?tour=<key> (or just ?tour=1, which
  // we treat as "product"). We strip the param after starting so reloads
  // don't re-fire.
  useEffect(() => {
    const tourParam = searchParams.get("tour");
    if (!tourParam) return;
    const requestedKey =
      tourParam === "1" ? "product" : isTourAvailable(tourParam) ? tourParam : null;
    if (!requestedKey) return;
    if (!data || activeDemoKey !== requestedKey) {
      runDemo(requestedKey);
      return;
    }
    if (!tourRunning) {
      setTourRunning(true);
      const next = new URLSearchParams(searchParams);
      next.delete("tour");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, data, activeDemoKey]);

  const runUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCsv(file);
      setData(result);
      setSourceLabel(file.name);
      setActiveDemoKey(null);
      setDataSource("csv");
      setSelectedNode(null);
      saveCurrentData(result, { source: "csv", label: file.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteResult = (result) => {
    setData(result);
    setSourceLabel("Pasted data");
    setActiveDemoKey(null);
    setDataSource("paste");
    setSelectedNode(null);
    setSelectedOpportunity(null);
    setPasteOpen(false);
    saveCurrentData(result, { source: "paste", label: "Pasted data" });
  };

  const reset = () => {
    setData(null);
    setSourceLabel(null);
    setActiveDemoKey(null);
    setDataSource(null);
    setSelectedNode(null);
    setSelectedOpportunity(null);
    setError(null);
    clearCurrentData();
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-skip focus:rounded-md focus:bg-ink focus:px-3 focus:py-1.5 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        Skip to content
      </a>
      <div id="app-shell">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur sticky top-0 z-sticky">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 grid place-items-center flex-shrink-0"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <line x1="6" y1="7" x2="14" y2="13" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="14" y1="13" x2="18" y2="6" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="14" y1="13" x2="10" y2="18" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="6" cy="7" r="2.4" fill={NODE_COLORS.segment} />
                <circle cx="18" cy="6" r="2.4" fill={NODE_COLORS.competitor} />
                <circle cx="14" cy="13" r="2.6" fill={NODE_COLORS.opportunity} />
                <circle cx="10" cy="18" r="2.2" fill={NODE_COLORS.pain} />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-ink leading-tight">
                Market Opportunity Map
              </h1>
              <p className="text-xs text-ink-muted leading-tight hidden sm:block">
                Visualize market gaps, competitor clusters, and strategic opportunities.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            <FileUpload ref={fileInput} onFile={runUpload} disabled={loading} />
            {/* Primary actions stay visible at every width. */}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInput.current?.click()}
              disabled={loading}
            >
              Upload CSV
            </button>
            <DemoMenu
              onPick={runDemo}
              disabled={loading}
              loading={loading}
              activeKey={activeDemoKey}
            />

            {/* Secondary actions: inline at lg+, collapsed into a "More" menu below. */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPasteOpen(true)}
                disabled={loading}
              >
                Paste
              </button>
              {tourOffered && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTourRunning(true)}
                  disabled={loading}
                >
                  Take a tour
                </button>
              )}
              {data && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={reset}
                  disabled={loading}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="lg:hidden">
              <HeaderOverflowMenu
                disabled={loading}
                onPaste={() => setPasteOpen(true)}
                onTour={tourOffered ? () => setTourRunning(true) : null}
                onReset={data ? reset : null}
              />
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}

        {!data && !loading && (
          <EmptyState
            onTryDemo={runDemo}
            onPickFile={() => fileInput.current?.click()}
            onOpenPaste={() => setPasteOpen(true)}
            loading={loading}
          />
        )}

        {!data && loading && <DashboardSkeleton />}

        {data && dataSource === "paste" && (
          <div className="notice-warn flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Rough graph from pasted input</p>
              <p className="mt-0.5 text-amber-800/90 text-xs">
                Scores are heuristic and competition intensity is derived from
                how many competitors you named. For higher-fidelity analysis,
                upload a CSV with the full schema.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPasteOpen(true)}
              className="text-xs font-medium text-amber-900 hover:underline whitespace-nowrap"
            >
              Edit paste
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Slim provenance bar — moved out of the header to keep header
                actions on one row. */}
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>Source:</span>
              <span className="font-medium text-ink truncate">{sourceLabel}</span>
            </div>

            <h2 className="sr-only">Summary</h2>
            <SummaryCards summary={data.summary} />

            {/* Visuals first — the network map is the most "portfolio-y"
                view and pulls a cold viewer in. Single column up to lg, then
                graph + details side-by-side (mirrors the matrix/heatmap pattern,
                avoiding the awkward md tall stack). */}
            <h2 className="sr-only">Network map and node details</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NetworkMap
                  nodes={data.nodes}
                  edges={data.edges}
                  onSelectNode={setSelectedNode}
                  selectedNode={selectedNode}
                />
              </div>
              <div>
                {selectedNode ? (
                  <NodeDetailsPanel
                    node={selectedNode}
                    nodes={data.nodes}
                    edges={data.edges}
                    onClose={() => setSelectedNode(null)}
                  />
                ) : (
                  <div className="card p-5 sticky top-4">
                    <h3 className="text-sm font-semibold text-ink">
                      Node details
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Click any node in the network to see its connections.
                    </p>
                    <div className="mt-4 text-xs text-ink-soft space-y-1.5">
                      <div>
                        <span className="font-medium text-ink">
                          {data.summary.top_opportunity}
                        </span>{" "}
                        — top-ranked opportunity
                        {data.summary.top_opportunity_score != null && (
                          <> (score {data.summary.top_opportunity_score}/100).</>
                        )}
                      </div>
                      <div>
                        Most underserved segment:{" "}
                        <span className="font-medium text-ink">
                          {data.summary.most_underserved_segment}
                        </span>
                        .
                      </div>
                      <div>
                        Most crowded area:{" "}
                        <span className="font-medium text-ink">
                          {data.summary.most_crowded_area}
                        </span>
                        .
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <h2 className="sr-only">Opportunity matrix and competitor coverage</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OpportunityMatrix matrix={data.matrix} />
              <CompetitorFeatureHeatmap data={data.competitor_feature_matrix} />
            </div>

            {/* Decision-ready table last — what a PM walks away with. */}
            <h2 className="sr-only">Ranked opportunities</h2>
            <OpportunitiesTable
              opportunities={data.opportunities}
              onSelectOpportunity={setSelectedOpportunity}
              datasetKey={activeDemoKey}
              briefSource={dataSource === "demo" ? "demo" : "session"}
            />
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-10 pt-2 text-xs text-ink-muted">
        Market Opportunity Map · MVP build
      </footer>
      </div>
      {/* Overlays live OUTSIDE #app-shell so the drawer/modal can mark the
          shell inert + aria-hidden without hiding themselves. The tour is also
          outside but intentionally does NOT lock the shell — it drives the
          shell's own controls. */}

      <ScoreBreakdownDrawer
        opportunity={selectedOpportunity}
        datasetKey={activeDemoKey}
        briefSource={dataSource === "demo" ? "demo" : dataSource ? "session" : null}
        onClose={() => setSelectedOpportunity(null)}
      />

      {tourRunning && data && (
        <TourController
          data={data}
          datasetKey={activeDemoKey}
          onSelectNode={setSelectedNode}
          onSelectOpportunity={setSelectedOpportunity}
          onClose={() => setTourRunning(false)}
        />
      )}

      <PasteModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onSubmit={handlePasteResult}
      />
    </div>
  );
}
