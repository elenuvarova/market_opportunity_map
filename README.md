# Full-stack template

A minimal full-stack starter — React + Vite frontend, Express + Sequelize backend, SQLite locally and PostgreSQL on Render — designed to be downloaded, customized, and deployed for free on Render.

## Stack

- **Frontend:** React 18 + Vite 5 (plain JavaScript, no TypeScript)
- **Backend:** Node.js 20 + Express, ES modules
- **ORM:** Sequelize
- **Database:** SQLite locally (built into the backend, no install needed) and managed PostgreSQL on Render — picked automatically from `DATABASE_URL`
- **Deploy:** Render free tier (web service + Postgres) via `render.yaml` Blueprint
- **Docker:** used only by Render to build the production image

## Project structure

```
.
├── backend/
│   ├── package.json
│   ├── server.js
│   └── db.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── styles.css
├── Dockerfile
├── render.yaml
├── .env.example
├── .gitignore
├── .dockerignore
└── README.md
```

## Local development

No database to install — SQLite is built in and the backend creates `backend/data.sqlite` on first boot.

In one terminal, start the backend:

```bash
cd backend
npm install
npm run dev
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Then open <http://localhost:5173>. Vite proxies `/api/*` to the backend on port 3001.

## Deploy to Render

1. Push this repo to GitHub.
2. In Render, click **New → Blueprint** and connect the repo.
3. Render reads `render.yaml`, provisions a free Postgres database and a free Docker web service, and wires `DATABASE_URL` between them automatically.

Notes about the free tier:
- The free web service sleeps after inactivity, so the first request after idle takes ~30 seconds (cold start).
- Render's free Postgres instances expire after 30 days. You'll need to create a fresh database before then.

## Endpoints

- `GET /api/hello` — returns `{ "message": "Hello from the backend 👋" }`
- `GET /api/health` — returns `{ "status": "ok", "db": "sqlite" | "postgres" }` after pinging the database
- `GET /*` (production only) — serves the built frontend from `backend/public/`
