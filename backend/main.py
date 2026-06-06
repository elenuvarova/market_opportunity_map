import io
import logging
import os
from pathlib import Path
from typing import Iterable

import pandas as pd
from fastapi import APIRouter, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from analysis import (
    ValidationError,
    analyze_market_data,
    build_breakdown,
    build_brief,
    clean_dataframe,
    calculate_opportunity_scores,
    find_opportunity_row,
    validate_dataframe,
)
from demo_data import DEMO_DATASETS, get_dataset
from parse import AssembleError, assemble, parse_competitors


MAX_CSV_BYTES = 2 * 1024 * 1024  # 2 MB
# Cap the parsed row count too: the byte limit alone doesn't bound work, since
# the analysis pipeline (graph build, centrality) is super-linear in rows and a
# small file can still hold many short rows. Reject oversized CSVs with a 422.
MAX_CSV_ROWS = 5000
MAX_PASTE_BLOB = 100 * 1024  # 100 KB per text blob
# Combined ceiling for the /assemble JSON body: three capped blobs plus a
# margin for the JSON envelope and field names.
MAX_ASSEMBLE_BYTES = MAX_PASTE_BLOB * 3 + 16 * 1024

logger = logging.getLogger("mom")


class AssembleRequest(BaseModel):
    competitors_text: str = ""
    pains_text: str = ""
    quotes_text: str = ""

app = FastAPI(title="Market Opportunity Map API", version="0.2.0")

# All API endpoints live on a router so it can be mounted twice: at the root
# (preserves the original Render two-service behaviour and exposes /health for
# the Docker HEALTHCHECK) and under /api (what the single-origin frontend calls
# in production, since there is no Vite dev proxy to strip the prefix there).
router = APIRouter()

def client_ip_key(request: Request) -> str:
    """Rate-limit key that survives the reverse proxy. Without this every request
    arrives with the proxy's IP and the per-IP limit collapses into one shared
    global bucket — one busy client would 429 everyone.

    Deployment has exactly ONE trusted reverse proxy (Traefik/Coolify) in front
    of the app, and it APPENDS the real client IP as the last hop of
    X-Forwarded-For. The LEFTMOST entries are fully client-controlled and so are
    spoofable, especially with `--forwarded-allow-ips '*'`. We therefore use the
    RIGHTMOST (closest-trusted-hop) entry — the IP Traefik itself observed — and
    fall back to the socket peer if the header is absent or malformed."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return get_remote_address(request)


# Per-IP rate limit. /analyze and /assemble accept user-supplied payloads
# and run the full pipeline, so cap how often a single client can hit them.
limiter = Limiter(key_func=client_ip_key)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def reject_oversized_bodies(request: Request, call_next):
    """Reject too-large uploads by Content-Length BEFORE the body is buffered
    into memory/temp files. The per-handler size checks remain as
    defense-in-depth for chunked uploads that omit Content-Length."""
    # Match both the root-mounted paths and the /api-prefixed paths so the
    # guard fires regardless of which mount the request came in on.
    path = request.url.path
    if request.method == "POST" and path in ("/analyze", "/assemble", "/api/analyze", "/api/assemble"):
        raw_len = request.headers.get("content-length")
        if raw_len is not None:
            try:
                size = int(raw_len)
            except ValueError:
                size = None
            if size is not None:
                cap = MAX_CSV_BYTES if path.endswith("/analyze") else MAX_ASSEMBLE_BYTES
                if size > cap:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": f"Request body too large (max {cap // 1024} KB)."},
                    )
    return await call_next(request)


def _allowed_origins() -> Iterable[str]:
    base = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    extra = os.environ.get("FRONTEND_ORIGIN", "").strip()
    if extra:
        base.extend(o.strip() for o in extra.split(",") if o.strip())
    return base


app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_allowed_origins()),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/datasets")
def datasets() -> dict:
    return {
        "datasets": [
            {"key": key, "label": d["label"], "description": d["description"]}
            for key, d in DEMO_DATASETS.items()
        ]
    }


@router.get("/demo")
def demo(dataset: str | None = Query(default=None)) -> dict:
    ds = get_dataset(dataset)
    if ds is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown dataset '{dataset}'. Available: {', '.join(DEMO_DATASETS)}",
        )
    df = pd.DataFrame(ds["rows"])
    result = analyze_market_data(df)
    result["dataset"] = {"label": ds["label"], "description": ds["description"]}
    return result


@router.get("/opportunities/{opportunity_id}/breakdown")
def opportunity_breakdown(
    opportunity_id: str,
    dataset: str | None = Query(default=None),
) -> dict:
    ds = get_dataset(dataset)
    if ds is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown dataset '{dataset}'. Available: {', '.join(DEMO_DATASETS)}",
        )
    df = pd.DataFrame(ds["rows"])
    validate_dataframe(df)
    df = clean_dataframe(df)
    df = calculate_opportunity_scores(df)
    row = find_opportunity_row(df, opportunity_id)
    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Opportunity '{opportunity_id}' not found in dataset '{ds['label']}'",
        )
    return build_breakdown(row)


@router.get("/opportunities/{opportunity_id}/brief")
def opportunity_brief(
    opportunity_id: str,
    dataset: str | None = Query(default=None),
) -> dict:
    ds = get_dataset(dataset)
    if ds is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown dataset '{dataset}'. Available: {', '.join(DEMO_DATASETS)}",
        )
    df = pd.DataFrame(ds["rows"])
    validate_dataframe(df)
    df = clean_dataframe(df)
    df = calculate_opportunity_scores(df)
    row = find_opportunity_row(df, opportunity_id)
    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Opportunity '{opportunity_id}' not found in dataset '{ds['label']}'",
        )
    return build_brief(row, df)


@router.post("/assemble")
@limiter.limit("15/minute")
def assemble_from_paste(request: Request, payload: AssembleRequest) -> dict:
    for label, blob in (
        ("competitors_text", payload.competitors_text),
        ("pains_text", payload.pains_text),
        ("quotes_text", payload.quotes_text),
    ):
        if len(blob.encode("utf-8")) > MAX_PASTE_BLOB:
            raise HTTPException(
                status_code=413,
                detail=f"{label} is too large (max {MAX_PASTE_BLOB // 1024} KB).",
            )

    try:
        rows = assemble(
            payload.competitors_text,
            payload.pains_text,
            payload.quotes_text,
        )
    except AssembleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not rows:
        had_competitors = bool(parse_competitors(payload.competitors_text))
        if had_competitors:
            detail = (
                "Competitors alone can't be scored — add at least one pain point "
                "or interview quote so there's an opportunity to evaluate."
            )
        else:
            detail = "Couldn't extract any usable signals — paste at least one pain or one quote."
        raise HTTPException(status_code=422, detail=detail)
    df = pd.DataFrame(rows)
    try:
        # include_details: embed per-opportunity breakdown + brief. This result
        # lives only in the browser's sessionStorage (no server roundtrip per
        # opportunity), so the client reads the embedded payload instead of
        # recomputing scores in JS — Python stays the single source of truth.
        return analyze_market_data(df, include_details=True)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/analyze")
@limiter.limit("15/minute")
async def analyze(request: Request, file: UploadFile = File(...)) -> dict:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")
    if file.size is not None and file.size > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"CSV is too large ({file.size} bytes; max {MAX_CSV_BYTES // 1024 // 1024} MB).",
        )
    try:
        raw = await file.read()
    except Exception as exc:
        logger.warning("Upload read failed: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="Could not read the uploaded file. Please try again.",
        ) from exc
    if len(raw) > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"CSV is too large ({len(raw)} bytes; max {MAX_CSV_BYTES // 1024 // 1024} MB).",
        )
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        logger.warning("CSV parse failed: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="Could not parse the file as CSV. Make sure it's a valid, comma-separated file with the required columns.",
        ) from exc

    if len(df) > MAX_CSV_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"CSV has too many rows ({len(df)}; max {MAX_CSV_ROWS}).",
        )

    try:
        # include_details: embed per-opportunity breakdown + brief (CSV results
        # live only in the browser, so the client reads these instead of
        # recomputing scores in JS).
        return analyze_market_data(df, include_details=True)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


# Register API routes BEFORE any SPA catch-all so /api/* and the root health/API
# paths are always resolved by the router, never swallowed by the fallback.
#   - "/api/*"  : what the single-origin frontend calls in production.
#   - root "/*" : preserves the original behaviour (e.g. /health for the Docker
#                 HEALTHCHECK, and the legacy Render two-service URLs).
app.include_router(router, prefix="/api")
app.include_router(router)


# --- Production: serve the built frontend from the same origin ---------------
# Only wired up when a built SPA is present (it is COPYied into the image at
# /app/static during the Docker build). Locally there is no such directory, so
# this block is skipped entirely and `npm run dev` + the Vite proxy keep working
# exactly as before.
_STATIC_DIR = Path(os.environ.get("STATIC_DIR", Path(__file__).resolve().parent / "static"))
_INDEX_FILE = _STATIC_DIR / "index.html"

if _INDEX_FILE.is_file():
    # Hashed JS/CSS and other built assets.
    app.mount(
        "/assets",
        StaticFiles(directory=_STATIC_DIR / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        """Serve real files when they exist (favicon, etc.); otherwise return
        index.html so client-side routes like /opportunity/:id/brief survive a
        hard refresh. /api/* and the root API routes are already registered
        above, so they are matched before this catch-all ever runs."""
        candidate = (_STATIC_DIR / full_path).resolve()
        # Guard against path traversal: only serve files inside _STATIC_DIR.
        if (
            full_path
            and candidate.is_file()
            and _STATIC_DIR.resolve() in candidate.parents
        ):
            return FileResponse(candidate)
        return FileResponse(_INDEX_FILE)
