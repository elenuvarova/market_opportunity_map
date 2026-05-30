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

export function useFocusTrap(ref, isOpen, initialFocusSelector) {
  // Returns a setup callback to be used inside a useEffect.
  // Caller pattern:
  //   useEffect(() => {
  //     if (!open) return;
  //     return setupFocusTrap(ref.current, initialFocusSelector);
  //   }, [open]);
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
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      // Restore focus to whatever opened this surface.
      requestAnimationFrame(() => previouslyFocused.focus());
    }
  };
}
