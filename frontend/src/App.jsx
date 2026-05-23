import { useRef, useState } from "react";
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

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sourceLabel, setSourceLabel] = useState(null);
  const [activeDemoKey, setActiveDemoKey] = useState(null);
  const fileInput = useRef(null);

  const runDemo = async (key) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadDemoData(key);
      setData(result);
      const meta = DEMO_DATASETS.find((d) => d.key === key);
      setSourceLabel(`Demo · ${meta?.label || key || "data"}`);
      setActiveDemoKey(key || null);
      setSelectedNode(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCsv(file);
      setData(result);
      setSourceLabel(file.name);
      setActiveDemoKey(null);
      setSelectedNode(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setSourceLabel(null);
    setActiveDemoKey(null);
    setSelectedNode(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 grid place-items-center text-white font-semibold">
              M
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-ink leading-tight">
                Market Opportunity Map
              </h1>
              <p className="text-xs text-ink-muted leading-tight">
                Visualize market gaps, competitor clusters, and strategic opportunities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && (
              <span className="text-xs text-ink-muted hidden sm:inline">
                Source: <span className="font-medium text-ink">{sourceLabel}</span>
              </span>
            )}
            <FileUpload ref={fileInput} onFile={runUpload} disabled={loading} />
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}

        {!data && (
          <EmptyState
            onTryDemo={runDemo}
            onPickFile={() => fileInput.current?.click()}
            loading={loading}
          />
        )}

        {data && (
          <>
            <SummaryCards summary={data.summary} />

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OpportunityMatrix matrix={data.matrix} />
              <CompetitorFeatureHeatmap data={data.competitor_feature_matrix} />
            </div>

            <OpportunitiesTable opportunities={data.opportunities} />
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-10 pt-2 text-xs text-ink-muted">
        Market Opportunity Map · MVP build
      </footer>
    </div>
  );
}
