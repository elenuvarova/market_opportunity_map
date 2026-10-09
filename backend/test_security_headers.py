"""Security headers are set on API, SPA and error responses; the CSP is
strict (no eval, no inline script) and still allows the Umami counter.

Run from backend/:  venv/bin/python -m pytest test_security_headers.py -q
"""

import pytest
from fastapi.testclient import TestClient

from main import CONTENT_SECURITY_POLICY, app

client = TestClient(app)

EXPECTED = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
}


def _directives(csp: str) -> dict[str, list[str]]:
    out = {}
    for part in csp.split(";"):
        tokens = part.split()
        if tokens:
            out[tokens[0]] = tokens[1:]
    return out


@pytest.mark.parametrize("path", ["/health", "/api/health", "/api/demo?dataset=product", "/api/demo?dataset=nope"])
def test_security_headers_present(path):
    r = client.get(path)
    for name, value in EXPECTED.items():
        assert r.headers.get(name) == value, name
    assert r.headers.get("content-security-policy") == CONTENT_SECURITY_POLICY


def test_csp_is_strict_and_allows_umami():
    d = _directives(CONTENT_SECURITY_POLICY)
    assert d["default-src"] == ["'self'"]
    assert d["object-src"] == ["'none'"]
    assert d["frame-ancestors"] == ["'none'"]
    assert "https://stats.ontwrpn.com" in d["script-src"]
    assert "https://stats.ontwrpn.com" in d["connect-src"]
    # Inline <style> is needed by react-force-graph; inline script never is.
    assert "'unsafe-inline'" not in d["script-src"]
    assert "'unsafe-eval'" not in CONTENT_SECURITY_POLICY


def test_swagger_docs_exempt_from_csp_but_keep_other_headers():
    r = client.get("/docs")
    assert r.status_code == 200
    assert "content-security-policy" not in r.headers
    assert r.headers.get("x-content-type-options") == "nosniff"
