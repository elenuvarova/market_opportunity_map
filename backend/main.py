from __future__ import annotations

import io
import os
from typing import Iterable

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from analysis import ValidationError, analyze_market_data
from demo_data import DEMO_ROWS

app = FastAPI(title="Market Opportunity Map API", version="0.1.0")


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


@app.get("/demo")
def demo() -> dict:
    df = pd.DataFrame(DEMO_ROWS)
    return analyze_market_data(df)


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
