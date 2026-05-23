from __future__ import annotations

from collections import Counter

import networkx as nx
import pandas as pd

from sources import slugify, source_type_from_url

REQUIRED_COLUMNS = [
    "segment",
    "pain_point",
    "competitor",
    "feature",
    "pricing_tier",
    "opportunity",
    "severity",
    "willingness_to_pay",
    "competition_intensity",
    "evidence_count",
]

STRING_COLUMNS = [
    "segment",
    "pain_point",
    "competitor",
    "feature",
    "pricing_tier",
    "opportunity",
]

NUMERIC_COLUMNS = [
    "severity",
    "willingness_to_pay",
    "competition_intensity",
    "evidence_count",
]


class ValidationError(Exception):
    pass


def validate_dataframe(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValidationError(
            f"Missing required columns: {', '.join(missing)}"
        )
    if df.empty:
        raise ValidationError("CSV contains no rows")


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in STRING_COLUMNS:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"": None, "nan": None, "None": None})
    for col in NUMERIC_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=STRING_COLUMNS + NUMERIC_COLUMNS)
    for col in ["severity", "willingness_to_pay", "competition_intensity"]:
        df[col] = df[col].clip(lower=1, upper=10)
    df["evidence_count"] = df["evidence_count"].clip(lower=0)

    if "sources" not in df.columns:
        df["sources"] = [[] for _ in range(len(df))]
    else:
        df["sources"] = df["sources"].apply(lambda v: v if isinstance(v, list) else [])

    df = df.reset_index(drop=True)
    return df


SCORE_WEIGHTS = {
    "severity": 0.35,
    "willingness_to_pay": 0.25,
    "competition_intensity": 0.25,
    "evidence_count": 0.15,
}

FORMULA_NOTE = (
    "score = (severity × 0.35 + WTP × 0.25 + (10 − competition_intensity) × 0.25 + "
    "min(evidence_count / 10, 1) × 10 × 0.15) × 10, rounded and clipped to 0–100"
)


def calculate_opportunity_scores(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    evidence_capped = (df["evidence_count"] / 10).clip(upper=1) * 10
    raw = (
        df["severity"] * SCORE_WEIGHTS["severity"]
        + df["willingness_to_pay"] * SCORE_WEIGHTS["willingness_to_pay"]
        + (10 - df["competition_intensity"]) * SCORE_WEIGHTS["competition_intensity"]
        + evidence_capped * SCORE_WEIGHTS["evidence_count"]
    )
    df["opportunity_score"] = (raw * 10).round().astype(int).clip(lower=0, upper=100)
    return df


def decision_bucket(score: int) -> tuple[str, str]:
    if score >= 75:
        return ("strong", "Strong opportunity")
    if score >= 60:
        return ("worth_validating", "Worth validating")
    if score >= 40:
        return ("needs_more_research", "Needs more research")
    return ("low_priority", "Low priority")


def score_breakdown(severity: int, wtp: int, competition: int, evidence: int) -> list[dict]:
    """Decompose a score into 4 components, each contribution scaled to 0–100
    (same scale as the final opportunity_score) so bars sum to the score."""
    evidence_capped = min(evidence / 10, 1) * 10
    return [
        {
            "name": "severity",
            "label": "Severity",
            "raw_value": int(severity),
            "raw_value_max": 10,
            "weight": SCORE_WEIGHTS["severity"],
            "contribution": round(severity * SCORE_WEIGHTS["severity"] * 10, 1),
            "note": "How bad the pain is for this segment (1–10).",
        },
        {
            "name": "willingness_to_pay",
            "label": "Willingness to pay",
            "raw_value": int(wtp),
            "raw_value_max": 10,
            "weight": SCORE_WEIGHTS["willingness_to_pay"],
            "contribution": round(wtp * SCORE_WEIGHTS["willingness_to_pay"] * 10, 1),
            "note": "How much customers in this segment would pay to fix it (1–10).",
        },
        {
            "name": "competition_intensity",
            "label": "Low competition",
            "raw_value": int(competition),
            "raw_value_max": 10,
            "weight": SCORE_WEIGHTS["competition_intensity"],
            "contribution": round((10 - competition) * SCORE_WEIGHTS["competition_intensity"] * 10, 1),
            "note": f"Crowded space scores low. Inverted: contribution = (10 − {int(competition)}) × {SCORE_WEIGHTS['competition_intensity']} × 10.",
            "inverted": True,
        },
        {
            "name": "evidence_count",
            "label": "Evidence strength",
            "raw_value": int(evidence),
            "raw_value_max": None,
            "weight": SCORE_WEIGHTS["evidence_count"],
            "contribution": round(evidence_capped * SCORE_WEIGHTS["evidence_count"] * 10, 1),
            "note": f"Number of distinct credible sources, capped at 10. min({int(evidence)} / 10, 1) × 10 × {SCORE_WEIGHTS['evidence_count']} × 10.",
            "capped_at": 10,
        },
    ]


def find_opportunity_row(df: pd.DataFrame, opportunity_id: str) -> dict | None:
    for _, row in df.iterrows():
        if slugify(row["opportunity"]) == opportunity_id:
            return row.to_dict()
    return None


def _enrich_sources(raw_sources: list) -> list[dict]:
    out = []
    for s in raw_sources or []:
        if not isinstance(s, dict) or "url" not in s:
            continue
        url = str(s["url"])
        out.append(
            {
                "url": url,
                "source_type": source_type_from_url(url),
                "note": str(s.get("note", "")),
                "is_paraphrase": True,
            }
        )
    return out


def build_competitive_landscape(df: pd.DataFrame, segment: str, max_competitors: int = 3) -> list[dict]:
    """For a given segment, return the top competitors active there plus the
    pain points in that segment they don't appear next to. Used in the
    Opportunity Brief to anchor 'what they don't cover'."""
    segment_rows = df[df["segment"] == segment]
    if segment_rows.empty:
        return []

    all_pains = set(segment_rows["pain_point"].unique().tolist())

    by_competitor: dict[str, dict[str, set]] = {}
    for _, r in segment_rows.iterrows():
        bucket = by_competitor.setdefault(
            r["competitor"], {"features": set(), "pains": set(), "pricing_tiers": set()}
        )
        bucket["features"].add(r["feature"])
        bucket["pains"].add(r["pain_point"])
        bucket["pricing_tiers"].add(r["pricing_tier"])

    items = []
    for competitor, b in by_competitor.items():
        items.append(
            {
                "competitor": competitor,
                "features_covered": sorted(b["features"]),
                "pricing_tiers": sorted(b["pricing_tiers"]),
                "pains_addressed": sorted(b["pains"]),
                "pains_not_addressed": sorted(all_pains - b["pains"]),
            }
        )
    items.sort(key=lambda c: (-len(c["features_covered"]), c["competitor"]))
    return items[:max_competitors]


_NEXT_STEP_TEMPLATES = {
    "strong": "Build a 2-week prototype with 5–10 customers from this segment.",
    "worth_validating": "Run 5 customer interviews focused on: \"{pain}\".",
    "needs_more_research": "Collect 10+ additional signals from sources like {sources}.",
    "low_priority": "Park. Re-evaluate in 3 months when more signals accumulate.",
}

_DEFAULT_OPEN_QUESTIONS = [
    "Market sizing — how many customers in this segment actually feel this pain enough to switch?",
    "Retention — does solving this pain create stickiness, or is it a one-shot need?",
    "Willingness to pay — does the WTP score hold up against a real $/mo question, or is it directional?",
]


def build_brief(row: dict, df: pd.DataFrame) -> dict:
    """Compose a one-page opportunity brief: title, one-liner, score block,
    top signals, competitive landscape, open questions, recommended next step."""
    breakdown = build_breakdown(row)
    bucket_key = breakdown["bucket_key"]

    landscape = build_competitive_landscape(df, row["segment"])
    signals = breakdown["supporting_signals"]
    top_signals = signals[:3]

    source_types = sorted({s["source_type"] for s in signals}) if signals else []
    if not source_types:
        source_types = ["HackerNews", "Reddit", "industry reports"]
    sources_hint = ", ".join(source_types[:3])

    template = _NEXT_STEP_TEMPLATES[bucket_key]
    next_step = template.format(pain=row["pain_point"], sources=sources_hint)

    return {
        "id": breakdown["id"],
        "title": row["opportunity"],
        "one_liner": f"{row['segment']} struggling with: {row['pain_point']}.",
        "segment": row["segment"],
        "pain_point": row["pain_point"],
        "competitor_in_row": row["competitor"],
        "feature_in_row": row["feature"],
        "pricing_tier_in_row": row["pricing_tier"],
        "score_block": {
            "score": breakdown["score"],
            "bucket_key": breakdown["bucket_key"],
            "bucket_label": breakdown["bucket_label"],
            "components": breakdown["components"],
            "formula_note": breakdown["formula_note"],
        },
        "top_signals": top_signals,
        "total_signals": len(signals),
        "competitive_landscape": landscape,
        "open_questions": list(_DEFAULT_OPEN_QUESTIONS),
        "next_step": {
            "bucket_key": bucket_key,
            "bucket_label": breakdown["bucket_label"],
            "recommendation": next_step,
        },
    }


def build_breakdown(row: dict) -> dict:
    score = int(row["opportunity_score"])
    bucket_key, bucket_label = decision_bucket(score)
    return {
        "id": slugify(row["opportunity"]),
        "opportunity": row["opportunity"],
        "segment": row["segment"],
        "pain_point": row["pain_point"],
        "competitor": row["competitor"],
        "score": score,
        "bucket_key": bucket_key,
        "bucket_label": bucket_label,
        "formula_note": FORMULA_NOTE,
        "components": score_breakdown(
            row["severity"],
            row["willingness_to_pay"],
            row["competition_intensity"],
            row["evidence_count"],
        ),
        "supporting_signals": _enrich_sources(row.get("sources", [])),
    }


def _node_id(node_type: str, label: str) -> str:
    return f"{node_type}:{label}"


def build_graph(df: pd.DataFrame) -> nx.MultiDiGraph:
    g = nx.MultiDiGraph()

    def add_node(node_type: str, label: str) -> str:
        nid = _node_id(node_type, label)
        if not g.has_node(nid):
            g.add_node(nid, type=node_type, label=label, frequency=0)
        g.nodes[nid]["frequency"] += 1
        return nid

    def add_edge(source: str, target: str) -> None:
        if g.has_edge(source, target):
            keys = list(g[source][target])
            g[source][target][keys[0]]["weight"] += 1
        else:
            g.add_edge(source, target, weight=1)

    for _, row in df.iterrows():
        seg = add_node("segment", row["segment"])
        pain = add_node("pain_point", row["pain_point"])
        comp = add_node("competitor", row["competitor"])
        feat = add_node("feature", row["feature"])
        price = add_node("pricing_tier", row["pricing_tier"])
        opp = add_node("opportunity", row["opportunity"])

        add_edge(seg, pain)
        add_edge(pain, opp)
        add_edge(comp, feat)
        add_edge(comp, price)
        add_edge(feat, pain)
        add_edge(opp, seg)

    return g


def _graph_metrics(g: nx.MultiDiGraph) -> dict:
    simple = nx.DiGraph()
    for u, v, data in g.edges(data=True):
        if simple.has_edge(u, v):
            simple[u][v]["weight"] += data.get("weight", 1)
        else:
            simple.add_edge(u, v, weight=data.get("weight", 1))
    for n in g.nodes:
        if not simple.has_node(n):
            simple.add_node(n)

    degree = nx.degree_centrality(simple)
    if simple.number_of_nodes() > 2:
        betweenness = nx.betweenness_centrality(simple)
    else:
        betweenness = {n: 0.0 for n in simple.nodes}
    return {"degree": degree, "betweenness": betweenness}


def serialize_graph(g: nx.MultiDiGraph) -> tuple[list, list]:
    metrics = _graph_metrics(g)
    degree = metrics["degree"]
    betweenness = metrics["betweenness"]

    nodes = []
    for nid, attrs in g.nodes(data=True):
        freq = attrs.get("frequency", 1)
        deg = degree.get(nid, 0.0)
        size = round(8 + freq * 2 + deg * 30, 2)
        nodes.append(
            {
                "id": nid,
                "label": attrs.get("label", nid),
                "type": attrs.get("type", "unknown"),
                "size": size,
                "centrality": round(deg, 4),
                "betweenness": round(betweenness.get(nid, 0.0), 4),
                "frequency": freq,
            }
        )

    edges = []
    seen: dict[tuple[str, str], int] = {}
    for u, v, data in g.edges(data=True):
        seen[(u, v)] = seen.get((u, v), 0) + data.get("weight", 1)
    for (u, v), w in seen.items():
        edges.append({"source": u, "target": v, "weight": w})

    return nodes, edges


def calculate_summary(df: pd.DataFrame) -> dict:
    top = df.sort_values("opportunity_score", ascending=False).iloc[0]
    crowded = (
        df.groupby("feature")["competition_intensity"].mean().sort_values(ascending=False)
    )
    most_crowded_area = crowded.index[0] if len(crowded) else ""

    segment_scores = df.groupby("segment").agg(
        avg_severity=("severity", "mean"),
        avg_competition=("competition_intensity", "mean"),
        avg_score=("opportunity_score", "mean"),
    )
    segment_scores["underserved_score"] = (
        segment_scores["avg_severity"] - segment_scores["avg_competition"]
    )
    most_underserved_segment = (
        segment_scores.sort_values("underserved_score", ascending=False).index[0]
        if len(segment_scores)
        else ""
    )

    return {
        "total_segments": int(df["segment"].nunique()),
        "total_pain_points": int(df["pain_point"].nunique()),
        "total_competitors": int(df["competitor"].nunique()),
        "total_features": int(df["feature"].nunique()),
        "total_opportunities": int(df["opportunity"].nunique()),
        "top_opportunity": str(top["opportunity"]),
        "top_opportunity_score": int(top["opportunity_score"]),
        "most_crowded_area": str(most_crowded_area),
        "most_underserved_segment": str(most_underserved_segment),
    }


def build_competitor_feature_matrix(df: pd.DataFrame) -> list[dict]:
    pairs = df[["competitor", "feature"]].drop_duplicates()
    counts = Counter(zip(pairs["competitor"], pairs["feature"]))
    return [
        {"competitor": c, "feature": f, "value": 1}
        for (c, f), _ in counts.items()
    ]


def build_opportunities(df: pd.DataFrame) -> list[dict]:
    """One row per opportunity id (slug of name). When the dataset
    cross-joins a pain across multiple competitors (common in pasted
    input), we keep the row with the highest score and merge sources."""
    ranked = df.sort_values("opportunity_score", ascending=False)
    seen: dict[str, dict] = {}
    for _, row in ranked.iterrows():
        oid = slugify(row["opportunity"])
        if oid in seen:
            seen[oid]["sources"].extend(_enrich_sources(row.get("sources", [])))
            continue
        seen[oid] = {
            "id": oid,
            "opportunity": row["opportunity"],
            "segment": row["segment"],
            "pain_point": row["pain_point"],
            "competitor": row["competitor"],
            "feature": row["feature"],
            "severity": int(row["severity"]),
            "willingness_to_pay": int(row["willingness_to_pay"]),
            "competition_intensity": int(row["competition_intensity"]),
            "evidence_count": int(row["evidence_count"]),
            "opportunity_score": int(row["opportunity_score"]),
            "sources": _enrich_sources(row.get("sources", [])),
        }
    # Dedupe merged sources by URL
    for o in seen.values():
        seen_urls = set()
        unique = []
        for s in o["sources"]:
            if s["url"] in seen_urls:
                continue
            seen_urls.add(s["url"])
            unique.append(s)
        o["sources"] = unique
    return list(seen.values())


def build_matrix(df: pd.DataFrame) -> list[dict]:
    """One scatter point per opportunity id; collapses duplicate rows."""
    seen: dict[str, dict] = {}
    for _, row in df.iterrows():
        oid = slugify(row["opportunity"])
        entry = {
            "id": oid,
            "opportunity": row["opportunity"],
            "segment": row["segment"],
            "x_competition": int(row["competition_intensity"]),
            "y_severity": int(row["severity"]),
            "bubble_size": int(row["evidence_count"]),
            "score": int(row["opportunity_score"]),
        }
        if oid not in seen or entry["score"] > seen[oid]["score"]:
            seen[oid] = entry
    return list(seen.values())


def analyze_market_data(df: pd.DataFrame) -> dict:
    validate_dataframe(df)
    df = clean_dataframe(df)
    if df.empty:
        raise ValidationError("All rows were dropped during cleaning")
    df = calculate_opportunity_scores(df)
    graph = build_graph(df)
    nodes, edges = serialize_graph(graph)

    return {
        "summary": calculate_summary(df),
        "nodes": nodes,
        "edges": edges,
        "opportunities": build_opportunities(df),
        "matrix": build_matrix(df),
        "competitor_feature_matrix": build_competitor_feature_matrix(df),
    }
