// Minimal focus trap + restore for modal-like surfaces.
// On open: remembers document.activeElement, focuses the first focusable
// element inside the container (or the container itself), and wraps Tab/
// Shift+Tab when focus would leave the container.
// On close: restores focus to the previously-focused element.

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableEls(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && !el.closest("[aria-hidden='true']");
  });
}

export function setupFocusTrap(container, initialFocusSelector) {
  if (!container) return () => {};
  const previouslyFocused = document.activeElement;

  const focusFirst = () => {
    const target =
      (initialFocusSelector && container.querySelector(initialFocusSelector)) ||
      getFocusableEls(container)[0] ||
      container;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  };

  // Defer one frame so React has rendered and elements are reachable.
  requestAnimationFrame(focusFirst);

  const onKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const focusable = getFocusableEls(container);
    if (focusable.length === 0) {
      e.preventDefault();
      container.focus?.();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);

  return () => {
    container.removeEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      // Restore focus to whatever opened this surface — but only if it's still
      // in the document. After a close the trigger may have unmounted (e.g. a
      // table row that re-rendered); restoring to a detached node silently drops
      // focus onto <body>, stranding screen-reader users. Fall back to a sensible
      // anchor (the skip link, then <main>, then <body>) in that case.
      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === "function" &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
        return;
      }
      const anchor =
        document.querySelector('a[href="#main"]') ||
        document.getElementById("main") ||
        document.body;
      if (anchor && typeof anchor.focus === "function") {
        // <main> isn't focusable by default; make it programmatically focusable
        // for this one restore so focus lands somewhere meaningful.
        if (anchor.id === "main" && !anchor.hasAttribute("tabindex")) {
          anchor.setAttribute("tabindex", "-1");
        }
        anchor.focus();
      }
    });
  };
}
