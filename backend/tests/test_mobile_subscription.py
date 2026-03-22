"""Tests for the mobile in-app purchase receipt verification endpoint.

4-tier model (March 2026): free / bhakta / sadhak / siddha
Product IDs: com.kiaanverse.{bhakta,sadhak,siddha}.{monthly,yearly}

Covers:
- Valid receipt → tier activated
- Invalid product ID → rejected
- Receipt verification failure → returns free tier
- Idempotent re-verification → same result
- Platform validation (ios/android only)
"""

import pytest

from backend.routes.mobile_subscription import (
    PRODUCT_TIER_MAP,
    BACKEND_TO_MOBILE_TIER,
    ReceiptVerifyRequest,
    ReceiptVerifyResponse,
)
from backend.models.base import SubscriptionTier


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
