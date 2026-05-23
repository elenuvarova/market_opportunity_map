// Stash the currently loaded dataset (demo/CSV/pasted) so a brief opened
// in a new tab can rehydrate without an extra API round-trip and without
// requiring server-side state for pasted/CSV inputs.

const KEY = "mom:current-data";

export function saveCurrentData(data, meta) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ data, meta }));
  } catch {
    // session storage full / disabled — ignore, brief will just fall back
  }
}

export function loadCurrentData() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCurrentData() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
