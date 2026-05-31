import io
import logging
import os
from typing import Iterable

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from fastapi.responses import JSONResponse

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
from parse import assemble, parse_competitors


MAX_CSV_BYTES = 2 * 1024 * 1024  # 2 MB
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

def client_ip_key(request: Request) -> str:
    """Rate-limit key that survives Render's reverse proxy. Without this every
    request arrives with the proxy's IP and the per-IP limit collapses into one
    shared global bucket — one busy client would 429 everyone. The first
    X-Forwarded-For entry is the originating client."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
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
    if request.method == "POST" and request.url.path in ("/analyze", "/assemble"):
        raw_len = request.headers.get("content-length")
        if raw_len is not None:
            try:
                size = int(raw_len)
            except ValueError:
                size = None
            if size is not None:
                cap = MAX_CSV_BYTES if request.url.path == "/analyze" else MAX_ASSEMBLE_BYTES
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


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/datasets")
def datasets() -> dict:
    return {
        "datasets": [
            {"key": key, "label": d["label"], "description": d["description"]}
            for key, d in DEMO_DATASETS.items()
        ]
    }


@app.get("/demo")
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


@app.get("/opportunities/{opportunity_id}/breakdown")
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


@app.get("/opportunities/{opportunity_id}/brief")
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


@app.post("/assemble")
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

    rows = assemble(
        payload.competitors_text,
        payload.pains_text,
        payload.quotes_text,
    )
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
        return analyze_market_data(df)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/analyze")
@limiter.limit("15/minute")
async def analyze(request: Request, file: UploadFile = File(...)) -> dict:
    if not file.filename.lower().endswith(".csv"):
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

    try:
        return analyze_market_data(df)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
