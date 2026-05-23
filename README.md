# Market Opportunity Map

A product-strategy visualization tool that turns market research into an interactive map of customer segments, pain points, competitors, features, pricing tiers, and ranked product opportunities — with every score traceable back to the public signal that produced it.

**Live demo:** <https://market-opportunity-map-web.onrender.com>
**Guided tour (shareable URL):** <https://market-opportunity-map-web.onrender.com/?tour=1>

It helps product leaders answer one question they actually live with: *"Where is the market opportunity worth validating or investing in?"* — by surfacing underserved segments, crowded competitor clusters, and the gaps in between.

Two built-in demo datasets (product tools, EdTech) are grounded in public signals — HackerNews threads, Lenny's newsletter, NN/g, McKinsey reskilling reports, vendor pricing pages — with source URLs structured in the code, so every score can be traced to the signals that produced it. You can also upload a CSV or paste rough notes and get the same dashboard against your own research.

## What you can do

- **Explore the graph.** Hover or click nodes — segments (blue), pains (red), competitors (purple), features (green), pricing tiers (orange), and opportunities (yellow) — to see how they connect.
- **Read every score.** Click any opportunity row to see the 4 component bars that produced its 0–100 score, with the actual Reddit/HN/Lenny's links cited inline.
- **Generate a one-pager.** "Brief →" on any opportunity opens a print-friendly page with score breakdown, competitive landscape (what each competitor doesn't cover), open questions, and a recommended next step. Copy as Markdown or print to PDF.
- **Take the 90-second tour.** "Take a tour" walks first-time visitors through one real opportunity end-to-end.
- **Try your own data.** Upload a CSV with the full schema, or paste rough text — competitors, pains, interview quotes — and get a heuristic graph in 10 seconds.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, `react-force-graph-2d`, Recharts, `react-router-dom`, `driver.js`
- **Backend:** Python 3.11, FastAPI, pandas, networkx
- **Deploy:** Render free tier — backend as a Python web service, frontend as a static site

## Project structure

```
.
├── backend/
│   ├── main.py            # FastAPI app: /health, /datasets, /demo,
│   │                      #              /opportunities/:id/breakdown,
│   │                      #              /opportunities/:id/brief,
│   │                      #              /analyze, /assemble
│   ├── analysis.py        # scoring, graph build, breakdown + brief composition
│   ├── demo_data.py       # researched product / edtech datasets with sources
│   ├── sources.py         # url → source_type label, slugify
│   ├── parse.py           # heuristic paste-text → rows assembler
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx, main.jsx, index.css
│   │   ├── components/
│   │   │   ├── EmptyState.jsx, CsvFormatCard.jsx
│   │   │   ├── DemoMenu.jsx, FileUpload.jsx, ErrorMessage.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   ├── NetworkMap.jsx, NodeDetailsPanel.jsx
│   │   │   ├── OpportunityMatrix.jsx, CompetitorFeatureHeatmap.jsx
│   │   │   ├── OpportunitiesTable.jsx
│   │   │   ├── ScoreBreakdownDrawer.jsx     # Phase 1
│   │   │   ├── OpportunityBrief.jsx         # Phase 2
│   │   │   ├── TourController.jsx           # Phase 3
│   │   │   └── PasteModal.jsx               # Phase 4
│   │   └── lib/
│   │       ├── api.js, nodeStyles.js
│   │       ├── scoring.js, brief.js         # local fallback for CSV/paste briefs
│   │       ├── markdown.js                  # brief → markdown
│   │       └── sessionStore.js              # in-tab persistence for paste/CSV
│   ├── public/sample_market_data.csv
│   ├── index.html, package.json, vite.config.js
│   ├── tailwind.config.js, postcss.config.js
│   └── .env.example
├── docs/
│   └── architecture-notes.md  # Phase 0 audit / code map
├── sample_market_data.csv
├── render.yaml
└── README.md
```

## Demo datasets

Both demo sets are grounded in public signals — every source URL is structured per row in [`backend/demo_data.py`](backend/demo_data.py) (and clickable through the UI).

- **Product tools** — Freelance designers, startup founders, product managers, UX researchers, indie hackers, design leads, Heads of Product. Sources: HN threads (Roadmap Trap, Ask HN: roadmaps), Lenny's newsletter (Strategy Blocks, strategy-to-roadmap), NN/g UX debt, Looppanel and didoo on UX research, vendor pricing pages (Aha, Productboard, Figma, Dovetail).
- **EdTech & self-learning** — Career switchers, bootcamp grads, working professionals, self-taught learners, aspiring PMs, L&D managers. Sources: HN (graduated-but-no-jobs, hiring-manager-led screening), CareerKarma 2024 bootcamp report, McKinsey AI upskilling, GPStrategies "Measuring Business Impact of Learning 2025", LinkedIn Workforce data, vendor pricing (Coursera, Codecademy, Maven, DeepLearning.AI, Reforge, LinkedIn Learning, Pluralsight).

Score recalibration after the research pass meant nothing in the demo hits ≥75 ("Strong opportunity"). That's intentional: no real public signal alone justifies a slam-dunk verdict. The top score is 65 (Strategy cascade tool, product) and 64 (Skills-to-business-outcome analytics, EdTech) — both "Worth validating."

## CSV format

One row per `(segment, pain_point, competitor, feature, pricing_tier, opportunity)` combination. Required columns:

| column | meaning |
| --- | --- |
| `segment` | customer group |
| `pain_point` | customer problem |
| `competitor` | existing solution or competitor |
| `feature` | competitor feature |
| `pricing_tier` | `Free` / `Freemium` / `Paid` / `Subscription` / `Enterprise` |
| `opportunity` | possible product opportunity |
| `severity` | pain severity, 1–10 |
| `willingness_to_pay` | 1–10 |
| `competition_intensity` | 1–10 |
| `evidence_count` | number of research signals / mentions / interviews |

See [`sample_market_data.csv`](sample_market_data.csv) for an example. The UI also shows the schema inline on the empty state.

## Why scores are explainable

Every opportunity gets a 0–100 score from a transparent rule-based formula:

```
score = (
    severity × 0.35
  + willingness_to_pay × 0.25
  + (10 − competition_intensity) × 0.25
  + min(evidence_count / 10, 1) × 10 × 0.15
) × 10
```

Decisions are bucketed: `≥75` strong, `≥60` worth validating, `≥40` needs more research, `<40` low priority.

Two things make this defensible on a portfolio:

1. **No black-box AI in scoring.** The formula is a few lines of pandas in [`backend/analysis.py`](backend/analysis.py). It can be argued, audited, and changed. (LLMs were only used during research to surface candidate signals — they don't run at request time.)
2. **Every score is traceable.** Click any opportunity in the dashboard → the **Score Breakdown drawer** opens with 4 component bars showing each input's exact contribution to the score, then lists the Reddit/HN/Lenny's/vendor-pricing URLs that fed the calibration. For the demo data those URLs are real; for CSV uploads they're whatever you put in your `sources` column.

The same breakdown is exposed as a JSON endpoint — `GET /opportunities/:id/breakdown?dataset=<key>` — so you can pull it from outside the UI too.

## Generate an opportunity brief

Click **Brief →** on any opportunity (or the button at the bottom of the score-breakdown drawer) to open a standalone print-friendly one-pager at `/opportunity/:id/brief?dataset=<key>`.

The page lays out:

- Title, segment, one-liner
- Score block (the same 4 component bars)
- Top 3 supporting signals with URLs
- **Competitive landscape** — top 3 competitors active in this segment, with each competitor's features in the space and which pain points they don't address
- 3 open questions / risks (market sizing, retention, WTP)
- A bucket-driven recommended next step (e.g. "Run 5 customer interviews focused on the specific pain", "Collect 10+ additional signals from sources like X, Y, Z")

Two buttons on top: **Copy as Markdown** (clean paste-ready block for Notion / Linear / Slack) and **Print** (a CSS `@media print` rule hides the chrome and inlines URLs next to hyperlinks).

Example markdown excerpt for "Strategy cascade tool" (top opportunity in the product dataset):

```markdown
# Strategy cascade tool

> Heads of Product struggling with: Strategy doesn't make it down to squads.

**Score:** 65/100 · **Decision:** Worth validating

## Score breakdown

| Component          | Raw  | Contribution |
|--------------------|------|--------------|
| Severity           | 8/10 | +28          |
| Willingness to pay | 9/10 | +22.5        |
| Low competition    | 6/10 | +10          |
| Evidence strength  | 3    | +4.5         |

## Top supporting signals (3 total)

- **Lenny's newsletter** — Headspace case: teams confused about *why* despite having
  roadmap and OKRs.
  https://www.lennysnewsletter.com/p/strategy-blocks-an-operators-guide
- **Industry article** — Strategy filed to Google Drive until next quarter.
  https://www.departmentofproduct.com/blog/5-ways-to-keep-teams-aligned-as-a-product-manager/
- **Vendor (Productboard)** — Strategic planning gated to Enterprise; Pro $59/maker.
  https://www.productboard.com/pricing/productboard/

## Recommended next step

> Run 5 customer interviews focused on: "Strategy doesn't make it down to squads".
```

## Take the guided tour

A 90-second walkthrough through one real opportunity end-to-end — segment → pain → competitor → opportunity → score breakdown → brief. Click **Take a tour** in the header when the Product demo is loaded, or open the shareable URL directly:

<https://market-opportunity-map-web.onrender.com/?tour=1>

The tour is scripted to the product dataset and pulls all its numbers (severity 8, score 65, etc.) from the loaded data so the copy stays in sync if scores ever shift. Implementation is [`driver.js`](https://driverjs.com) (~13KB gz) for DOM highlighting plus the existing canvas-drawn node ring for graph nodes — driver.js never needs to reach inside the canvas.

## Try it with your data

Two paths, depending on how clean your data already is:

### Upload a CSV (high fidelity)

Click **Upload CSV** in the header. The file needs the 10 columns documented above. The backend validates and returns 422 with the missing column list if something's off.

### Paste rough text (low fidelity, fast)

Click **Paste** in the header. A modal with three tabs opens:

- **Competitors** — one per line, optional `Name | what they do | rough price tier`
- **Pains** — one per line, optional `Segment :: pain :: severity 1–10`
- **Interview quotes** — paste blocks separated by blank lines; keywords like *frustrated*, *hate*, *painful*, *broken*, *slow* heuristically bump severity

Submit → backend assembles a minimal dataset and the dashboard renders against it. A yellow banner over the graph makes the lower fidelity explicit; the **Brief →** flow works on pasted opportunities too (with the pasted text as the supporting signal).

Pasted data lives in your browser tab's `sessionStorage` only. No server-side persistence, no database. Reload preserves; close = lose.

## Local development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on <http://127.0.0.1:8000>.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on <http://localhost:5173>. The Vite dev server proxies `/api/*` to the backend, so you don't need to set `VITE_API_URL` locally.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `GET` | `/datasets` | List the built-in demo keys + labels |
| `GET` | `/demo?dataset=<key>` | Full analyzed dataset (defaults to `product`) |
| `GET` | `/opportunities/:id/breakdown?dataset=<key>` | Score components + supporting signals for one opportunity |
| `GET` | `/opportunities/:id/brief?dataset=<key>` | Full brief payload (adds competitive landscape, open questions, next step) |
| `POST` | `/analyze` | Multipart CSV upload; same response shape as `/demo` |
| `POST` | `/assemble` | JSON body `{competitors_text, pains_text, quotes_text}`; same response shape as `/demo` |

Errors:
- `400` — uploaded file isn't a CSV or can't be parsed
- `404` — unknown `dataset` key or unknown opportunity id
- `422` — required CSV columns missing, or paste input couldn't yield any signals

## Architecture notes

See [`docs/architecture-notes.md`](docs/architecture-notes.md) for the Phase 0 audit (scoring function location, sources data shape, endpoint inventory, component roles, what's *not* in the repo). It's the read-only code map written before the upgrade work and still useful as an orientation doc.

## Deploy to Render

This repo includes a [`render.yaml`](render.yaml) Blueprint. In Render: **New → Blueprint → Connect repo**. It provisions two free services:

- **`market-opportunity-map-api`** — Python web service. Root dir `backend/`, builds with `pip install -r requirements.txt`, starts with `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **`market-opportunity-map-web`** — Static site. Root dir `frontend/`, builds with `npm install && npm run build`, publishes `dist/`.

### Wiring frontend ↔ backend

Both env vars are baked into [`render.yaml`](render.yaml) with the default `*.onrender.com` hostnames for these two services, so Blueprint sync wires them up automatically:

- `VITE_API_URL` on the static site → the API service URL (Vite bakes this into the bundle at build time, so the static site rebuilds on change).
- `FRONTEND_ORIGIN` on the API service → the static site URL (added to the API's CORS allowlist).

If you forked the repo and your services got different hostnames, edit the two `value:` lines in `render.yaml` to match and push — Render re-syncs the Blueprint and redeploys both services.

If you ever see `Got HTML instead of JSON` in the UI, that means the static site bundle doesn't have `VITE_API_URL` baked in — trigger **Manual Deploy → Clear build cache & deploy** on the static site.

Notes:
- Free Render services sleep after inactivity, so the first request after idle takes ~30s.
- The frontend bundles `react-force-graph-2d`, D3, Recharts, react-router-dom and driver.js (~240 KB gzipped) — fine for free tier, but visible on cold loads.
- Render's free Postgres instances expire after 30 days. This app doesn't use a database, so that doesn't apply here — just noting it for future extensions.

## Screenshots

> Placeholders — drop PNGs into `docs/screenshots/` and uncomment the references when you have them. Suggested captures:
>
> - `01-dashboard.png` — full dashboard with the network map, summary cards, ranked opportunities
> - `02-score-breakdown.png` — the drawer open on "Strategy cascade tool"
> - `03-brief.png` — `/opportunity/strategy-cascade-tool/brief?dataset=product`
> - `04-tour.png` — driver.js popover mid-tour on a graph node
> - `05-paste.png` — the Paste modal with example text and the resulting graph behind it

<!--
![Dashboard](docs/screenshots/01-dashboard.png)
![Score breakdown drawer](docs/screenshots/02-score-breakdown.png)
![Brief page](docs/screenshots/03-brief.png)
![Guided tour](docs/screenshots/04-tour.png)
![Paste your own](docs/screenshots/05-paste.png)
-->
