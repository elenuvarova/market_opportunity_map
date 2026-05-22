import { useEffect, useState } from "react";

function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, error, loading };
}

function Card({ title, loading, error, data }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );
}

export default function App() {
  const hello = useFetch("/api/hello");
  const health = useFetch("/api/health");

  return (
    <main>
      <h1>Full-stack template</h1>
      <p className="muted">React + Vite · Express · Sequelize</p>
      <Card title="GET /api/hello" {...hello} />
      <Card title="GET /api/health" {...health} />
    </main>
  );
}
