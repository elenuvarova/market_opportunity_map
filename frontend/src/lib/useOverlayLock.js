import { useEffect } from "react";

// While an overlay (drawer / modal) is open this:
//   1. Locks page scroll (overflow:hidden on <html> + <body>) so the
//      background doesn't scroll behind the overlay.
//   2. Marks the main app shell `inert` + aria-hidden so the screen-reader
//      virtual cursor and Tab order can't escape behind the overlay.
// Both are reverted on close / unmount. Multiple overlays are reference-counted
// so closing one while another is still open doesn't prematurely unlock.

let lockCount = 0;
let prevHtmlOverflow = "";
let prevBodyOverflow = "";

function lockScroll() {
  if (lockCount === 0) {
    const html = document.documentElement;
    const body = document.body;
    prevHtmlOverflow = html.style.overflow;
    prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.overflow = prevHtmlOverflow;
    document.body.style.overflow = prevBodyOverflow;
  }
}

export function useOverlayLock(active, shellId = "app-shell") {
  useEffect(() => {
    if (!active) return;
    const shell = document.getElementById(shellId);
    lockScroll();
    if (shell) {
      shell.setAttribute("inert", "");
      shell.setAttribute("aria-hidden", "true");
    }
    return () => {
      unlockScroll();
      if (shell) {
        shell.removeAttribute("inert");
        shell.removeAttribute("aria-hidden");
      }
    };
  }, [active, shellId]);
}
