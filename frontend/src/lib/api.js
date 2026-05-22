const RAW_BASE = import.meta.env.VITE_API_URL?.trim();
// In dev: empty BASE → calls go to /demo etc. and Vite proxy forwards them.
// In prod with VITE_API_URL set: hit the backend service directly.
const BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, "") : "/api";

async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // not JSON, fall through
    }
    throw new Error(detail);
  }
  return res.json();
}

export function healthCheck() {
  return request("/health");
}

export function loadDemoData() {
  return request("/demo");
}

export function analyzeCsv(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/analyze", { method: "POST", body: form });
}
