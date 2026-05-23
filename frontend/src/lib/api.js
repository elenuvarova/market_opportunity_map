const RAW_BASE = import.meta.env.VITE_API_URL?.trim();
// In dev: empty BASE → calls go to /api/* and Vite proxy forwards them to the FastAPI backend.
// In prod with VITE_API_URL set: hit the backend service directly.
const BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, "") : "/api";

async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = JSON.parse(text);
      if (body?.detail) detail = body.detail;
    } catch {
      // not JSON
    }
    throw new Error(detail);
  }

  try {
    return JSON.parse(text);
  } catch {
    if (text.trim().startsWith("<")) {
      throw new Error(
        "Got HTML instead of JSON — the frontend isn't reaching the API. " +
          "If this is a Render deploy, set VITE_API_URL on the static site to your backend URL and redeploy."
      );
    }
    throw new Error("Server returned a non-JSON response.");
  }
}

export function healthCheck() {
  return request("/health");
}

export function loadDemoData(key) {
  const qs = key ? `?dataset=${encodeURIComponent(key)}` : "";
  return request(`/demo${qs}`);
}

export function analyzeCsv(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/analyze", { method: "POST", body: form });
}

export const DEMO_DATASETS = [
  {
    key: "product",
    label: "Product tools",
    description:
      "Segments and pains across product, design, and research tools.",
  },
  {
    key: "edtech",
    label: "EdTech & self-learning",
    description:
      "Career switchers, working pros, L&D — where today's courses fall short.",
  },
];
