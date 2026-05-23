import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// Tour is scripted to the "product" demo dataset. We trace the top opportunity
// (Strategy cascade tool) end-to-end: segment → pain → competitor → opportunity
// → score breakdown → brief. All numbers are pulled from the data prop so the
// copy can't go stale if scores shift.

function findNode(nodes, predicate) {
  return nodes.find(predicate) || null;
}

function findOpportunity(opportunities, id) {
  return opportunities.find((o) => o.id === id) || null;
}

export default function TourController({
  data,
  onSelectNode,
  onSelectOpportunity,
  onClose,
}) {
  const driverRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const seg = findNode(data.nodes, (n) => n.id === "segment:Heads of Product");
    const pain = findNode(
      data.nodes,
      (n) => n.id === "pain_point:Strategy doesn't make it down to squads"
    );
    const competitor = findNode(data.nodes, (n) => n.id === "competitor:Productboard");
    const opp = findNode(
      data.nodes,
      (n) => n.id === "opportunity:Strategy cascade tool"
    );
    const oppRow = findOpportunity(data.opportunities, "strategy-cascade-tool");

    if (!seg || !pain || !competitor || !opp || !oppRow) {
      // Tour assumes the product dataset; if we can't find these nodes the
      // dataset has been changed in incompatible ways. Don't run.
      onClose();
      return;
    }

    const oppPain = data.opportunities.find(
      (o) => o.pain_point === "Strategy doesn't make it down to squads"
    );

    const steps = [
      {
        element: '[data-tour-id="network-map"]',
        onHighlightStarted: () => {
          onSelectOpportunity(null);
          onSelectNode(seg);
        },
        popover: {
          title: "1 / 7 — Customer segments",
          description:
            "Each <b>blue node</b> is a customer group. Around <b>Heads of Product</b> sit their pain points (red), competitors covering this space (purple), features (green), and possible opportunities (yellow).",
          side: "left",
        },
      },
      {
        element: '[data-tour-id="network-map"]',
        onHighlightStarted: () => onSelectNode(pain),
        popover: {
          title: "2 / 7 — A high-severity pain",
          description: `<b>"Strategy doesn't make it down to squads"</b> — severity ${oppPain.severity}/10, willingness to pay ${oppPain.willingness_to_pay}/10. Captured from Lenny's newsletter (Headspace case) and the Department of Product blog.`,
          side: "left",
        },
      },
      {
        element: '[data-tour-id="network-map"]',
        onHighlightStarted: () => onSelectNode(competitor),
        popover: {
          title: "3 / 7 — Crowded competitor area",
          description:
            "<b>Productboard</b> sits next to this pain — it covers Prioritization and Strategy planning at Enterprise tier. But for Heads of Product, none of the established tools fully close the squad-level cascade gap.",
          side: "left",
        },
      },
      {
        element: '[data-tour-id="network-map"]',
        onHighlightStarted: () => onSelectNode(opp),
        popover: {
          title: "4 / 7 — The opportunity",
          description: `This gap becomes <b>"Strategy cascade tool"</b>, scored <b>${oppRow.opportunity_score}/100</b> — the top opportunity in this dataset. Click any opportunity to see why.`,
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
            "Click <b>Brief →</b> to open a print-friendly one-pager — the artifact a PM takes to a strategy meeting. It includes score breakdown, top signals, competitive landscape, open questions, and a recommended next step.",
          side: "left",
        },
      },
      {
        element: "body",
        popover: {
          title: "7 / 7 — That's the loop",
          description:
            "Signals → score → decision → next step. <br/><br/>Try the <b>EdTech</b> dataset for a different domain, or upload your own CSV to see the same dashboard against your research.",
          side: "over",
          align: "center",
        },
      },
    ];

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
    // We intentionally only re-run if the dataset shape changes (a new demo
    // gets loaded mid-tour); state setters are stable from App.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return null;
}
