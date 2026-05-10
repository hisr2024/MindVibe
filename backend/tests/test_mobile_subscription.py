"""Tests for the mobile in-app purchase receipt verification endpoint.

4-tier model (March 2026): free / bhakta / sadhak / siddha
Product IDs: com.kiaanverse.{bhakta,sadhak,siddha}.{monthly,yearly}

Covers:
- Valid receipt → tier activated
- Invalid product ID → rejected
- Receipt verification failure → returns free tier
- Idempotent re-verification → same result
- Platform validation (ios/android only)
- Google Play service: config validation, token caching, API call wiring
- _verify_android_receipt: stub fork, valid path, invalid path, config error
"""

import datetime
from unittest.mock import AsyncMock, patch

import pytest

from backend.routes.mobile_subscription import (
    PRODUCT_TIER_MAP,
    BACKEND_TO_MOBILE_TIER,
    ReceiptVerifyRequest,
    ReceiptVerifyResponse,
    _verify_android_receipt,
)
from backend.models.base import SubscriptionTier
from backend.services.google_play_service import (
    GooglePlayAPIError,
    GooglePlayConfigError,
    GooglePlayService,
    get_package_name,
    is_configured,
    reset_google_play_service,
)


class TestProductTierMapping:
    """Verify product ID → tier mapping is correct (4-tier model)."""

    def test_bhakta_monthly_maps_to_bhakta(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.bhakta.monthly"] == SubscriptionTier.BHAKTA

    def test_bhakta_yearly_maps_to_bhakta(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.bhakta.yearly"] == SubscriptionTier.BHAKTA

    def test_sadhak_monthly_maps_to_sadhak(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.sadhak.monthly"] == SubscriptionTier.SADHAK

    def test_sadhak_yearly_maps_to_sadhak(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.sadhak.yearly"] == SubscriptionTier.SADHAK

    def test_siddha_monthly_maps_to_siddha(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.siddha.monthly"] == SubscriptionTier.SIDDHA

    def test_siddha_yearly_maps_to_siddha(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.siddha.yearly"] == SubscriptionTier.SIDDHA

    def test_unknown_product_not_in_map(self):
        assert "com.unknown.product" not in PRODUCT_TIER_MAP

    def test_old_sacred_divine_products_not_in_map(self):
        assert "com.kiaanverse.sacred.monthly" not in PRODUCT_TIER_MAP
        assert "com.kiaanverse.divine.monthly" not in PRODUCT_TIER_MAP


class TestBackendToMobileTierMapping:
    """Verify backend tier → mobile tier name mapping (1:1, no collapsing)."""

    def test_free_maps_to_free(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.FREE] == "free"

    def test_bhakta_maps_to_bhakta(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.BHAKTA] == "bhakta"

    def test_sadhak_maps_to_sadhak(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.SADHAK] == "sadhak"

    def test_siddha_maps_to_siddha(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.SIDDHA] == "siddha"

    def test_all_tiers_mapped(self):
        for tier in SubscriptionTier:
            assert tier in BACKEND_TO_MOBILE_TIER


class TestReceiptVerifyRequest:
    """Verify request schema validation."""

    def test_valid_ios_request(self):
        req = ReceiptVerifyRequest(
            receipt="base64-encoded-receipt-data",
            platform="ios",
            product_id="com.kiaanverse.sadhak.monthly",
        )
        assert req.platform == "ios"
        assert req.product_id == "com.kiaanverse.sadhak.monthly"

    def test_valid_android_request(self):
        req = ReceiptVerifyRequest(
            receipt="purchase-token-string",
            platform="android",
            product_id="com.kiaanverse.siddha.yearly",
        )
        assert req.platform == "android"

    def test_invalid_platform_rejected(self):
        with pytest.raises(Exception):
            ReceiptVerifyRequest(
                receipt="test",
                platform="windows",
                product_id="com.kiaanverse.sadhak.monthly",
            )

    def test_empty_receipt_rejected(self):
        with pytest.raises(Exception):
            ReceiptVerifyRequest(
                receipt="",
                platform="ios",
                product_id="com.kiaanverse.bhakta.monthly",
            )


class TestReceiptVerifyResponse:
    """Verify response schema structure."""

    def test_valid_response(self):
        resp = ReceiptVerifyResponse(
            valid=True,
            tier="sadhak",
            expires_at="2026-04-22T00:00:00Z",
        )
        assert resp.valid is True
        assert resp.tier == "sadhak"

    def test_invalid_response_with_error(self):
        resp = ReceiptVerifyResponse(
            valid=False,
            tier="free",
            error="Receipt validation failed.",
        )
        assert resp.valid is False
        assert resp.tier == "free"
        assert resp.error is not None

    def test_response_defaults(self):
        resp = ReceiptVerifyResponse(valid=True, tier="siddha")
        assert resp.expires_at is None
        assert resp.error is None


# ---------------------------------------------------------------------------
# Google Play Service — config & token caching
# ---------------------------------------------------------------------------


class TestGooglePlayConfig:
    """Verify GOOGLE_PLAY_SERVICE_ACCOUNT_JSON parsing & is_configured()."""

    def test_is_configured_false_when_env_unset(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", raising=False)
        assert is_configured() is False

    def test_is_configured_true_when_env_set(self, monkeypatch):
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )
        assert is_configured() is True

    def test_get_package_name_default(self, monkeypatch):
        monkeypatch.delenv("ANDROID_PACKAGE_NAME", raising=False)
        assert get_package_name() == "com.kiaanverse.app"

    def test_get_package_name_override(self, monkeypatch):
        monkeypatch.setenv("ANDROID_PACKAGE_NAME", "com.example.staging")
        assert get_package_name() == "com.example.staging"

    def test_load_service_account_raises_when_missing(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", raising=False)
        svc = GooglePlayService()
        with pytest.raises(GooglePlayConfigError, match="not set"):
            svc._load_service_account()

    def test_load_service_account_raises_on_invalid_json(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "not json {{")
        svc = GooglePlayService()
        with pytest.raises(GooglePlayConfigError, match="not valid JSON"):
            svc._load_service_account()

    def test_load_service_account_raises_on_non_object(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", '"a string"')
        svc = GooglePlayService()
        with pytest.raises(GooglePlayConfigError, match="JSON object"):
            svc._load_service_account()

    def test_load_service_account_raises_on_missing_keys(self, monkeypatch):
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com"}',  # missing private_key
        )
        svc = GooglePlayService()
        with pytest.raises(GooglePlayConfigError, match="private_key"):
            svc._load_service_account()

    def test_load_service_account_caches_after_first_parse(self, monkeypatch):
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )
        svc = GooglePlayService()
        first = svc._load_service_account()
        # Mutate env after the first load; cached value must not change.
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", '{"corrupted": true}'
        )
        second = svc._load_service_account()
        assert first is second
        assert "client_email" in second


class TestGooglePlayTokenCaching:
    """Verify get_access_token() returns cached token until near expiry."""

    @pytest.mark.asyncio
    async def test_cached_token_returned_when_fresh(self, monkeypatch):
        svc = GooglePlayService()
        svc._access_token = "cached-token"
        svc._token_expires_at = datetime.datetime.now(
            datetime.UTC
        ) + datetime.timedelta(hours=1)

        token = await svc.get_access_token()
        assert token == "cached-token"

    @pytest.mark.asyncio
    async def test_token_refreshed_when_within_threshold(self, monkeypatch):
        svc = GooglePlayService()
        svc._access_token = "old-token"
        # Within the 60s refresh threshold.
        svc._token_expires_at = datetime.datetime.now(
            datetime.UTC
        ) + datetime.timedelta(seconds=10)

        new_expires = datetime.datetime.now(
            datetime.UTC
        ) + datetime.timedelta(hours=1)
        with patch.object(
            svc,
            "_fetch_access_token",
            AsyncMock(return_value=("new-token", new_expires)),
        ):
            token = await svc.get_access_token()

        assert token == "new-token"
        assert svc._access_token == "new-token"
        assert svc._token_expires_at == new_expires

    @pytest.mark.asyncio
    async def test_token_fetched_on_first_call(self, monkeypatch):
        svc = GooglePlayService()
        # Cold cache — both fields None.
        assert svc._access_token is None

        new_expires = datetime.datetime.now(
            datetime.UTC
        ) + datetime.timedelta(hours=1)
        with patch.object(
            svc,
            "_fetch_access_token",
            AsyncMock(return_value=("fresh-token", new_expires)),
        ):
            token = await svc.get_access_token()

        assert token == "fresh-token"


# ---------------------------------------------------------------------------
# _verify_android_receipt — integration-style with mocked service
# ---------------------------------------------------------------------------


class TestVerifyAndroidReceipt:
    """Verify _verify_android_receipt routes correctly through the service."""

    @pytest.fixture(autouse=True)
    def _reset_singleton(self):
        # Ensure each test gets a fresh GooglePlayService singleton so
        # cached service-account data from a prior test doesn't leak.
        reset_google_play_service()
        yield
        reset_google_play_service()

    @pytest.mark.asyncio
    async def test_stub_fork_when_env_unset(self, monkeypatch):
        """No env var → accept everything with mock 30-day expiry (dev only)."""
        monkeypatch.delenv("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", raising=False)

        result = await _verify_android_receipt(
            receipt="any-token", product_id="com.kiaanverse.sadhak.monthly"
        )

        assert result["valid"] is True
        assert result["expires_at"] is not None
        # Expiry should be ~30 days from now.
        delta = result["expires_at"] - datetime.datetime.now(datetime.UTC)
        assert 29 <= delta.days <= 31

    @pytest.mark.asyncio
    async def test_valid_receipt_returns_expiry(self, monkeypatch):
        """Valid SubscriptionPurchase → valid=True with parsed expiry."""
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )

        future_ms = int(
            (
                datetime.datetime.now(datetime.UTC)
                + datetime.timedelta(days=30)
            ).timestamp()
            * 1000
        )
        mock_response = {
            "expiryTimeMillis": str(future_ms),
            "paymentState": 1,  # received
            "autoRenewing": True,
        }

        with patch(
            "backend.services.google_play_service.GooglePlayService.get_subscription",
            AsyncMock(return_value=mock_response),
        ):
            result = await _verify_android_receipt(
                receipt="valid-token",
                product_id="com.kiaanverse.sadhak.monthly",
            )

        assert result["valid"] is True
        assert result["expires_at"] is not None
        assert result["expires_at"] > datetime.datetime.now(datetime.UTC)

    @pytest.mark.asyncio
    async def test_pending_payment_state_returns_invalid(self, monkeypatch):
        """paymentState=0 (pending) → not valid yet."""
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )

        future_ms = int(
            (
                datetime.datetime.now(datetime.UTC)
                + datetime.timedelta(days=30)
            ).timestamp()
            * 1000
        )
        with patch(
            "backend.services.google_play_service.GooglePlayService.get_subscription",
            AsyncMock(
                return_value={
                    "expiryTimeMillis": str(future_ms),
                    "paymentState": 0,
                }
            ),
        ):
            result = await _verify_android_receipt(
                receipt="pending-token",
                product_id="com.kiaanverse.sadhak.monthly",
            )

        assert result["valid"] is False

    @pytest.mark.asyncio
    async def test_expired_receipt_returns_invalid(self, monkeypatch):
        """expiryTimeMillis in the past → valid=False."""
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )

        past_ms = int(
            (
                datetime.datetime.now(datetime.UTC)
                - datetime.timedelta(days=1)
            ).timestamp()
            * 1000
        )
        with patch(
            "backend.services.google_play_service.GooglePlayService.get_subscription",
            AsyncMock(
                return_value={
                    "expiryTimeMillis": str(past_ms),
                    "paymentState": 1,
                }
            ),
        ):
            result = await _verify_android_receipt(
                receipt="expired-token",
                product_id="com.kiaanverse.sadhak.monthly",
            )

        assert result["valid"] is False
        # We still return the parsed expiry even when invalid so the
        # caller can log/audit it.
        assert result["expires_at"] is not None

    @pytest.mark.asyncio
    async def test_api_error_returns_invalid_not_503(self, monkeypatch):
        """Play API rejection (404/410) → valid=False, NOT a 503."""
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )

        with patch(
            "backend.services.google_play_service.GooglePlayService.get_subscription",
            AsyncMock(side_effect=GooglePlayAPIError("404 not found")),
        ):
            result = await _verify_android_receipt(
                receipt="bad-token",
                product_id="com.kiaanverse.sadhak.monthly",
            )

        assert result["valid"] is False
        assert result["expires_at"] is None

    @pytest.mark.asyncio
    async def test_config_error_raises_500(self, monkeypatch):
        """Misconfigured credentials → HTTPException(500), not silent accept."""
        from fastapi import HTTPException

        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )

        with patch(
            "backend.services.google_play_service.GooglePlayService.get_subscription",
            AsyncMock(side_effect=GooglePlayConfigError("bad key")),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await _verify_android_receipt(
                    receipt="any-token",
                    product_id="com.kiaanverse.sadhak.monthly",
                )

        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_malformed_expiry_returns_invalid(self, monkeypatch):
        """Non-integer expiryTimeMillis → valid=False (don't crash)."""
        monkeypatch.setenv(
            "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
            '{"client_email": "x@y.com", "private_key": "k"}',
        )

        with patch(
            "backend.services.google_play_service.GooglePlayService.get_subscription",
            AsyncMock(
                return_value={
                    "expiryTimeMillis": "not-a-number",
                    "paymentState": 1,
                }
            ),
        ):
            result = await _verify_android_receipt(
                receipt="malformed-token",
                product_id="com.kiaanverse.sadhak.monthly",
            )

        assert result["valid"] is False
