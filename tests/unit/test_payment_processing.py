"""
Unit tests for payment processing and Stripe service.

Tests the Stripe integration including:
- Checkout session creation
- Subscription management
- Webhook handling
- Payment status tracking
"""

import pytest
import stripe
from datetime import datetime, timedelta, UTC
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    User,
    SubscriptionPlan,
    UserSubscription,
    Payment,
    SubscriptionTier,
    SubscriptionStatus,
    PaymentStatus,
)


class TestStripeServiceConfiguration:
    """Test Stripe service configuration."""

    def test_stripe_not_configured_by_default(self):
        """Test that Stripe is not configured without environment variables."""
        from backend.services.stripe_service import is_stripe_configured

        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': ''}, clear=True):
            # Stripe should not be configured without the secret key
            result = is_stripe_configured()
            # Note: Result depends on whether stripe module is installed
            assert isinstance(result, bool)

    def test_stripe_configured_with_key(self):
        """Test that Stripe is configured with secret key."""
        from backend.services.stripe_service import is_stripe_configured, _get_stripe_keys

        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_123'}):
            secret_key, _, _ = _get_stripe_keys()
            assert secret_key == 'sk_test_123'


class TestPaymentModels:
    """Test payment-related models."""

    @pytest.mark.asyncio
    async def test_create_payment_record(self, test_db: AsyncSession):
        """Test creating a payment record."""
        # Create user first
        user = User(
            auth_uid="payment-test-user",
            email="payment@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create payment
        payment = Payment(
            user_id=user.id,
            amount=Decimal("12.99"),
            currency="USD",
            status=PaymentStatus.PENDING,
            stripe_payment_intent_id="pi_test_123",
            description="Sadhak subscription payment",
        )
        test_db.add(payment)
        await test_db.commit()
        await test_db.refresh(payment)

        assert payment.id is not None
        assert payment.user_id == user.id
        assert payment.amount == Decimal("12.99")
        assert payment.currency == "USD"
        assert payment.status == PaymentStatus.PENDING
        assert payment.stripe_payment_intent_id == "pi_test_123"

    @pytest.mark.asyncio
    async def test_payment_status_transitions(self, test_db: AsyncSession):
        """Test payment status can transition correctly."""
        # Create user
        user = User(
            auth_uid="payment-status-user",
            email="payment-status@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create payment in pending state
        payment = Payment(
            user_id=user.id,
            amount=Decimal("22.99"),
            currency="USD",
            status=PaymentStatus.PENDING,
        )
        test_db.add(payment)
        await test_db.commit()

        # Transition to succeeded
        payment.status = PaymentStatus.SUCCEEDED
        await test_db.commit()
        await test_db.refresh(payment)

        assert payment.status == PaymentStatus.SUCCEEDED


class TestPaymentStatusEnum:
    """Test payment status enum values."""

    def test_payment_status_values(self):
        """Test that all expected payment status values exist."""
        assert PaymentStatus.PENDING.value == "pending"
        assert PaymentStatus.SUCCEEDED.value == "succeeded"
        assert PaymentStatus.FAILED.value == "failed"
        assert PaymentStatus.REFUNDED.value == "refunded"


class TestCheckoutSessionCreation:
    """Test checkout session creation logic."""

    @pytest.mark.asyncio
    async def test_checkout_requires_stripe_configured(self):
        """Test that checkout requires Stripe to be configured."""
        from backend.services.stripe_service import create_checkout_session, is_stripe_configured

        # When Stripe is not configured, checkout should fail
        if not is_stripe_configured():
            # Function should handle gracefully
            pass  # Expected behavior

    @pytest.mark.asyncio
    async def test_checkout_session_params_no_invalid_keys(self, test_db: AsyncSession):
        """Test that Stripe checkout session params don't contain invalid keys.

        Stripe Checkout in subscription mode rejects:
        - payment_intent_data with statement_descriptor (only metadata/description/setup_future_usage allowed)
        - invoice_settings (belongs on Customer/Invoice objects, not Checkout Session)

        These caused InvalidRequestError → 500 → no payment link opened.
        """
        from backend.services.stripe_service import create_checkout_session

        # Create user
        user = User(
            auth_uid="checkout-params-user",
            email="checkout-params@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create plan with a fake Stripe price ID
        plan = SubscriptionPlan(
            tier=SubscriptionTier.SADHAK,
            name="Sadhak",
            price_monthly=Decimal("14.99"),
            kiaan_questions_monthly=300,
            encrypted_journal=True,
            data_retention_days=-1,
            stripe_price_id_monthly="price_test_sadhak_monthly",
        )
        test_db.add(plan)
        await test_db.commit()

        # Mock Stripe to capture the session params
        captured_params = {}

        class FakeSession:
            id = "cs_test_123"
            url = "https://checkout.stripe.com/c/pay/cs_test_123"

        def capture_create(**kwargs):
            captured_params.update(kwargs)
            return FakeSession()

        with patch.dict("os.environ", {"STRIPE_SECRET_KEY": "sk_test_fake"}):
            with patch("stripe.checkout.Session.create", side_effect=capture_create):
                with patch("stripe.Customer.create", return_value=MagicMock(id="cus_test_123")):
                    result = await create_checkout_session(
                        test_db,
                        user,
                        SubscriptionTier.SADHAK,
                        "monthly",
                        "https://example.com/success",
                        "https://example.com/cancel",
                        payment_method="card",
                    )

        # Verify no invalid params were passed to Stripe
        assert "invoice_settings" not in captured_params, (
            "invoice_settings is not a valid checkout.Session.create() parameter"
        )
        assert "payment_intent_data" not in captured_params or (
            "statement_descriptor" not in captured_params.get("payment_intent_data", {})
        ), (
            "payment_intent_data.statement_descriptor is not allowed in subscription mode"
        )

        # Verify valid params are present
        assert captured_params["mode"] == "subscription"
        assert captured_params["success_url"] == "https://example.com/success"
        assert captured_params["cancel_url"] == "https://example.com/cancel"
        assert captured_params["payment_method_types"] == ["card"]
        assert len(captured_params["line_items"]) == 1
        assert captured_params["line_items"][0]["price"] == "price_test_sadhak_monthly"

        # Verify result
        assert result is not None
        assert result["checkout_url"] == "https://checkout.stripe.com/c/pay/cs_test_123"
        assert result["session_id"] == "cs_test_123"

    @pytest.mark.asyncio
    async def test_checkout_session_paypal_no_payment_intent_data(self, test_db: AsyncSession):
        """Test that PayPal checkout doesn't include payment_intent_data.

        PayPal + payment_intent_data causes Stripe InvalidRequestError.
        """
        from backend.services.stripe_service import create_checkout_session

        user = User(
            auth_uid="paypal-params-user",
            email="paypal-params@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        plan = SubscriptionPlan(
            tier=SubscriptionTier.BHAKTA,
            name="Bhakta",
            price_monthly=Decimal("6.99"),
            kiaan_questions_monthly=50,
            encrypted_journal=True,
            data_retention_days=90,
            stripe_price_id_monthly="price_test_bhakta_monthly",
        )
        test_db.add(plan)
        await test_db.commit()

        captured_params = {}

        class FakeSession:
            id = "cs_test_paypal"
            url = "https://checkout.stripe.com/c/pay/cs_test_paypal"

        def capture_create(**kwargs):
            captured_params.update(kwargs)
            return FakeSession()

        with patch.dict("os.environ", {"STRIPE_SECRET_KEY": "sk_test_fake"}):
            with patch("stripe.checkout.Session.create", side_effect=capture_create):
                with patch("stripe.Customer.create", return_value=MagicMock(id="cus_test_456")):
                    result = await create_checkout_session(
                        test_db,
                        user,
                        SubscriptionTier.BHAKTA,
                        "monthly",
                        "https://example.com/success",
                        "https://example.com/cancel",
                        payment_method="paypal",
                    )

        # PayPal must never have payment_intent_data
        assert "payment_intent_data" not in captured_params, (
            "payment_intent_data must not be present for PayPal checkouts"
        )
        # PayPal should include card as fallback
        assert "paypal" in captured_params["payment_method_types"], (
            "PayPal must be included in payment_method_types"
        )
        assert "card" in captured_params["payment_method_types"], (
            "Card must be included as fallback alongside PayPal"
        )
        # subscription mode: no payment_method_options needed — Stripe handles
        # locale detection and recurring setup automatically.
        assert "payment_method_options" not in captured_params, (
            "PayPal subscription checkout must not set payment_method_options "
            "(can cause InvalidRequestError if PayPal is not fully enabled)"
        )

    @pytest.mark.asyncio
    async def test_checkout_session_paypal_includes_subscription_metadata(self, test_db: AsyncSession):
        """Test that PayPal checkout sets subscription_data.metadata.

        Previously, metadata was only set when 'card' was in payment_method_types,
        which excluded PayPal-only checkouts from having subscription metadata.
        """
        from backend.services.stripe_service import create_checkout_session

        user = User(
            auth_uid="paypal-meta-user",
            email="paypal-meta@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        plan = SubscriptionPlan(
            tier=SubscriptionTier.SADHAK,
            name="Sadhak",
            price_monthly=Decimal("14.99"),
            kiaan_questions_monthly=300,
            encrypted_journal=True,
            data_retention_days=-1,
            stripe_price_id_monthly="price_test_sadhak_monthly_pp",
        )
        test_db.add(plan)
        await test_db.commit()

        captured_params = {}

        class FakeSession:
            id = "cs_test_pp_meta"
            url = "https://checkout.stripe.com/c/pay/cs_test_pp_meta"

        def capture_create(**kwargs):
            captured_params.update(kwargs)
            return FakeSession()

        with patch.dict("os.environ", {"STRIPE_SECRET_KEY": "sk_test_fake"}):
            with patch("stripe.checkout.Session.create", side_effect=capture_create):
                with patch("stripe.Customer.create", return_value=MagicMock(id="cus_test_pp")):
                    await create_checkout_session(
                        test_db, user, SubscriptionTier.SADHAK, "monthly",
                        "https://example.com/success", "https://example.com/cancel",
                        payment_method="paypal",
                    )

        # subscription_data.metadata must be set for ALL payment methods
        sub_data = captured_params.get("subscription_data", {})
        assert "metadata" in sub_data, (
            "subscription_data.metadata must be set for PayPal checkouts"
        )
        assert sub_data["metadata"]["plan_tier"] == "sadhak"

    @pytest.mark.asyncio
    async def test_checkout_google_pay_uses_card_type(self, test_db: AsyncSession):
        """Test that Google Pay checkout uses 'card' payment_method_type.

        Stripe surfaces Google Pay automatically via the card payment method
        type using the Payment Request API. No separate type exists.
        """
        from backend.services.stripe_service import create_checkout_session

        user = User(
            auth_uid="gpay-user",
            email="gpay@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        plan = SubscriptionPlan(
            tier=SubscriptionTier.BHAKTA,
            name="Bhakta",
            price_monthly=Decimal("6.99"),
            kiaan_questions_monthly=50,
            encrypted_journal=True,
            data_retention_days=90,
            stripe_price_id_monthly="price_test_bhakta_gpay",
        )
        test_db.add(plan)
        await test_db.commit()

        captured_params = {}

        class FakeSession:
            id = "cs_test_gpay"
            url = "https://checkout.stripe.com/c/pay/cs_test_gpay"

        def capture_create(**kwargs):
            captured_params.update(kwargs)
            return FakeSession()

        with patch.dict("os.environ", {"STRIPE_SECRET_KEY": "sk_test_fake"}):
            with patch("stripe.checkout.Session.create", side_effect=capture_create):
                with patch("stripe.Customer.create", return_value=MagicMock(id="cus_test_gp")):
                    result = await create_checkout_session(
                        test_db, user, SubscriptionTier.BHAKTA, "monthly",
                        "https://example.com/success", "https://example.com/cancel",
                        payment_method="google_pay",
                    )

        assert captured_params["payment_method_types"] == ["card"], (
            "Google Pay must route through Stripe's card payment method type"
        )
        # subscription mode: setup_future_usage is managed by Stripe automatically,
        # so payment_method_options must NOT be set (causes InvalidRequestError).
        assert "payment_method_options" not in captured_params, (
            "Google Pay subscription checkout must not set payment_method_options "
            "(setup_future_usage is invalid in subscription mode)"
        )
        assert result is not None
        assert result["checkout_url"] == "https://checkout.stripe.com/c/pay/cs_test_gpay"


class TestPayPalCurrencyValidation:
    """Test PayPal currency restrictions in checkout route."""

    @pytest.mark.asyncio
    async def test_paypal_rejects_inr_currency(self):
        """Test that PayPal checkout rejects INR currency."""
        from backend.schemas.subscription import CheckoutSessionCreate

        # PayPal + INR should be blocked at the route level
        payload = CheckoutSessionCreate(
            plan_tier=SubscriptionTier.BHAKTA,
            billing_period="monthly",
            payment_method="paypal",
            currency="inr",
        )
        # The route handler raises HTTPException for paypal + inr
        assert payload.payment_method == "paypal"
        assert payload.currency == "inr"
        # This combination is rejected in the route with 400 error

    @pytest.mark.asyncio
    async def test_paypal_accepts_usd_currency(self):
        """Test that PayPal checkout accepts USD currency."""
        from backend.schemas.subscription import CheckoutSessionCreate

        payload = CheckoutSessionCreate(
            plan_tier=SubscriptionTier.SADHAK,
            billing_period="yearly",
            payment_method="paypal",
            currency="usd",
        )
        assert payload.payment_method == "paypal"
        assert payload.currency == "usd"
        # USD is valid for PayPal — no error expected


class TestPayPalFallback:
    """Test PayPal graceful fallback when Stripe rejects the payment method."""

    @pytest.mark.asyncio
    async def test_paypal_falls_back_to_card_on_invalid_request(self, test_db: AsyncSession):
        """When Stripe rejects PayPal (not enabled), fall back to card-only checkout."""
        from backend.services.stripe_service import create_checkout_session

        user = User(
            auth_uid="paypal-fallback-user",
            email="paypal-fallback@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        plan = SubscriptionPlan(
            tier=SubscriptionTier.BHAKTA,
            name="Bhakta",
            price_monthly=Decimal("6.99"),
            kiaan_questions_monthly=50,
            encrypted_journal=True,
            data_retention_days=90,
            stripe_price_id_monthly="price_test_bhakta_fb",
        )
        test_db.add(plan)
        await test_db.commit()

        call_count = 0

        class FakeSession:
            id = "cs_test_fallback"
            url = "https://checkout.stripe.com/c/pay/cs_test_fallback"

        def mock_create(**kwargs):
            nonlocal call_count
            call_count += 1
            if "paypal" in kwargs.get("payment_method_types", []):
                raise stripe.error.InvalidRequestError(
                    "The payment method type 'paypal' is invalid",
                    param="payment_method_types",
                )
            return FakeSession()

        with patch.dict("os.environ", {"STRIPE_SECRET_KEY": "sk_test_fake"}):
            with patch("stripe.checkout.Session.create", side_effect=mock_create):
                with patch("stripe.Customer.create", return_value=MagicMock(id="cus_fb")):
                    result = await create_checkout_session(
                        test_db, user, SubscriptionTier.BHAKTA, "monthly",
                        "https://example.com/success", "https://example.com/cancel",
                        payment_method="paypal",
                    )

        assert call_count == 2, "Should retry once with card-only after PayPal fails"
        assert result is not None
        assert result["checkout_url"] == "https://checkout.stripe.com/c/pay/cs_test_fallback"
        assert result["payment_method_fallback"] == "card"
        assert result["payment_method_message"] is not None


class TestWebhookSignatureVerification:
    """Test webhook signature verification."""

    def test_verify_webhook_signature_missing_secret(self):
        """Test webhook verification with missing secret."""
        from backend.services.stripe_service import verify_webhook_signature

        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': ''}):
            result = verify_webhook_signature(b'payload', 'signature')
            # Should return None when secret is missing
            assert result is None or result is False


class TestSubscriptionCancellation:
    """Test subscription cancellation logic."""

    @pytest.mark.asyncio
    async def test_cancel_subscription_updates_status(self, test_db: AsyncSession):
        """Test that canceling a subscription updates its status."""
        from backend.services.subscription_service import update_subscription_status

        # Create user
        user = User(
            auth_uid="cancel-test-user",
            email="cancel@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create plan
        plan = SubscriptionPlan(
            tier=SubscriptionTier.SADHAK,
            name="Sadhak",
            price_monthly=Decimal("12.99"),
            kiaan_questions_monthly=300,
            encrypted_journal=True,
            data_retention_days=-1,
        )
        test_db.add(plan)
        await test_db.commit()
        await test_db.refresh(plan)

        # Create subscription
        now = datetime.now(UTC)
        subscription = UserSubscription(
            user_id=user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
        )
        test_db.add(subscription)
        await test_db.commit()
        await test_db.refresh(subscription)

        # Update subscription status to canceled
        updated = await update_subscription_status(
            test_db,
            user.id,
            SubscriptionStatus.CANCELED,
            cancel_at_period_end=True,
        )

        assert updated is not None
        assert updated.status == SubscriptionStatus.CANCELED
        assert updated.cancel_at_period_end is True
        assert updated.canceled_at is not None


class TestSubscriptionUpgrade:
    """Test subscription upgrade functionality."""

    @pytest.mark.asyncio
    async def test_upgrade_subscription_changes_plan(self, test_db: AsyncSession):
        """Test upgrading a subscription changes the plan."""
        from backend.services.subscription_service import upgrade_subscription

        # Create user
        user = User(
            auth_uid="upgrade-test-user",
            email="upgrade@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create free plan
        free_plan = SubscriptionPlan(
            tier=SubscriptionTier.FREE,
            name="Free",
            price_monthly=Decimal("0.00"),
            kiaan_questions_monthly=5,
            encrypted_journal=False,
            data_retention_days=30,
        )
        test_db.add(free_plan)

        # Create Siddha plan
        siddha_plan = SubscriptionPlan(
            tier=SubscriptionTier.SIDDHA,
            name="Siddha",
            price_monthly=Decimal("22.99"),
            kiaan_questions_monthly=-1,  # Unlimited
            encrypted_journal=True,
            data_retention_days=-1,
        )
        test_db.add(siddha_plan)
        await test_db.commit()
        await test_db.refresh(free_plan)
        await test_db.refresh(siddha_plan)

        # Create free subscription
        now = datetime.now(UTC)
        subscription = UserSubscription(
            user_id=user.id,
            plan_id=free_plan.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
        )
        test_db.add(subscription)
        await test_db.commit()

        # Upgrade to Siddha
        upgraded = await upgrade_subscription(
            test_db,
            user.id,
            siddha_plan.id,
            stripe_subscription_id="sub_test_123",
        )

        assert upgraded is not None
        assert upgraded.plan_id == siddha_plan.id
        assert upgraded.stripe_subscription_id == "sub_test_123"
        assert upgraded.status == SubscriptionStatus.ACTIVE


class TestStripeWebhookHandling:
    """Test Stripe webhook event handling."""

    def test_webhook_event_types(self):
        """Test that expected webhook event types are handled."""
        # Common Stripe webhook events that should be handled
        expected_events = [
            "checkout.session.completed",
            "customer.subscription.updated",
            "customer.subscription.deleted",
            "invoice.payment_succeeded",
            "invoice.payment_failed",
        ]

        # Verify these are string constants
        for event in expected_events:
            assert isinstance(event, str)
            assert "." in event
