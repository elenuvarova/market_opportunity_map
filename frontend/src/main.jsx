import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary.jsx";
import "@fontsource-variable/inter";
import "./index.css";

// The brief is its own print-oriented route that shares NONE of the dashboard's
// heavy deps (no force-graph, no driver.js). Lazy-loading it keeps brief-only
// code out of the dashboard chunk and keeps the force-graph/driver stack out of
// the brief route's critical path.
const OpportunityBrief = lazy(() => import("./components/OpportunityBrief.jsx"));

// Minimal route-level fallback. The brief renders its own loading state once
// mounted; this only covers the few ms of fetching its chunk.
function RouteFallback() {
  return (
    <div
      className="mx-auto max-w-3xl px-6 py-10"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-6 w-48 rounded bg-slate-200/70 animate-pulse" />
      <div className="mt-4 h-3 w-72 rounded bg-slate-200/70 animate-pulse" />
      <div className="mt-8 h-64 rounded-lg bg-slate-100/80 animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChunkErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/opportunity/:id/brief" element={<OpportunityBrief />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ChunkErrorBoundary>
  </React.StrictMode>
);
