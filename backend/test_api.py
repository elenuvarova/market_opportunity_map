"""Endpoint tests for the FastAPI app — covers the hardening fixes:
proxy-aware rate-limit key, early Content-Length rejection, friendly CSV
errors (no raw exception leakage), and the competitors-only paste message.

Run from backend/:  venv/bin/python -m pytest test_api.py -q
"""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import main
from main import MAX_ASSEMBLE_BYTES, app, client_ip_key

client = TestClient(app)


# --------------------------------------------------------------------------- #
# Basic endpoints
# --------------------------------------------------------------------------- #

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_demo_default_dataset():
    r = client.get("/demo")
    assert r.status_code == 200
    assert r.json()["summary"]["total_opportunities"] == 12


def test_demo_unknown_dataset_404():
    r = client.get("/demo?dataset=does-not-exist")
    assert r.status_code == 404


def test_datasets_lists_both():
    r = client.get("/datasets")
    keys = {d["key"] for d in r.json()["datasets"]}
    assert {"product", "edtech"} <= keys


# --------------------------------------------------------------------------- #
# /analyze — friendly errors, no raw exception leakage
# --------------------------------------------------------------------------- #

def test_analyze_rejects_non_csv_extension():
    r = client.post("/analyze", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert r.status_code == 400
    assert "csv" in r.json()["detail"].lower()


def test_analyze_unparseable_csv_gives_friendly_error():
    # Valid .csv name but binary/garbage content. Must NOT leak raw pandas
    # tokenizer text or a traceback to the client.
    r = client.post("/analyze", files={"file": ("x.csv", b"\x80\x81\x82\x83", "text/csv")})
    assert r.status_code in (400, 422)
    detail = r.json()["detail"]
    for leak in ("Traceback", "tokeniz", "codec can't", "C error"):
        assert leak not in detail


def test_analyze_valid_csv_roundtrips():
    csv = (
        "segment,pain_point,competitor,feature,pricing_tier,opportunity,"
        "severity,willingness_to_pay,competition_intensity,evidence_count\n"
        "PMs,roadmap pain,Aha,roadmaps,Paid,Roadmap tool,8,7,6,3\n"
    )
    r = client.post("/analyze", files={"file": ("d.csv", csv.encode(), "text/csv")})
    assert r.status_code == 200
    assert r.json()["summary"]["total_opportunities"] == 1


# --------------------------------------------------------------------------- #
# /assemble — competitors-only message + oversized body
# --------------------------------------------------------------------------- #

def test_assemble_competitors_only_gives_clear_message():
    r = client.post(
        "/assemble",
        json={"competitors_text": "Notion\nFigma", "pains_text": "", "quotes_text": ""},
    )
    assert r.status_code == 422
    assert "competitor" in r.json()["detail"].lower()


def test_assemble_empty_gives_generic_message():
    r = client.post(
        "/assemble",
        json={"competitors_text": "", "pains_text": "", "quotes_text": ""},
    )
    assert r.status_code == 422
    assert "at least one pain" in r.json()["detail"].lower()


def test_assemble_happy_path():
    r = client.post(
        "/assemble",
        json={
            "competitors_text": "Notion | notes | freemium",
            "pains_text": "PMs :: roadmap doesn't trace to strategy :: 8",
            "quotes_text": "",
        },
    )
    assert r.status_code == 200
    assert r.json()["opportunities"]


def test_assemble_oversized_body_rejected_early():
    # Exceeds the combined /assemble ceiling -> middleware returns 413 by
    # Content-Length before the body is buffered.
    big = "x" * (MAX_ASSEMBLE_BYTES + 50 * 1024)
    r = client.post(
        "/assemble",
        json={"competitors_text": "", "pains_text": big, "quotes_text": ""},
    )
    assert r.status_code == 413
    assert "too large" in r.json()["detail"].lower()


# --------------------------------------------------------------------------- #
# Proxy-aware rate-limit key
# --------------------------------------------------------------------------- #

def test_client_ip_key_uses_rightmost_forwarded_for():
    # Single trusted proxy appends the real client IP as the LAST hop. The
    # leftmost entry is client-controlled (spoofable); we take the rightmost.
    req = SimpleNamespace(
        headers={"x-forwarded-for": "10.0.0.5, 203.0.113.7"},
        client=SimpleNamespace(host="172.16.0.1"),
    )
    assert client_ip_key(req) == "203.0.113.7"


def test_client_ip_key_ignores_spoofed_leftmost_entry():
    # An attacker who sets X-Forwarded-For can't pick their own bucket: the
    # trusted proxy appends the observed client IP last, so that wins.
    spoofed = SimpleNamespace(
        headers={"x-forwarded-for": "1.1.1.1, 203.0.113.7"},
        client=SimpleNamespace(host="172.16.0.1"),
    )
    legit = SimpleNamespace(
        headers={"x-forwarded-for": "203.0.113.7"},
        client=SimpleNamespace(host="172.16.0.1"),
    )
    # Both resolve to the same (proxy-observed) client IP -> same bucket.
    assert client_ip_key(spoofed) == client_ip_key(legit) == "203.0.113.7"


def test_client_ip_key_falls_back_to_remote_addr():
    req = SimpleNamespace(headers={}, client=SimpleNamespace(host="198.51.100.9"))
    assert client_ip_key(req) == "198.51.100.9"


def test_client_ip_key_distinguishes_two_users_behind_proxy():
    a = SimpleNamespace(
        headers={"x-forwarded-for": "10.0.0.5, 203.0.113.7"},
        client=SimpleNamespace(host="172.16.0.1"),
    )
    b = SimpleNamespace(
        headers={"x-forwarded-for": "10.0.0.5, 198.51.100.99"},
        client=SimpleNamespace(host="172.16.0.1"),
    )
    # Same proxy peer, different real clients (rightmost) -> different buckets.
    assert client_ip_key(a) != client_ip_key(b)
