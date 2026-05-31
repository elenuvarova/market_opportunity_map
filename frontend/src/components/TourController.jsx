import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// One scripted tour per demo dataset. Each script names the four canonical
// nodes (segment / pain / competitor / opportunity) and provides the
// dataset-specific narrative for steps 2 and 3. Numbers (severity, WTP,
// score) are pulled from the live data so the copy can't drift.

const TOUR_SCRIPTS = {
  product: {
    segmentNodeId: "segment:Heads of Product",
    painNodeId: "pain_point:Strategy doesn't make it down to squads",
    competitorNodeId: "competitor:Productboard",
    opportunityNodeId: "opportunity:Strategy cascade tool",
    opportunitySlug: "strategy-cascade-tool",
    segmentLabel: "Heads of Product",
    painLabel: "Strategy doesn't make it down to squads",
    painSourcesNote: "Captured from Lenny's newsletter (Headspace case) and the Department of Product blog.",
    competitorNarrative:
      "<b>Productboard</b> sits next to this pain — it covers Prioritization and Strategy planning at Enterprise tier. But for Heads of Product, none of the established tools fully close the squad-level cascade gap.",
    opportunityLabel: "Strategy cascade tool",
    otherDatasetCta:
      "Try the <b>EdTech</b> dataset for a different domain, or upload your own CSV to see the same dashboard against your research.",
  },
  edtech: {
    segmentNodeId: "segment:L&D managers",
    painNodeId: "pain_point:Can't show leadership how training translates to business outcomes",
    competitorNodeId: "competitor:LinkedIn Learning",
    opportunityNodeId: "opportunity:Skills-to-business-outcome analytics",
    opportunitySlug: "skills-to-business-outcome-analytics",
    segmentLabel: "L&D managers",
    painLabel: "Can't show leadership how training translates to business outcomes",
    painSourcesNote: "Documented in the GPStrategies 'Measuring Business Impact of Learning 2025' report and Kirkpatrick Level-4 industry coverage.",
    competitorNarrative:
      "<b>LinkedIn Learning</b> sits in this space at Enterprise tier with AI Learning Plans and LMS/LXP integrations. But 90% of L&D orgs still can't prove business impact — even with the vendor's own ROI page on hand.",
    opportunityLabel: "Skills-to-business-outcome analytics",
    otherDatasetCta:
      "Try the <b>Product tools</b> dataset for a different domain, or upload your own CSV to see the same dashboard against your research.",
  },
};

export function isTourAvailable(datasetKey) {
  return !!datasetKey && datasetKey in TOUR_SCRIPTS;
}

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

  useEffect(() => {
    if (!data) return;
    const script = TOUR_SCRIPTS[datasetKey];
    if (!script) {
      onClose();
      return;
    }
    const steps = buildSteps(script, data, onSelectNode, onSelectOpportunity);
    if (!steps) {
      onClose();
      return;
    }

    const obj = driver({
      showProgress: false,
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Finish",
      smoothScroll: true,
      animate: true,
      overlayOpacity: 0.5,
      steps,
      onDestroyed: () => {
        onSelectNode(null);
        onSelectOpportunity(null);
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
