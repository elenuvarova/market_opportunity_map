// Tour scripts live here (NOT in TourController.jsx) so the cheap
// `isTourAvailable` check can be imported synchronously by App without dragging
// driver.js (the heavy tour engine) into the initial bundle. TourController is
// lazy-loaded and imports TOUR_SCRIPTS from this module when the tour actually
// runs.

// One scripted tour per demo dataset. Each script names the four canonical
// nodes (segment / pain / competitor / opportunity) and provides the
// dataset-specific narrative for steps 2 and 3. Numbers (severity, WTP,
// score) are pulled from the live data so the copy can't drift.

export const TOUR_SCRIPTS = {
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
