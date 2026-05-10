"""Google Play Developer API client for in-app purchase verification.

Implements the OAuth2 service-account JWT bearer flow described at
https://developers.google.com/identity/protocols/oauth2/service-account:

    1. Sign a JWT assertion with the service account's RSA private key.
    2. POST the assertion to https://oauth2.googleapis.com/token in
       exchange for an OAuth2 access token (~1h TTL).
    3. Use the access token to call androidpublisher.googleapis.com.

The access token is cached in memory and refreshed in-place when it has
less than TOKEN_REFRESH_THRESHOLD_SEC remaining. A single asyncio.Lock
serializes refreshes so that N concurrent receipt verifications still
result in at most one token exchange.

We intentionally use python-jose (already a hard dependency for the auth
stack) instead of pulling in google-auth — the JWT bearer flow is a
small, well-specified protocol, and it keeps the dependency surface and
async story clean.

Env vars:
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
        The full JSON contents of the service account key downloaded
        from Google Play Console → API access → Service accounts.
        Single-line JSON. Required for production receipt verification;
        when unset the receipt-verification endpoint falls back to the
        dev stub (see _verify_android_receipt).

    ANDROID_PACKAGE_NAME (optional, default "com.kiaanverse.app")
        Override the Android package name used in the API URL. Defaults
        to the production package; primarily useful in tests.
"""

from __future__ import annotations

import asyncio
import datetime
import json
import logging
import os
from typing import Any, Optional

import httpx
from jose import jwt

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
ANDROIDPUBLISHER_BASE = (
    "https://androidpublisher.googleapis.com/androidpublisher/v3"
)
ANDROIDPUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher"

# Refresh the access token when it has less than this many seconds left.
TOKEN_REFRESH_THRESHOLD_SEC = 60
# Google caps service-account JWT lifetime at 1 hour.
JWT_LIFETIME_SEC = 3600

ENV_SERVICE_ACCOUNT = "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"
ENV_PACKAGE_NAME = "ANDROID_PACKAGE_NAME"
DEFAULT_PACKAGE_NAME = "com.kiaanverse.app"


class GooglePlayConfigError(RuntimeError):
    """Raised when service-account credentials are missing or malformed.

    Distinct from GooglePlayAPIError so that the receipt endpoint can
    map config errors to 500 (operator must fix) and API errors to 503
    or 4xx (transient or user-actionable).
    """


class GooglePlayAPIError(RuntimeError):
    """Raised when the Play Developer API returns a non-success response."""


class GooglePlayService:
    """Async client for the Google Play Developer API.

    Lazily loads service-account credentials on first use. Caches the
    OAuth2 access token and refreshes it under an asyncio.Lock so that
    a burst of concurrent receipt verifications results in at most one
    token exchange.

    Not thread-safe across event loops; safe within a single event
    loop. Intended to be used via the module-level singleton returned
    by get_google_play_service().
    """

    def __init__(self) -> None:
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime.datetime] = None
        self._lock: Optional[asyncio.Lock] = None
        self._service_account: Optional[dict[str, Any]] = None

    def _get_lock(self) -> asyncio.Lock:
        # Lazy-init so we don't bind to an event loop at import time.
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    def _load_service_account(self) -> dict[str, Any]:
        """Parse GOOGLE_PLAY_SERVICE_ACCOUNT_JSON into a dict.

        Cached after the first successful load. Raises GooglePlayConfigError
        if the env var is missing, isn't valid JSON, or lacks the keys we
        need for the JWT exchange.
        """
        if self._service_account is not None:
            return self._service_account

        raw = os.getenv(ENV_SERVICE_ACCOUNT, "")
        if not raw:
            raise GooglePlayConfigError(
                f"{ENV_SERVICE_ACCOUNT} not set — cannot verify Play receipts"
            )

        try:
            sa = json.loads(raw)
        except json.JSONDecodeError as e:
            raise GooglePlayConfigError(
                f"{ENV_SERVICE_ACCOUNT} is not valid JSON: {e}"
            ) from e

        if not isinstance(sa, dict):
            raise GooglePlayConfigError(
                f"{ENV_SERVICE_ACCOUNT} must decode to a JSON object"
            )

        for required_key in ("client_email", "private_key"):
            if not sa.get(required_key):
                raise GooglePlayConfigError(
                    f"Service account JSON missing required key: {required_key}"
                )

        self._service_account = sa
        return sa

    async def _fetch_access_token(self) -> tuple[str, datetime.datetime]:
        """Exchange a fresh JWT assertion for an OAuth2 access token.

        Returns:
            (access_token, expires_at) — expires_at in UTC.

        Raises:
            GooglePlayConfigError: credentials missing/malformed/unsignable.
            GooglePlayAPIError: token endpoint returned non-200 or no token.
        """
        sa = self._load_service_account()
        token_uri = sa.get("token_uri") or GOOGLE_TOKEN_URL
        now = datetime.datetime.now(datetime.UTC)
        claims = {
            "iss": sa["client_email"],
            "scope": ANDROIDPUBLISHER_SCOPE,
            "aud": token_uri,
            "iat": int(now.timestamp()),
            "exp": int(
                (now + datetime.timedelta(seconds=JWT_LIFETIME_SEC)).timestamp()
            ),
        }
        try:
            assertion = jwt.encode(claims, sa["private_key"], algorithm="RS256")
        except Exception as e:
            # python-jose surfaces malformed PEM keys as generic JWTError
            # subclasses; treat all signing failures as a config issue.
            raise GooglePlayConfigError(
                f"Failed to sign JWT assertion (check private_key format): {e}"
            ) from e

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                token_uri,
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": assertion,
                },
            )

        if resp.status_code != 200:
            raise GooglePlayAPIError(
                f"OAuth2 token exchange failed ({resp.status_code}): "
                f"{resp.text[:500]}"
            )

        try:
            data = resp.json()
        except json.JSONDecodeError as e:
            raise GooglePlayAPIError(
                f"OAuth2 response is not JSON: {e}"
            ) from e

        access_token = data.get("access_token")
        expires_in = int(data.get("expires_in") or JWT_LIFETIME_SEC)
        if not access_token:
            raise GooglePlayAPIError("OAuth2 response missing access_token")

        expires_at = now + datetime.timedelta(seconds=expires_in)
        logger.info(
            "Google Play access token refreshed (expires_in=%ds)", expires_in
        )
        return access_token, expires_at

    async def get_access_token(self) -> str:
        """Return a valid access token, refreshing under lock if near expiry.

        Concurrent calls during a refresh window will block briefly on the
        lock; once the first caller refreshes, subsequent callers see the
        cached token.
        """
        async with self._get_lock():
            now = datetime.datetime.now(datetime.UTC)
            if (
                self._access_token
                and self._token_expires_at
                and (self._token_expires_at - now).total_seconds()
                > TOKEN_REFRESH_THRESHOLD_SEC
            ):
                return self._access_token

            token, expires_at = await self._fetch_access_token()
            self._access_token = token
            self._token_expires_at = expires_at
            return token

    async def get_subscription(
        self,
        package_name: str,
        product_id: str,
        purchase_token: str,
    ) -> dict[str, Any]:
        """Call purchases.subscriptions.get on the Play Developer API.

        Args:
            package_name: The Android application id (e.g. com.kiaanverse.app).
            product_id: The subscription SKU (e.g. com.kiaanverse.sadhak.monthly).
            purchase_token: The opaque token the client received from
                react-native-iap when the user completed the purchase.

        Returns:
            The full SubscriptionPurchase resource as a dict. See
            https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions
            for the schema. Notable fields:
                - expiryTimeMillis (str)
                - paymentState (int) — 0 pending / 1 received / 2 free trial /
                                       3 pending deferred upgrade-downgrade
                - cancelReason (int, optional)
                - autoRenewing (bool)

        Raises:
            GooglePlayConfigError: on credentials problems.
            GooglePlayAPIError: on any non-2xx API response. The error
                message includes the status code and a truncated body so
                the operator can distinguish 404 (token not found) from
                410 (token gone) from 5xx (Google outage).
        """
        token = await self.get_access_token()
        url = (
            f"{ANDROIDPUBLISHER_BASE}/applications/{package_name}"
            f"/purchases/subscriptions/{product_id}/tokens/{purchase_token}"
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                url, headers={"Authorization": f"Bearer {token}"}
            )

        if resp.status_code == 200:
            return resp.json()

        # 401 specifically can mean the cached token went stale (e.g. service
        # account key rotated). Force a refresh next call by clearing cache.
        if resp.status_code == 401:
            self._access_token = None
            self._token_expires_at = None

        raise GooglePlayAPIError(
            f"Play API returned {resp.status_code} for "
            f"{product_id}/{purchase_token[:8]}…: {resp.text[:500]}"
        )


# Module-level singleton — lazy-init on first call.
_service_singleton: Optional[GooglePlayService] = None


def get_google_play_service() -> GooglePlayService:
    """Return the process-wide GooglePlayService singleton."""
    global _service_singleton
    if _service_singleton is None:
        _service_singleton = GooglePlayService()
    return _service_singleton


def reset_google_play_service() -> None:
    """Reset the singleton — for tests only."""
    global _service_singleton
    _service_singleton = None


def is_configured() -> bool:
    """Return True if the service-account env var is present.

    We don't parse here to avoid throwing during a simple availability
    check (e.g. in startup logs or in the receipt endpoint's stub fork).
    """
    return bool(os.getenv(ENV_SERVICE_ACCOUNT))


def get_package_name() -> str:
    """Return the configured Android package name (or the default)."""
    return os.getenv(ENV_PACKAGE_NAME) or DEFAULT_PACKAGE_NAME
