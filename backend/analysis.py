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


def calculate_opportunity_scores(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    evidence_capped = (df["evidence_count"] / 10).clip(upper=1) * 10
    raw = (
        df["severity"] * 0.35
        + df["willingness_to_pay"] * 0.25
        + (10 - df["competition_intensity"]) * 0.25
        + evidence_capped * 0.15
    )
    df["opportunity_score"] = (raw * 10).round().astype(int).clip(lower=0, upper=100)
    return df


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


def build_opportunities(df: pd.DataFrame) -> list[dict]:
    ranked = df.sort_values("opportunity_score", ascending=False)
    out = []
    for _, row in ranked.iterrows():
        out.append(
            {
                "id": slugify(row["opportunity"]),
                "opportunity": row["opportunity"],
                "segment": row["segment"],
                "pain_point": row["pain_point"],
                "competitor": row["competitor"],
                "severity": int(row["severity"]),
                "willingness_to_pay": int(row["willingness_to_pay"]),
                "competition_intensity": int(row["competition_intensity"]),
                "evidence_count": int(row["evidence_count"]),
                "opportunity_score": int(row["opportunity_score"]),
                "sources": _enrich_sources(row.get("sources", [])),
            }
        )
    return out


def build_matrix(df: pd.DataFrame) -> list[dict]:
    return [
        {
            "id": slugify(row["opportunity"]),
            "opportunity": row["opportunity"],
            "segment": row["segment"],
            "x_competition": int(row["competition_intensity"]),
            "y_severity": int(row["severity"]),
            "bubble_size": int(row["evidence_count"]),
            "score": int(row["opportunity_score"]),
        }
        for _, row in df.iterrows()
    ]


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
