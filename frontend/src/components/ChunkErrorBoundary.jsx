import { Component } from "react";

// A dynamic import() of a hashed chunk 404s after a new deploy replaces it: a
// tab opened on the old build still references the old chunk hash, which no
// longer exists on the server. Since the app is code-split (lazy NetworkMap,
// charts, tour, brief route), that rejection would otherwise blank the lazy
// subtree. This boundary catches it and reloads ONCE to pick up the fresh
// index.html + new chunk hashes. A cooldown guards against a reload loop, so a
// genuinely broken build degrades to a manual "Reload" prompt instead of
// thrashing.

const RELOAD_KEY = "mom:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 12_000;

function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const msg = String(error.message || error);
  return /dynamically imported module|loading chunk [\w-]+ failed|importing a module script failed|error loading dynamically imported/i.test(
    msg
  );
}

export default class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) return;
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    } catch {
      /* storage disabled — fall through to the manual prompt */
    }
    const now = Date.now();
    if (now - last > RELOAD_COOLDOWN_MS) {
      try {
        sessionStorage.setItem(RELOAD_KEY, String(now));
      } catch {
        /* ignore */
      }
      this.setState({ reloading: true });
      window.location.reload();
    }
  }

  render() {
    const { error, reloading } = this.state;
    if (!error) return this.props.children;

    if (reloading) {
      return (
        <div
          className="min-h-screen grid place-items-center text-ink-muted text-sm"
          aria-live="polite"
        >
          Updating to the latest version…
        </div>
      );
    }

    const chunk = isChunkLoadError(error);
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="card p-6 max-w-md text-center">
          <h2 className="font-semibold text-ink">
            {chunk ? "A new version is available" : "Something went wrong"}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {chunk
              ? "Part of the app couldn't load — this usually means it was just updated."
              : "An unexpected error interrupted the page."}
          </p>
          <button
            type="button"
            className="btn-primary mt-4 inline-flex"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
