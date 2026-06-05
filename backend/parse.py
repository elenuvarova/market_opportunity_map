"""Heuristic parsing of pasted text into a Market Opportunity Map dataset.

No LLM, no scraping. Just split-and-guess. The output is intentionally low-
fidelity — the UI banner makes that explicit. For a higher-fidelity dataset,
users should upload a CSV.
"""
from __future__ import annotations

import re
from collections import Counter

# Hard caps on assemble()'s cross-join. assemble() pairs every distinct pain
# with every competitor, so the row count grows as pains * competitors. A small
# (<100KB) paste of many short lines can therefore explode into millions of
# rows — an algorithmic-complexity DoS. Cap each side, and cap the product,
# BEFORE building the cross-join. Exceeding any cap raises AssembleError, which
# the /assemble endpoint turns into an HTTP 422.
MAX_COMPETITORS = 200
MAX_PAINS = 500
MAX_CROSS_JOIN_ROWS = 5000


class AssembleError(Exception):
    """Raised when pasted input would produce an unreasonably large dataset."""


SEVERITY_KEYWORDS = {
    "broken": 3,
    "blocker": 3,
    "blocked": 2,
    "hate": 3,
    "terrible": 3,
    "awful": 3,
    "nightmare": 3,
    "painful": 2,
    "frustrated": 2,
    "frustrating": 2,
    "annoying": 1,
    "slow": 1,
    "confusing": 1,
    "wish": 1,
    "missing": 1,
    "lacks": 1,
}

WTP_KEYWORDS = {
    "would pay": 3,
    "happy to pay": 3,
    "willing to pay": 3,
    "paying": 2,
    "subscribe": 2,
    "premium": 2,
    "free": -2,
    "cheap": -1,
}


def _clean_line(s: str) -> str:
    return s.strip().strip(",.;").strip()


def parse_competitors(text: str) -> list[dict]:
    """One competitor per line. Optional `Name | what they do | rough price tier`."""
    out = []
    seen = set()
    for raw in (text or "").splitlines():
        line = _clean_line(raw)
        if not line:
            continue
        parts = [p.strip() for p in line.split("|")]
        name = parts[0]
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        feature = parts[1] if len(parts) > 1 and parts[1] else "(unspecified)"
        tier_raw = (parts[2] if len(parts) > 2 else "").lower()
        if "free" in tier_raw or "freemium" in tier_raw:
            tier = "Freemium" if "freemium" in tier_raw else "Free"
        elif "enterprise" in tier_raw:
            tier = "Enterprise"
        elif "sub" in tier_raw:
            tier = "Subscription"
        elif tier_raw:
            tier = "Paid"
        else:
            tier = "Paid"
        out.append({"competitor": name, "feature": feature, "pricing_tier": tier})
    return out


def parse_pains(text: str) -> list[dict]:
    """One pain per line. Optional `Segment :: pain :: severity 1-10`."""
    out = []
    for raw in (text or "").splitlines():
        line = _clean_line(raw)
        if not line:
            continue
        parts = [p.strip() for p in line.split("::")]
        if len(parts) >= 2:
            segment = parts[0] or "Pasted segment"
            pain = parts[1]
        else:
            segment = "Pasted segment"
            pain = parts[0]
        severity = 7
        if len(parts) >= 3:
            m = re.search(r"\d+", parts[2])
            if m:
                severity = max(1, min(10, int(m.group())))
        if pain:
            out.append({"segment": segment, "pain": pain, "severity": severity})
    return out


def parse_quotes(text: str) -> list[dict]:
    """Blank-line-separated blocks. Heuristic severity from keywords; first
    sentence becomes the pain summary."""
    out = []
    if not text:
        return out
    blocks = re.split(r"\n\s*\n", text.strip())
    for block in blocks:
        cleaned = block.strip()
        if not cleaned:
            continue
        first_sentence = re.split(r"[.!?]\s+", cleaned, maxsplit=1)[0].strip()
        pain = first_sentence[:140] if first_sentence else cleaned[:140]
        lower = cleaned.lower()
        severity = 5
        for word, weight in SEVERITY_KEYWORDS.items():
            if word in lower:
                severity += weight
        severity = max(1, min(10, severity))
        wtp_adj = 0
        for word, weight in WTP_KEYWORDS.items():
            if word in lower:
                wtp_adj += weight
        wtp = max(1, min(10, 5 + wtp_adj))
        out.append(
            {
                "segment": "Pasted insights",
                "pain": pain,
                "quote": cleaned[:400],
                "severity": severity,
                "willingness_to_pay": wtp,
            }
        )
    return out


def _opportunity_for_pain(pain: str) -> str:
    short = pain[:60].rstrip(",.;")
    return f"Address: {short}"


def assemble(competitors_text: str, pains_text: str, quotes_text: str) -> list[dict]:
    """Stitch the three blobs into a list of rows matching the demo-data
    schema. Each row is a (segment, pain, competitor) triple plus heuristic
    scores and (for quote-derived rows) the pasted quote as a source."""
    competitors = parse_competitors(competitors_text)
    pains_b = parse_pains(pains_text)
    pains_c = parse_quotes(quotes_text)

    # Cap each side of the cross-join before doing any further work.
    if len(competitors) > MAX_COMPETITORS:
        raise AssembleError(
            f"Too many competitors ({len(competitors)}; max {MAX_COMPETITORS}). "
            "Trim the list or upload a CSV instead."
        )

    all_pains: list[dict] = list(pains_b)
    for q in pains_c:
        all_pains.append(
            {
                "segment": q["segment"],
                "pain": q["pain"],
                "severity": q["severity"],
                "willingness_to_pay": q["willingness_to_pay"],
                "evidence_quote": q["quote"],
            }
        )

    if not all_pains:
        return []

    if len(all_pains) > MAX_PAINS:
        raise AssembleError(
            f"Too many pain points ({len(all_pains)}; max {MAX_PAINS}). "
            "Trim the input or upload a CSV instead."
        )

    # Competition intensity scales with number of competitors mentioned
    competition_intensity = min(10, max(3, len(competitors) + 2))

    if not competitors:
        # Synthesize one "(no competitor named)" so the graph still has shape
        competitors = [
            {"competitor": "(no competitor named)", "feature": "(unspecified)", "pricing_tier": "Paid"}
        ]

    # Final guard on the cross-join size (pains * competitors), evaluated with
    # the synthesized competitor included, before any rows are built.
    cross_join_rows = len(all_pains) * len(competitors)
    if cross_join_rows > MAX_CROSS_JOIN_ROWS:
        raise AssembleError(
            f"This input would generate {cross_join_rows} rows "
            f"({len(all_pains)} pains x {len(competitors)} competitors; "
            f"max {MAX_CROSS_JOIN_ROWS}). Trim the input or upload a CSV instead."
        )

    pain_counts = Counter(p["pain"] for p in all_pains)

    rows = []
    for pain in all_pains:
        for comp in competitors:
            row = {
                "segment": pain["segment"],
                "pain_point": pain["pain"],
                "competitor": comp["competitor"],
                "feature": comp["feature"],
                "pricing_tier": comp["pricing_tier"],
                "opportunity": _opportunity_for_pain(pain["pain"]),
                "severity": int(pain["severity"]),
                "willingness_to_pay": int(pain.get("willingness_to_pay", 5)),
                "competition_intensity": competition_intensity,
                "evidence_count": pain_counts[pain["pain"]],
                "sources": [],
            }
            if "evidence_quote" in pain:
                row["sources"] = [
                    {
                        "url": "pasted://insight",
                        "note": pain["evidence_quote"],
                    }
                ]
            rows.append(row)
    return rows
