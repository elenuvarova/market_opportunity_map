"""Tests for the paste-to-dataset heuristics (parse.py) and the URL source
classifier (sources.py). Run from backend/:  venv/bin/python -m pytest -q
"""

import pandas as pd
import pytest

from analysis import REQUIRED_COLUMNS, analyze_market_data
from parse import (
    assemble,
    parse_competitors,
    parse_pains,
    parse_quotes,
)
from sources import slugify, source_type_from_url


# --------------------------------------------------------------------------- #
# parse_competitors
# --------------------------------------------------------------------------- #

def test_parse_competitors_basic():
    out = parse_competitors("Notion\nFigma")
    names = [c["competitor"] for c in out]
    assert names == ["Notion", "Figma"]


def test_parse_competitors_pipe_fields_and_tiers():
    out = parse_competitors(
        "Aha | roadmaps | enterprise\n"
        "Free Tool | stuff | free\n"
        "Subby | x | subscription\n"
        "Plain | y"
    )
    by_name = {c["competitor"]: c for c in out}
    assert by_name["Aha"]["pricing_tier"] == "Enterprise"
    assert by_name["Aha"]["feature"] == "roadmaps"
    assert by_name["Free Tool"]["pricing_tier"] == "Free"
    assert by_name["Subby"]["pricing_tier"] == "Subscription"
    assert by_name["Plain"]["pricing_tier"] == "Paid"
    assert by_name["Plain"]["feature"] == "y"


def test_parse_competitors_unspecified_feature_when_no_pipe():
    out = parse_competitors("Bare")
    assert out[0]["feature"] == "(unspecified)"
    assert out[0]["pricing_tier"] == "Paid"


def test_parse_competitors_dedupes_case_insensitive():
    out = parse_competitors("Notion\nnotion\nNOTION")
    assert len(out) == 1


# --------------------------------------------------------------------------- #
# parse_pains
# --------------------------------------------------------------------------- #

def test_parse_pains_with_segment_and_severity():
    out = parse_pains("PMs :: roadmap chaos :: 9")
    assert out == [{"segment": "PMs", "pain": "roadmap chaos", "severity": 9}]


def test_parse_pains_default_segment_and_severity():
    out = parse_pains("something hurts")
    assert out[0]["segment"] == "Pasted segment"
    assert out[0]["severity"] == 7


def test_parse_pains_clamps_severity():
    assert parse_pains("x :: y :: 99")[0]["severity"] == 10


# --------------------------------------------------------------------------- #
# parse_quotes
# --------------------------------------------------------------------------- #

def test_parse_quotes_keyword_severity_bump():
    # 5 baseline + broken(3) + hate(3) -> clamped to 10
    out = parse_quotes("This workflow is broken and I hate it.")
    assert out[0]["severity"] == 10


def test_parse_quotes_wtp_keywords():
    out = parse_quotes("I would pay for a premium version of this.")
    assert out[0]["willingness_to_pay"] == 10  # 5 + would pay(3) + premium(2)


def test_parse_quotes_free_lowers_wtp():
    out = parse_quotes("It should be free.")
    assert out[0]["willingness_to_pay"] == 3   # 5 + free(-2)


def test_parse_quotes_splits_on_blank_lines():
    out = parse_quotes("First insight here.\n\nSecond separate insight.")
    assert len(out) == 2


# --------------------------------------------------------------------------- #
# assemble
# --------------------------------------------------------------------------- #

def test_assemble_empty_returns_nothing():
    assert assemble("", "", "") == []


def test_assemble_rows_have_all_required_columns():
    rows = assemble("Notion | notes | freemium", "PMs :: roadmap pain :: 8", "")
    assert rows
    for row in rows:
        for col in REQUIRED_COLUMNS:
            assert col in row


def test_assemble_synthesizes_competitor_when_none_named():
    rows = assemble("", "PMs :: a real pain :: 8", "")
    assert rows
    assert all(r["competitor"] == "(no competitor named)" for r in rows)


def test_assemble_competition_scales_with_competitor_count():
    rows = assemble("A\nB\nC\nD", "Seg :: pain :: 7", "")
    # min(10, max(3, 4 + 2)) == 6
    assert rows[0]["competition_intensity"] == 6


def test_assemble_output_feeds_pipeline():
    rows = assemble(
        "Notion | notes | freemium\nLinear | issues | paid",
        "PMs :: roadmap doesn't trace to strategy :: 8",
        "We constantly lose track of why we build things. It's frustrating.",
    )
    result = analyze_market_data(pd.DataFrame(rows))
    assert result["summary"]["total_opportunities"] >= 1
    assert result["opportunities"]


def test_assemble_quote_attaches_pasted_source():
    rows = assemble("", "", "This is painful and slow.")
    assert rows
    srcs = rows[0]["sources"]
    assert srcs and srcs[0]["url"] == "pasted://insight"


# --------------------------------------------------------------------------- #
# sources.py
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("url,label", [
    ("https://news.ycombinator.com/item?id=1", "HackerNews thread"),
    ("https://www.lennysnewsletter.com/p/x", "Lenny's newsletter"),
    ("https://www.mckinsey.com/x", "McKinsey report"),
    ("https://www.nngroup.com/articles/ux-debt/", "NN/g article"),
    ("https://www.figma.com/pricing/", "Vendor (Figma)"),
    ("pasted://insight", "Pasted insight"),
    ("https://some-unknown-site.example/x", "Web source"),
    ("", "Web source"),
])
def test_source_type_from_url(url, label):
    assert source_type_from_url(url) == label


@pytest.mark.parametrize("text,slug", [
    ("Strategy cascade tool", "strategy-cascade-tool"),
    ("Skills-to-business-outcome analytics", "skills-to-business-outcome-analytics"),
    ("  Mixed CASE & symbols!! ", "mixed-case-symbols"),
])
def test_slugify(text, slug):
    assert slugify(text) == slug
