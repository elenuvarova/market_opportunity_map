# syntax=docker/dockerfile:1

# --- Stage 1: build the Vite frontend ---------------------------------------
FROM node:20-slim AS frontend
WORKDIR /frontend

# Install deps from the lockfile first for better layer caching.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build the SPA. VITE_API_URL is intentionally left UNSET so the bundle uses
# the same-origin "/api" base (see frontend/src/lib/api.js) — the Python app
# serves the API under /api on this same port, so no cross-origin URL is needed.
COPY frontend/ ./
RUN npm run build


# --- Stage 2: runtime — uvicorn serves /api AND the built SPA on one port ----
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    STATIC_DIR=/app/static

WORKDIR /app

# Python deps first (cached unless requirements.txt changes).
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Backend source. .dockerignore keeps tests/venv/__pycache__/.env out of the image.
COPY backend/ ./

# Built SPA from stage 1 -> /app/static. main.py StaticFiles-mounts this and
# SPA-falls-back to index.html for non-/api routes only when this dir exists.
COPY --from=frontend /frontend/dist ./static

# Run as a non-root user.
RUN useradd --system --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# python3 probe (no curl/wget in python:3.12-slim) against nginx-less uvicorn on
# the public port. /health is registered at root by main.py.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python3 -c "import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).getcode()==200 else sys.exit(1)"

# --forwarded-allow-ips '*' so the app trusts Traefik's X-Forwarded-* headers
# (matters for the per-IP rate-limit key in main.py).
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --forwarded-allow-ips '*'"]
