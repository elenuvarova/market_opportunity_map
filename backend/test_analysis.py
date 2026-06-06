"""Test suite for the Market Opportunity Map scoring engine.

Covers the scoring formula, decision buckets, score-breakdown decomposition,
edge cases (clamping, evidence capping, dedup), input validation, and the
integrity of the bundled demo datasets. Run from the backend/ directory:

    venv/bin/python -m pytest -q
"""

import pandas as pd
import pytest

from analysis import (
    REQUIRED_COLUMNS,
    ValidationError,
    analyze_market_data,
    build_opportunities,
    calculate_opportunity_scores,
    clean_dataframe,
    decision_bucket,
    score_breakdown,
    validate_dataframe,
)
from demo_data import DEMO_DATASETS, EDTECH_ROWS, PRODUCT_ROWS


def make_row(opportunity="Opp", segment="Seg", sev=5, wtp=5, comp=5, ev=3,
             competitor="Comp", feature="Feat", pain="Pain", tier="Paid"):
    return {
        "segment": segment,
        "pain_point": pain,
        "competitor": competitor,
        "feature": feature,
        "pricing_tier": tier,
        "opportunity": opportunity,
        "severity": sev,
        "willingness_to_pay": wtp,
        "competition_intensity": comp,
        "evidence_count": ev,
    }


def score_of(sev, wtp, comp, ev):
    df = clean_dataframe(pd.DataFrame([make_row(sev=sev, wtp=wtp, comp=comp, ev=ev)]))
    df = calculate_opportunity_scores(df)
    return int(df["opportunity_score"].iloc[0])


# --------------------------------------------------------------------------- #
# Scoring formula
# --------------------------------------------------------------------------- #

def test_formula_hero_values_match_case_study():
    # These are the two top demo scores quoted in the case study.
    assert score_of(8, 9, 6, 3) == 65   # Strategy cascade tool
    assert score_of(8, 9, 7, 4) == 64   # Skills-to-business-outcome analytics


def test_formula_ceiling_with_valid_inputs():
    # competition_intensity is clamped to [1, 10], so the smallest competition
    # term is (10 - 1) * 0.25. The best a real opportunity can score is 98 —
    # reaching 100 would need competition = 0, which is outside the valid
    # 1-10 input range. The [0, 100] clamp is still a correct bound.
    assert score_of(10, 10, 1, 10) == 98
    assert score_of(10, 10, 1, 99) <= 100


def test_score_is_clamped_to_0_100():
    assert 0 <= score_of(1, 1, 10, 0) <= 100
    assert score_of(10, 10, 1, 999) <= 100


def test_evidence_is_capped_at_10():
    # Beyond 10 distinct sources, more evidence must not move the score.
    assert score_of(5, 5, 5, 10) == score_of(5, 5, 5, 50)


def test_competition_is_inverted():
    # Lower competition must yield a higher score, all else equal.
    assert score_of(5, 5, 2, 3) > score_of(5, 5, 9, 3)


def test_severity_weighted_higher_than_evidence():
    # Maxing severity must beat maxing evidence (0.35 weight vs 0.15), holding
    # the other inputs equal.
    sev_maxed = score_of(10, 5, 5, 0)
    ev_maxed = score_of(1, 5, 5, 10)
    assert sev_maxed > ev_maxed


# --------------------------------------------------------------------------- #
# Decision buckets
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("score,key", [
    (100, "strong"),
    (75, "strong"),
    (74, "worth_validating"),
    (60, "worth_validating"),
    (59, "needs_more_research"),
    (40, "needs_more_research"),
    (39, "low_priority"),
    (0, "low_priority"),
])
def test_decision_bucket_boundaries(score, key):
    assert decision_bucket(score)[0] == key


def test_decision_bucket_labels():
    assert decision_bucket(80)[1] == "Strong opportunity"
    assert decision_bucket(65)[1] == "Worth validating"
    assert decision_bucket(45)[1] == "Needs more research"
    assert decision_bucket(10)[1] == "Low priority"


# --------------------------------------------------------------------------- #
# Score breakdown decomposition
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("sev,wtp,comp,ev", [
    (8, 9, 6, 3), (8, 9, 7, 4), (7, 5, 6, 3), (6, 3, 8, 2), (10, 10, 1, 5),
])
def test_breakdown_components_sum_to_score(sev, wtp, comp, ev):
    comps = score_breakdown(sev, wtp, comp, ev)
    total = round(sum(c["contribution"] for c in comps))
    # Bars are each rounded to 1 dp; their sum must equal the score within
    # one rounding unit.
    assert abs(total - score_of(sev, wtp, comp, ev)) <= 1


def test_breakdown_has_four_named_components():
    comps = score_breakdown(8, 9, 6, 3)
    names = {c["name"] for c in comps}
    assert names == {
        "severity", "willingness_to_pay", "competition_intensity", "evidence_count"
    }


def test_breakdown_competition_is_marked_inverted():
    comps = {c["name"]: c for c in score_breakdown(8, 9, 6, 3)}
    assert comps["competition_intensity"].get("inverted") is True


# --------------------------------------------------------------------------- #
# Input validation & cleaning
# --------------------------------------------------------------------------- #

def test_missing_columns_raises():
    with pytest.raises(ValidationError):
        validate_dataframe(pd.DataFrame([{"segment": "x"}]))


def test_empty_dataframe_raises():
    with pytest.raises(ValidationError):
        validate_dataframe(pd.DataFrame({c: [] for c in REQUIRED_COLUMNS}))


def test_clean_clips_out_of_range_values():
    df = pd.DataFrame([make_row(sev=99, wtp=-5, comp=50, ev=-3)])
    cleaned = clean_dataframe(df)
    assert cleaned["severity"].iloc[0] == 10
    assert cleaned["willingness_to_pay"].iloc[0] == 1
    assert cleaned["competition_intensity"].iloc[0] == 10
    assert cleaned["evidence_count"].iloc[0] == 0


def test_clean_drops_rows_with_blank_strings():
    df = pd.DataFrame([
        make_row(opportunity="Keep"),
        make_row(opportunity="", segment=""),
    ])
    cleaned = clean_dataframe(df)
    assert len(cleaned) == 1
    assert cleaned["opportunity"].iloc[0] == "Keep"


# --------------------------------------------------------------------------- #
# Dedup behaviour
# --------------------------------------------------------------------------- #

def test_build_opportunities_dedup_keeps_highest_score():
    df = clean_dataframe(pd.DataFrame([
        make_row(opportunity="Dup", sev=4, wtp=3, comp=8, ev=2),   # low score
        make_row(opportunity="Dup", sev=9, wtp=9, comp=2, ev=5),   # high score
    ]))
    df = calculate_opportunity_scores(df)
    opps = build_opportunities(df)
    dup = [o for o in opps if o["opportunity"] == "Dup"]
    assert len(dup) == 1
    assert dup[0]["opportunity_score"] == max(int(s) for s in df["opportunity_score"])


# --------------------------------------------------------------------------- #
# include_details: per-opportunity breakdown + brief embedded for /analyze and
# /assemble (so the client never recomputes scores in JS).
# --------------------------------------------------------------------------- #

def test_opportunities_have_no_details_by_default():
    # /demo path stays lean — no embedded breakdown/brief.
    res = analyze_market_data(pd.DataFrame(DEMO_DATASETS["product"]["rows"]))
    assert all("breakdown" not in o and "brief" not in o for o in res["opportunities"])


def test_include_details_embeds_breakdown_and_brief():
    res = analyze_market_data(
        pd.DataFrame(DEMO_DATASETS["product"]["rows"]), include_details=True
    )
    for o in res["opportunities"]:
        assert "breakdown" in o and "brief" in o
        # Anti-drift: the embedded score must equal the ranked-table score.
        assert o["breakdown"]["score"] == o["opportunity_score"]
        assert o["brief"]["score_block"]["score"] == o["opportunity_score"]
        assert len(o["breakdown"]["components"]) == 4


def test_include_details_score_matches_for_crossjoined_opportunity():
    # When a pain cross-joins across competitors, the embedded breakdown must use
    # the highest-score representative row (matching build_opportunities), not an
    # arbitrary first match.
    df = clean_dataframe(pd.DataFrame([
        make_row(opportunity="Dup", sev=4, wtp=3, comp=8, ev=2),   # low score
        make_row(opportunity="Dup", sev=9, wtp=9, comp=2, ev=5),   # high score
    ]))
    df = calculate_opportunity_scores(df)
    opps = build_opportunities(df, include_details=True)
    dup = next(o for o in opps if o["opportunity"] == "Dup")
    assert dup["breakdown"]["score"] == dup["opportunity_score"]
    assert dup["brief"]["score_block"]["score"] == dup["opportunity_score"]


# --------------------------------------------------------------------------- #
# End-to-end on the demo datasets (ground truth for the case study)
# --------------------------------------------------------------------------- #

def test_demo_counts():
    p = analyze_market_data(pd.DataFrame(DEMO_DATASETS["product"]["rows"]))
    e = analyze_market_data(pd.DataFrame(DEMO_DATASETS["edtech"]["rows"]))
    assert p["summary"]["total_opportunities"] == 12
    assert e["summary"]["total_opportunities"] == 12


def test_demo_top_opportunities():
    p = analyze_market_data(pd.DataFrame(DEMO_DATASETS["product"]["rows"]))
    e = analyze_market_data(pd.DataFrame(DEMO_DATASETS["edtech"]["rows"]))
    assert p["summary"]["top_opportunity"] == "Strategy cascade tool"
    assert p["summary"]["top_opportunity_score"] == 65
    assert e["summary"]["top_opportunity"] == "Skills-to-business-outcome analytics"
    assert e["summary"]["top_opportunity_score"] == 64


def test_no_demo_opportunity_reaches_strong():
    for key in ("product", "edtech"):
        res = analyze_market_data(pd.DataFrame(DEMO_DATASETS[key]["rows"]))
        assert all(o["opportunity_score"] < 75 for o in res["opportunities"])


def test_demo_response_shape():
    res = analyze_market_data(pd.DataFrame(DEMO_DATASETS["product"]["rows"]))
    for key in ("summary", "nodes", "edges", "opportunities", "matrix",
                "competitor_feature_matrix"):
        assert key in res
    assert len(res["nodes"]) > 0
    assert len(res["edges"]) > 0


# --------------------------------------------------------------------------- #
# Demo data integrity
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("rows", [PRODUCT_ROWS, EDTECH_ROWS])
def test_demo_rows_have_valid_ranges(rows):
    for r in rows:
        assert 1 <= r["severity"] <= 10, r["opportunity"]
        assert 1 <= r["willingness_to_pay"] <= 10, r["opportunity"]
        assert 1 <= r["competition_intensity"] <= 10, r["opportunity"]
        assert r["evidence_count"] >= 1, r["opportunity"]


@pytest.mark.parametrize("rows", [PRODUCT_ROWS, EDTECH_ROWS])
def test_demo_rows_have_sources(rows):
    for r in rows:
        assert r["sources"], r["opportunity"]
        assert all("url" in s and s["url"].startswith("http") for s in r["sources"])


@pytest.mark.parametrize("rows", [PRODUCT_ROWS, EDTECH_ROWS])
def test_evidence_count_never_exceeds_sources(rows):
    # You may claim fewer evidence points than URLs listed (e.g. a pricing page
    # confirms a tier but isn't pain evidence), but never more.
    for r in rows:
        assert r["evidence_count"] <= len(r["sources"]), r["opportunity"]


@pytest.mark.parametrize("rows", [PRODUCT_ROWS, EDTECH_ROWS])
def test_demo_opportunity_names_unique(rows):
    names = [r["opportunity"] for r in rows]
    assert len(names) == len(set(names))


@pytest.mark.parametrize("rows", [PRODUCT_ROWS, EDTECH_ROWS])
def test_demo_rows_have_all_required_columns(rows):
    for r in rows:
        for col in REQUIRED_COLUMNS:
            assert col in r, f"{r.get('opportunity')} missing {col}"
