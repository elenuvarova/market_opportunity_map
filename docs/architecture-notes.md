# Architecture notes

Phase 0 audit of Market Opportunity Map, before a 5-phase set of portfolio-grade upgrades (score explainability → opportunity brief → guided tour → paste-your-own → optional LLM extraction). Read-only map of the current code, not a refactor.

## Scoring function

**Location**: [backend/analysis.py:68-78](../backend/analysis.py#L68-L78), `calculate_opportunity_scores(df)`.

**Inputs**: a pandas DataFrame containing the four numeric columns from the CSV schema: `severity` (1–10), `willingness_to_pay` (1–10), `competition_intensity` (1–10), `evidence_count` (≥0).

**Returns**: the same DataFrame with an added `opportunity_score` column, integer 0–100.

**Formula**:

```python
raw = (
    severity * 0.35
    + willingness_to_pay * 0.25
    + (10 - competition_intensity) * 0.25
    + min(evidence_count / 10, 1) * 10 * 0.15
)
score = round(raw * 10).clip(0, 100)
```

**Called from**: [backend/analysis.py:243](../backend/analysis.py#L243) inside `analyze_market_data(df)` — the single pipeline that powers both `/demo` and `/analyze`.

**Decision buckets** (frontend, [frontend/src/components/OpportunitiesTable.jsx:1-6](../frontend/src/components/OpportunitiesTable.jsx#L1-L6)):

| score | label |
|---|---|
| ≥ 75 | Strong opportunity |
| 60–74 | Worth validating |
| 40–59 | Needs more research |
| < 40 | Low priority |

Currently nothing in the demo data hits ≥75 — the highest is 65 ("Strategy cascade tool" in the product dataset, 64 for "Skills-to-business-outcome analytics" in EdTech). That's a real consequence of honest scoring on public signals; if a "Strong" badge is desired for the demo, either lower the threshold or hand-bump one row.

## Source links — current shape (⚠️ Phase 1 blocker)

**Where they live**: as **Python `#` comments above each row** in [backend/demo_data.py](../backend/demo_data.py). Example:

```python
# Product managers · Aha (Roadmaps)
# sources:
#   https://news.ycombinator.com/item?id=25899773  (HN: "Escaping the Roadmap Trap")
#   https://news.ycombinator.com/item?id=22827275  (Ask HN on roadmap management)
#   https://www.lennysnewsletter.com/p/mission-vision-strategy-goals-roadmap
#   https://www.aha.io/roadmaps/pricing
# notes: pain refined to "items don't trace to strategy"; Aha actively markets the fix.
{
    "segment": "Product managers",
    "pain_point": "Roadmap items don't trace back to strategic goals",
    ...
}
```

77 source URLs across 24 rows. **None of them are queryable** — they are not parsed, not exposed via the API, and not reachable from the frontend.

### Implication for Phase 1

Phase 1 ("Score explainability with source drill-down") assumes a data shape like:

```json
"supporting_signals": [
  { "source_type": "HN thread", "source_url": "…", "quote": "…", "signal_strength": … }
]
```

Three gaps between current state and that target:

1. **Sources must move out of comments into structured data** — a list of dicts per row, ideally a separate `sources` field on each row.
2. **`source_type` does not exist** — must be derived (regex on hostname: `news.ycombinator.com` → "HN thread", `lennysnewsletter.com` → "Lenny's newsletter", `*.medium.com` → "Industry article", `*/pricing*` → "Competitor pricing", etc.) or added explicitly.
3. **Quotes do not exist** — research agents captured one-line context notes in the comments, not literal quotes. To get real quotes per signal, Phase 1 must either: (a) re-fetch each URL and pull a quote programmatically (slow, brittle), (b) extract the existing comment notes as the "quote" (fast, but they're paraphrases not literal quotes — needs to be labeled as such), or (c) hand-write quotes for the top 8–10 opportunities (smallest scope, most curated).

Additionally, Phase 1 wants signals **grouped by score component** (`severity`, `willingness_to_pay`, `competition_intensity`, `evidence_strength`). The current source comments don't tag which signal supports which component — that grouping is judgment-heavy and would need to be added by hand or skipped (just show all signals for the row, ungrouped).

**Recommendation**: in the first chunk of Phase 1, decouple the data restructuring from the UI. Step 1 — turn each row's sources into structured dicts (`source_url`, `source_type` derived, `note` from existing comment). Step 2 — wire endpoint and drawer. Skip per-component grouping in v1; show signals as a flat list under the score. Add grouping later if it earns its keep.

## FastAPI endpoints

All defined in [backend/main.py](../backend/main.py):

| method | path | purpose |
|---|---|---|
| `GET` | `/health` | liveness probe — `{ "status": "ok" }` |
| `GET` | `/datasets` | list available demo dataset keys with labels and descriptions |
| `GET` | `/demo?dataset=<key>` | analyzed built-in demo data; `dataset` defaults to `product`, also accepts `edtech`; 404 on unknown key |
| `POST` | `/analyze` | multipart upload of a CSV file; returns the same shape as `/demo`; 400 if not a `.csv` or unparseable, 422 if required columns are missing |

CORS allowlist is built from `localhost:5173` + optional `FRONTEND_ORIGIN` env var (comma-separated). Production has `FRONTEND_ORIGIN=https://market-opportunity-map-web.onrender.com`.

All four endpoints return JSON. No streaming, no auth, no rate limiting.

## Frontend components

Entry: [frontend/src/main.jsx](../frontend/src/main.jsx) → [frontend/src/App.jsx](../frontend/src/App.jsx).

`App.jsx` owns all UI state (data, loading, error, selectedNode, sourceLabel, activeDemoKey) and composes the components below. State is local React state — no Redux, no Zustand, no router.

| component | role | notes for upgrades |
|---|---|---|
| [SummaryCards](../frontend/src/components/SummaryCards.jsx) | 6 stat cards across the top | small, safe to extend |
| [NetworkMap](../frontend/src/components/NetworkMap.jsx) | force-directed graph, type filter chips, search input | wraps `react-force-graph-2d`. Hover and selection styling uses canvas overlay. Phase 3 (tour) will need stable DOM anchors for joyride to highlight, OR will need to highlight nodes by emitting events into the graph instead of CSS selectors |
| [NodeDetailsPanel](../frontend/src/components/NodeDetailsPanel.jsx) | right-side details when a node is clicked | handles both string-id edges (from API) and node-ref edges (after force-graph mutation) — keep this in mind when Phase 1 drawer shares similar logic |
| [OpportunityMatrix](../frontend/src/components/OpportunityMatrix.jsx) | severity × competition scatter, color by score | Recharts. Phase 1 should make scatter dots clickable to open the score drawer |
| [CompetitorFeatureHeatmap](../frontend/src/components/CompetitorFeatureHeatmap.jsx) | CSS-grid heatmap with vertical column labels | self-contained |
| [OpportunitiesTable](../frontend/src/components/OpportunitiesTable.jsx) | ranked table with decision-bucket chips | this is where Phase 1's "clickable score" lives. Score cell already isolated as `<ScoreBar />` — adding `onClick` is a 5-line change |
| [EmptyState](../frontend/src/components/EmptyState.jsx) | landing card with demo buttons, CSV format card | |
| [CsvFormatCard](../frontend/src/components/CsvFormatCard.jsx) | 10-column schema explainer | |
| [DemoMenu](../frontend/src/components/DemoMenu.jsx) | dropdown in the header to pick a demo dataset | Phase 3 (tour) button likely goes next to this |
| [FileUpload](../frontend/src/components/FileUpload.jsx) | hidden `<input type="file">` triggered by header button | |
| [ErrorMessage](../frontend/src/components/ErrorMessage.jsx) | dismissible red banner | |

API client: [frontend/src/lib/api.js](../frontend/src/lib/api.js) — three functions (`healthCheck`, `loadDemoData(key)`, `analyzeCsv(file)`) over a single `request()` helper. The helper detects HTML-instead-of-JSON responses (common Render misconfiguration) and surfaces a clear error.

Hardcoded dataset metadata also lives in `api.js` (`DEMO_DATASETS` array) — this duplicates what `GET /datasets` returns. Acceptable for now (lets the EmptyState render without a network round-trip), but if Phase 4 adds user-pasted "datasets" the duplication should go.

## Files > 300 lines

Only one: [backend/demo_data.py](../backend/demo_data.py) at **512 lines**. ~85% of that is the two dataset literals plus the source comments; the only logic is `get_dataset(key)` at the bottom. Not a refactor target — but it's also the file Phase 1 will rework most.

Every other source file is under 270 lines. No frontend component exceeds 170 lines.

## What's NOT in the repo (worth knowing before adding things)

- **No router**. Adding Phase 2's `/opportunity/:id/brief` route means installing `react-router-dom` (or wagering with `wouter` for a smaller bundle, ~1KB vs ~10KB).
- **No state management library**. App state is local in `App.jsx`. The Score Breakdown drawer (Phase 1) and Brief route (Phase 2) will both need access to "the currently selected opportunity" — either thread it through props or pick a tiny library (zustand is ~1KB).
- **No tour library**. Phase 3 will add `react-joyride` (~30KB) or `driver.js` (~10KB). `driver.js` is closer to the spec's "smaller bundle" preference but its highlight uses CSS overlays that may interfere with the canvas-based force graph — needs a 30-min spike before committing.
- **No persistence**. No localStorage usage today. Phase 4's session storage for pasted data will be the first.
- **No tests, no linter, no CI**. Original spec excluded them and they haven't crept back. If Phase 1+ grows the codebase meaningfully, a couple of pytest cases for the scoring formula and Vitest cases for the api.js error paths would be cheap to add.

## Quick-check commands

```bash
# Backend round-trip locally
cd backend && source venv/bin/activate && uvicorn main:app --reload
curl -s http://127.0.0.1:8000/demo?dataset=product | python3 -m json.tool | head

# Frontend
cd frontend && npm install && npm run dev
# open http://localhost:5173

# Production smoke
curl -s https://market-opportunity-map-api.onrender.com/health
curl -s 'https://market-opportunity-map-api.onrender.com/demo?dataset=edtech' | python3 -c "import sys,json; print(json.load(sys.stdin)['summary'])"
```

## Phase readiness summary

| phase | ready? | blocker |
|---|---|---|
| 1 — score explainability | partially | source-data restructuring is required first (see ⚠️ above); no router/state lib yet |
| 2 — opportunity brief | yes | needs router (add when starting Phase 2) |
| 3 — guided tour | yes | needs tour library; spike to confirm CSS overlay coexists with canvas force graph |
| 4 — paste-your-own | yes | needs to share rendering path with demo datasets — App.jsx already supports arbitrary `data` shape, so reuse should work |
| 5 — LLM extraction | yes (skip if 0–4 not clean) | needs `ANTHROPIC_API_KEY` env handling + 503 fallback per plan |
