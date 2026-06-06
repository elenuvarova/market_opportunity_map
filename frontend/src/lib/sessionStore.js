// Stash the currently loaded dataset (demo/CSV/pasted) so a brief opened in a
// NEW TAB can rehydrate without an extra API round-trip and without server-side
// state for pasted/CSV inputs.
//
// Uses localStorage (not sessionStorage) on purpose: the "Generate brief" link
// is rel="noopener" (safe default for target=_blank), and noopener severs the
// sessionStorage clone the new tab would otherwise inherit — so a sessionStorage
// stash is unreadable in the brief tab. localStorage is shared across same-origin
// tabs, so the brief tab can always read it. Scope stays browser-local (no
// server, no network); it's cleared on Reset and overwritten on each new load.

const KEY = "mom:current-data";

export function saveCurrentData(data, meta) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ data, meta }));
  } catch {
    // storage full / disabled — ignore; the brief falls back to its error state
  }
}

export function loadCurrentData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCurrentData() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
