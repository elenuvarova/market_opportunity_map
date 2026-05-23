from __future__ import annotations

import io
import os
from typing import Iterable

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from analysis import (
    ValidationError,
    analyze_market_data,
    build_breakdown,
    clean_dataframe,
    calculate_opportunity_scores,
    find_opportunity_row,
    validate_dataframe,
)
from demo_data import DEMO_DATASETS, get_dataset

app = FastAPI(title="Market Opportunity Map API", version="0.2.0")


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


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> dict:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")
    try:
        raw = await file.read()
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc

    try:
        return analyze_market_data(df)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
