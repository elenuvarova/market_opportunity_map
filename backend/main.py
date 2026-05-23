import io
import os
from typing import Iterable

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

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
from parse import assemble


MAX_CSV_BYTES = 2 * 1024 * 1024  # 2 MB
MAX_PASTE_BLOB = 100 * 1024  # 100 KB per text blob


class AssembleRequest(BaseModel):
    competitors_text: str = ""
    pains_text: str = ""
    quotes_text: str = ""

app = FastAPI(title="Market Opportunity Map API", version="0.2.0")

# Per-IP rate limit. /analyze and /assemble accept user-supplied payloads
# and run the full pipeline, so cap how often a single client can hit them.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


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
        raise HTTPException(
            status_code=422,
            detail="Couldn't extract any usable signals — paste at least one pain or one quote.",
        )
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
        raise HTTPException(status_code=400, detail=f"Could not read upload: {exc}") from exc
    if len(raw) > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"CSV is too large ({len(raw)} bytes; max {MAX_CSV_BYTES // 1024 // 1024} MB).",
        )
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc

    try:
        return analyze_market_data(df)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
