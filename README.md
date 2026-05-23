# Market Opportunity Map

A product strategy visualization tool that turns market research CSVs into an interactive map of customer segments, pain points, competitors, features, pricing tiers, and ranked product opportunities.

It helps answer questions like:

- Which customer segments are underserved?
- Which pain points are severe but poorly covered by competitors?
- Where do competitors cluster around the same features?
- Which opportunities have high pain, high willingness to pay, and low competition?

No accounts, no databases, no AI calls — you upload a CSV (or click "Try demo data") and get a polished dashboard.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, `react-force-graph-2d`, Recharts
- **Backend:** Python 3.11, FastAPI, pandas, networkx
- **Deploy:** Render free tier — backend as a Python web service, frontend as a static site

## Project structure

```
.
├── backend/
│   ├── main.py            # FastAPI app: /health, /demo, /analyze
│   ├── analysis.py        # validation, cleaning, scoring, graph build
│   ├── demo_data.py       # built-in demo rows
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   ├── NetworkMap.jsx
│   │   │   ├── NodeDetailsPanel.jsx
│   │   │   ├── OpportunityMatrix.jsx
│   │   │   ├── CompetitorFeatureHeatmap.jsx
│   │   │   ├── OpportunitiesTable.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── ErrorMessage.jsx
│   │   └── lib/
│   │       ├── api.js
│   │       └── nodeStyles.js
│   ├── public/sample_market_data.csv
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── sample_market_data.csv
├── render.yaml
└── README.md
```

## CSV format

One row per `(segment, pain_point, competitor, feature, pricing_tier, opportunity)` combination. Required columns:

| column | meaning |
| --- | --- |
| `segment` | customer group |
| `pain_point` | customer problem |
| `competitor` | existing solution or competitor |
| `feature` | competitor feature |
| `pricing_tier` | `Free` / `Freemium` / `Paid` / `Enterprise` |
| `opportunity` | possible product opportunity |
| `severity` | pain severity, 1–10 |
| `willingness_to_pay` | 1–10 |
| `competition_intensity` | 1–10 |
| `evidence_count` | number of research signals / mentions / interviews |

See [`sample_market_data.csv`](sample_market_data.csv) for an example.

### Opportunity score

```
score = severity * 0.35
      + willingness_to_pay * 0.25
      + (10 - competition_intensity) * 0.25
      + min(evidence_count / 10, 1) * 10 * 0.15
```

Scaled to 0–100. Decisions are bucketed: `≥75` strong, `≥60` worth validating, `≥40` needs research, `<40` low priority.

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

- `GET /health` — `{ "status": "ok" }`
- `GET /demo` — analyzed built-in demo data
- `POST /analyze` — multipart `file=<csv>`; returns the same shape as `/demo`

Errors:
- `400` — file isn't a CSV or can't be parsed
- `422` — CSV missing required columns or empty after cleaning

## Deploy to Render

This repo includes a [`render.yaml`](render.yaml) Blueprint. In Render: **New → Blueprint → Connect repo**. It provisions two free services:

- **`market-opportunity-map-api`** — Python web service. Root dir `backend/`, builds with `pip install -r requirements.txt`, starts with `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **`market-opportunity-map-web`** — Static site. Root dir `frontend/`, builds with `npm install && npm run build`, publishes `dist/`.

### After the first deploy — required wiring

The two services don't know about each other until you set two env vars. **Without this step, the frontend will load but show `Got HTML instead of JSON` when you click a demo** (it's calling its own static site instead of the API).

1. In Render → **`market-opportunity-map-api`** → **Environment** → set:
   ```
   FRONTEND_ORIGIN=https://market-opportunity-map-web.onrender.com
   ```
   (or your actual static site URL). This adds it to the API's CORS allowlist.

2. In Render → **`market-opportunity-map-web`** → **Environment** → set:
   ```
   VITE_API_URL=https://market-opportunity-map-api.onrender.com
   ```
   (or your actual API URL).

3. **Manual Deploy → Clear build cache & deploy** on the static site. Vite bakes `VITE_API_URL` into the bundle at build time, so a fresh build is required.

Notes:
- Free Render services sleep after inactivity, so the first request after idle takes ~30s.
- The frontend bundles `react-force-graph-2d` and D3 (~215KB gzipped) — fine for free tier, but visible on cold loads.
- Render's free Postgres instances expire after 30 days. This app doesn't use a database, so that doesn't apply here — just noting it for future extensions.
