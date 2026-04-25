"""Unit tests for the CSRF middleware bypass paths used by the React Native
Android app.

Background
----------
The Android app authenticates with ``Authorization: Bearer <token>`` and tags
every request with ``X-Client: kiaanverse-mobile``.  The native HTTP stack on
Android/iOS auto-attaches any cookies the backend has set on prior GETs
(including ``csrf_token``), which previously caused every chat / tool POST to
be rejected with ``403 CSRF token validation failed`` because the app does
not (and should not) read those cookies.

These tests lock in the middleware's new behaviour:

* skip CSRF when the request authenticates via Bearer or comes from a known
  native client identifier, AND
* continue to enforce CSRF for classic browser cookie-auth flows.

Note on the autouse fixture
---------------------------
``tests/conftest.py`` has a session-scoped autouse fixture that monkey-patches
``CSRFMiddleware.dispatch`` to a passthrough so the rest of the suite is not
gated by CSRF.  We capture the *original* dispatch reference at module-import
time (which runs before any fixture executes) and rebuild a small Starlette
app whose CSRFMiddleware uses that captured dispatch.  This lets us exercise
the real logic without disturbing other tests.
"""

from __future__ import annotations

import pytest

from backend.middleware.csrf import (
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    CSRFMiddleware,
)

# Capture before conftest's autouse fixture runs.  Module-level statements
# execute during collection, well before fixture setup.
_ORIGINAL_DISPATCH = CSRFMiddleware.dispatch


@pytest.fixture
def csrf_app():
    """Build a minimal Starlette app with only CSRF middleware mounted.

    Subclasses ``CSRFMiddleware`` to bind the *original* dispatch — bypassing
    the session-scoped passthrough patch installed by ``tests/conftest.py``.
    """
    from starlette.applications import Starlette
    from starlette.responses import JSONResponse
    from starlette.routing import Route
    from starlette.testclient import TestClient

    class _RealCSRFMiddleware(CSRFMiddleware):
        # Re-bind the captured original dispatch on this subclass so the
        # conftest patch on the parent class does not affect us.
        dispatch = _ORIGINAL_DISPATCH  # type: ignore[assignment]

    async def echo(request):
        return JSONResponse({"ok": True})

    app = Starlette(routes=[Route("/echo", echo, methods=["GET", "POST"])])
    # cookie_secure=False so TestClient can set/read the cookie over http.
    app.add_middleware(_RealCSRFMiddleware, cookie_secure=False, cookie_samesite="lax")
    return TestClient(app)


def test_post_with_cookie_but_no_header_is_rejected(csrf_app):
    """Classic browser cookie-auth without X-CSRF-Token must still 403."""
    csrf_app.get("/echo")
    assert csrf_app.cookies.get(CSRF_COOKIE_NAME), "GET should seed csrf_token"

    res = csrf_app.post("/echo")
    assert res.status_code == 403
    assert res.json()["error"] == "csrf_token_invalid"


def test_post_with_matching_header_succeeds(csrf_app):
    """Classic browser flow with matching cookie + header must pass."""
    csrf_app.get("/echo")
    token = csrf_app.cookies.get(CSRF_COOKIE_NAME)
    assert token

    res = csrf_app.post("/echo", headers={CSRF_HEADER_NAME: token})
    assert res.status_code == 200, res.text
    assert res.json() == {"ok": True}


def test_post_with_x_client_native_mobile_skips_csrf(csrf_app):
    """React Native ``X-Client: kiaanverse-mobile`` bypasses CSRF.

    The native HTTP stack auto-attaches cookies the backend set on prior
    GETs, so the request looks "browser-like" to the middleware.  Since the
    Android app cannot read those cookies and authenticates via Bearer, CSRF
    is irrelevant — and the middleware must let the request through even
    though no X-CSRF-Token header is present.
    """
    csrf_app.get("/echo")  # seed csrf_token cookie
    assert csrf_app.cookies.get(CSRF_COOKIE_NAME)

    res = csrf_app.post("/echo", headers={"X-Client": "kiaanverse-mobile"})
    assert res.status_code == 200, res.text


def test_post_with_x_client_uppercase_native_mobile_skips_csrf(csrf_app):
    """Header value matching is case-insensitive."""
    csrf_app.get("/echo")
    res = csrf_app.post("/echo", headers={"X-Client": "Kiaanverse-Mobile"})
    assert res.status_code == 200, res.text


def test_post_with_bearer_auth_skips_csrf(csrf_app):
    """Bearer-auth requests bypass CSRF (header auth, not cookie auth)."""
    csrf_app.get("/echo")
    assert csrf_app.cookies.get(CSRF_COOKIE_NAME)

    res = csrf_app.post(
        "/echo",
        headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.fake.token"},
    )
    assert res.status_code == 200, res.text


def test_post_with_unknown_x_client_still_enforces_csrf(csrf_app):
    """Only known native client identifiers bypass CSRF.  Random strings must
    NOT — otherwise an attacker could trivially defeat the protection by
    setting the header from a malicious site."""
    csrf_app.get("/echo")

    res = csrf_app.post("/echo", headers={"X-Client": "evil-attacker"})
    assert res.status_code == 403
    assert res.json()["error"] == "csrf_token_invalid"


def test_post_with_basic_auth_still_enforces_csrf(csrf_app):
    """Only Bearer-auth bypasses CSRF.  Basic auth is uncommon but browsers
    re-send it like a cookie, so it must remain protected."""
    csrf_app.get("/echo")

    res = csrf_app.post(
        "/echo",
        headers={"Authorization": "Basic dXNlcjpwYXNz"},
    )
    assert res.status_code == 403


def test_post_without_any_cookies_passes(csrf_app):
    """Stateless API clients with no cookies at all bypass CSRF — the
    pre-existing behaviour for SDK / server-to-server callers."""
    # Fresh client, no GET first → no csrf_token cookie set.
    res = csrf_app.post("/echo")
    assert res.status_code == 200, res.text
