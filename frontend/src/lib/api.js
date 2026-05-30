const RAW_BASE = import.meta.env.VITE_API_URL?.trim();
// In dev: empty BASE → calls go to /api/* and Vite proxy forwards them to the FastAPI backend.
// In prod with VITE_API_URL set: hit the backend service directly.
const BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, "") : "/api";

function friendlyError(status, serverDetail) {
  // Cap-specific user-friendly copy, falls back to server message.
  if (status === 429) {
    return "You're hitting the analyze/paste rate limit (15/min). Wait a minute and try again.";
  }
  if (status === 413) {
    if (serverDetail?.toLowerCase().includes("csv")) {
      return "CSV is over the 2 MB limit. Trim rows or split the file and try again.";
    }
    if (serverDetail?.toLowerCase().includes("text")) {
      return "Pasted text is over the 100 KB-per-block limit. Trim to the most important quotes and try again.";
    }
    return serverDetail || "Upload is too large.";
  }
  if (status === 422 && serverDetail?.toLowerCase().includes("missing required")) {
    return `${serverDetail} Need a hand? Download the sample CSV from the empty state.`;
  }
  return serverDetail || `Request failed (${status})`;
}

async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();

  if (!res.ok) {
    let detail;
    try {
      const body = JSON.parse(text);
      detail = body?.detail;
    } catch {
      // not JSON
    }
    throw new Error(friendlyError(res.status, detail));
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

export function getOpportunityBreakdown(opportunityId, dataset) {
  const qs = dataset ? `?dataset=${encodeURIComponent(dataset)}` : "";
  return request(`/opportunities/${encodeURIComponent(opportunityId)}/breakdown${qs}`);
}

export function getOpportunityBrief(opportunityId, dataset) {
  const qs = dataset ? `?dataset=${encodeURIComponent(dataset)}` : "";
  return request(`/opportunities/${encodeURIComponent(opportunityId)}/brief${qs}`);
}

export function assembleFromPaste(payload) {
  return request("/assemble", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
