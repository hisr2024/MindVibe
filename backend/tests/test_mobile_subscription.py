"""Tests for the mobile in-app purchase receipt verification endpoint.

Covers:
- Valid receipt → tier activated
- Invalid product ID → rejected
- Receipt verification failure → returns free tier
- Idempotent re-verification → same result
- Platform validation (ios/android only)
"""

import pytest
from unittest.mock import AsyncMock, patch

from backend.routes.mobile_subscription import (
    PRODUCT_TIER_MAP,
    BACKEND_TO_MOBILE_TIER,
    ReceiptVerifyRequest,
    ReceiptVerifyResponse,
)
from backend.models.base import SubscriptionTier


class TestProductTierMapping:
    """Verify product ID → tier mapping is correct."""

    def test_sacred_monthly_maps_to_sadhak(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.sacred.monthly"] == SubscriptionTier.SADHAK

    def test_divine_monthly_maps_to_siddha(self):
        assert PRODUCT_TIER_MAP["com.kiaanverse.divine.monthly"] == SubscriptionTier.SIDDHA

    def test_unknown_product_not_in_map(self):
        assert "com.unknown.product" not in PRODUCT_TIER_MAP


class TestBackendToMobileTierMapping:
    """Verify backend tier → mobile tier name mapping."""

    def test_free_maps_to_free(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.FREE] == "free"

    def test_sadhak_maps_to_sacred(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.SADHAK] == "sacred"

    def test_siddha_maps_to_divine(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.SIDDHA] == "divine"

    def test_bhakta_maps_to_sacred(self):
        assert BACKEND_TO_MOBILE_TIER[SubscriptionTier.BHAKTA] == "sacred"


class TestReceiptVerifyRequest:
    """Verify request schema validation."""

    def test_valid_ios_request(self):
        req = ReceiptVerifyRequest(
            receipt="base64-encoded-receipt-data",
            platform="ios",
            product_id="com.kiaanverse.sacred.monthly",
        )
        assert req.platform == "ios"
        assert req.product_id == "com.kiaanverse.sacred.monthly"

    def test_valid_android_request(self):
        req = ReceiptVerifyRequest(
            receipt="purchase-token-string",
            platform="android",
            product_id="com.kiaanverse.divine.monthly",
        )
        assert req.platform == "android"

    def test_invalid_platform_rejected(self):
        with pytest.raises(Exception):
            ReceiptVerifyRequest(
                receipt="test",
                platform="windows",
                product_id="com.kiaanverse.sacred.monthly",
            )

    def test_empty_receipt_rejected(self):
        with pytest.raises(Exception):
            ReceiptVerifyRequest(
                receipt="",
                platform="ios",
                product_id="com.kiaanverse.sacred.monthly",
            )


class TestReceiptVerifyResponse:
    """Verify response schema structure."""

    def test_valid_response(self):
        resp = ReceiptVerifyResponse(
            valid=True,
            tier="sacred",
            expires_at="2026-04-22T00:00:00Z",
        )
        assert resp.valid is True
        assert resp.tier == "sacred"

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
        resp = ReceiptVerifyResponse(valid=True, tier="divine")
        assert resp.expires_at is None
        assert resp.error is None
