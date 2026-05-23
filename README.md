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
- `GET /datasets` — list of available demo datasets: `[{ "key", "label", "description" }, ...]`
- `GET /demo?dataset=<key>` — analyzed built-in demo data. `dataset` is optional and defaults to `product`; current keys are `product` and `edtech`. Source URLs for each row are in [`backend/demo_data.py`](backend/demo_data.py).
- `POST /analyze` — multipart `file=<csv>`; returns the same shape as `/demo`

Errors:
- `400` — file isn't a CSV or can't be parsed
- `404` — unknown `dataset` key on `/demo`
- `422` — CSV missing required columns or empty after cleaning

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
- The frontend bundles `react-force-graph-2d` and D3 (~215KB gzipped) — fine for free tier, but visible on cold loads.
- Render's free Postgres instances expire after 30 days. This app doesn't use a database, so that doesn't apply here — just noting it for future extensions.
