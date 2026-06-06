import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { TOUR_SCRIPTS } from "../lib/tourScripts";

// TOUR_SCRIPTS and isTourAvailable now live in ../lib/tourScripts so App can
// run the cheap availability check synchronously without pulling driver.js
// (this file) into the initial bundle. Re-export isTourAvailable here for any
// callers that still reach for it via this module.
export { isTourAvailable } from "../lib/tourScripts";

function findNode(nodes, id) {
  return nodes.find((n) => n.id === id) || null;
}

function findOpportunity(opportunities, id) {
  return opportunities.find((o) => o.id === id) || null;
}

function buildSteps(script, data, onSelectNode, onSelectOpportunity) {
  const seg = findNode(data.nodes, script.segmentNodeId);
  const pain = findNode(data.nodes, script.painNodeId);
  const competitor = findNode(data.nodes, script.competitorNodeId);
  const opp = findNode(data.nodes, script.opportunityNodeId);
  const oppRow = findOpportunity(data.opportunities, script.opportunitySlug);

  if (!seg || !pain || !competitor || !opp || !oppRow) return null;

  const painRow = data.opportunities.find((o) => o.pain_point === script.painLabel);
  if (!painRow) return null;

  return [
    {
      element: '[data-tour-id="network-map"]',
      onHighlightStarted: () => {
        onSelectOpportunity(null);
        onSelectNode(seg);
      },
      popover: {
        title: "1 / 7 — Customer segments",
        description: `Each <b>blue node</b> is a customer group. Around <b>${script.segmentLabel}</b> sit their pain points (red), competitors covering this space (purple), features (green), and possible opportunities (yellow).`,
        side: "left",
      },
    },
    {
      element: '[data-tour-id="network-map"]',
      onHighlightStarted: () => onSelectNode(pain),
      popover: {
        title: "2 / 7 — A high-severity pain",
        description: `<b>"${script.painLabel}"</b> — severity ${painRow.severity}/10, willingness to pay ${painRow.willingness_to_pay}/10. ${script.painSourcesNote}`,
        side: "left",
      },
    },
    {
      element: '[data-tour-id="network-map"]',
      onHighlightStarted: () => onSelectNode(competitor),
      popover: {
        title: "3 / 7 — Crowded competitor area",
        description: script.competitorNarrative,
        side: "left",
      },
    },
    {
      element: '[data-tour-id="network-map"]',
      onHighlightStarted: () => onSelectNode(opp),
      popover: {
        title: "4 / 7 — The opportunity",
        description: `This gap becomes <b>"${script.opportunityLabel}"</b>, scored <b>${oppRow.opportunity_score}/100</b> — the top opportunity in this dataset. Click any opportunity to see why.`,
        side: "left",
      },
    },
    {
      element: '[data-tour-id="drawer"]',
      onHighlightStarted: () => {
        onSelectNode(null);
        onSelectOpportunity(oppRow);
      },
      popover: {
        title: "5 / 7 — Why this score?",
        description:
          "Each score decomposes into 4 weighted components — severity, willingness to pay, low competition, evidence strength. Every supporting signal links back to a real Reddit thread, Lenny's article, or vendor pricing page.",
        side: "left",
      },
    },
    {
      element: '[data-tour-id="brief-link-top"]',
      onHighlightStarted: () => onSelectOpportunity(null),
      popover: {
        title: "6 / 7 — Generate a brief",
        description:
          "Click <b>Open one-pager →</b> to open a print-friendly brief — the artifact a PM takes to a strategy meeting. It includes score breakdown, top signals, competitive landscape, open questions, and a recommended next step.",
        side: "left",
      },
    },
    {
      element: "body",
      popover: {
        title: "7 / 7 — That's the loop",
        description: `Signals → score → decision → next step. <br/><br/>${script.otherDatasetCta}`,
        side: "over",
        align: "center",
      },
    },
  ];
}

export default function TourController({
  data,
  datasetKey,
  onSelectNode,
  onSelectOpportunity,
  onClose,
}) {
  const driverRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!data) return;
    const script = TOUR_SCRIPTS[datasetKey];
    if (!script) {
      onClose();
      return;
    }
    const allSteps = buildSteps(script, data, onSelectNode, onSelectOpportunity);
    if (!allSteps) {
      onClose();
      return;
    }

    // Drop any step whose anchor isn't in the DOM so driver.js never highlights
    // a missing element. `body` and the drawer (mounted on demand by an earlier
    // step's onHighlightStarted) are always kept.
    const steps = allSteps.filter((s) => {
      const sel = s.element;
      if (!sel || sel === "body" || sel === '[data-tour-id="drawer"]') return true;
      return !!document.querySelector(sel);
    });
    if (steps.length === 0) {
      onClose();
      return;
    }

    // Remember what had focus so we can restore it when the tour ends.
    const previouslyFocused = document.activeElement;

    const obj = driver({
      showProgress: false,
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Finish",
      smoothScroll: true,
      animate: !prefersReducedMotion,
      overlayOpacity: 0.5,
      steps,
      onDestroyed: () => {
        onSelectNode(null);
        onSelectOpportunity(null);
        if (
          previouslyFocused &&
          typeof previouslyFocused.focus === "function" &&
          document.contains(previouslyFocused)
        ) {
          previouslyFocused.focus();
        }
        onClose();
      },
    });

    driverRef.current = obj;
    obj.drive();

    return () => {
      if (driverRef.current && driverRef.current.isActive?.()) {
        driverRef.current.destroy();
      }
      driverRef.current = null;
    };
    // We intentionally only re-run if the dataset shape changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, datasetKey]);

  return null;
}
