// Render during the cold-start fetch (Render free tier wakes up in ~30s).
// Mirrors the post-data layout so the page doesn't "jump" when data arrives.

function Bar({ className = "" }) {
  return <div className={`rounded bg-slate-200/70 animate-pulse ${className}`} />;
}

function Card({ className = "", children }) {
  return (
    <div className={`card p-5 ${className}`}>
      {children}
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading dashboard…</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <Bar className="h-3 w-20" />
            <Bar className="mt-3 h-6 w-16" />
          </Card>
        ))}
      </div>

      <Card>
        <Bar className="h-4 w-44" />
        <Bar className="mt-2 h-3 w-72" />
        <div className="mt-5 space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bar className="h-3 w-6" />
              <Bar className="h-3 flex-1" />
              <Bar className="h-3 w-16" />
              <Bar className="h-5 w-24" />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Bar className="h-4 w-32" />
          <Bar className="mt-2 h-3 w-56" />
          <div className="mt-4 h-64 rounded-lg bg-slate-100/80 animate-pulse" />
        </Card>
        <Card>
          <Bar className="h-4 w-44" />
          <Bar className="mt-2 h-3 w-64" />
          <div className="mt-4 h-64 rounded-lg bg-slate-100/80 animate-pulse" />
        </Card>
      </div>

      <p className="text-center text-xs text-ink-muted">
        First request after idle on Render free tier wakes the server up — about 20–30 seconds.
      </p>
    </div>
  );
}
