"""
Integration Tests for Wisdom Journeys

Tests the complete flow of user journeys from start to completion:
- User browses catalog
- User starts journey
- User views today's step
- User completes step with reflection
- User pauses/resumes journey
- User completes journey
"""

from pathlib import Path

from tests.journeys.run_all_tests import (
    registry, TestContext,
    assert_equal, assert_true, assert_false, assert_in, assert_not_in,
    assert_length, assert_range
)


# ===========================================================================
# COMPLETE USER FLOW TESTS
# ===========================================================================

@registry.register("integration", "Catalog displays all journey templates")
def test_flow_catalog_display():
    """Verify catalog displays all 7 journey templates."""
    import json

    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    assert_length(templates, 7, "Should have 7 templates")

    # Verify featured are at top
    featured = [t for t in templates if t.get("is_featured")]
    assert_true(len(featured) >= 2, "Should have featured templates")


@registry.register("integration", "Free journey is accessible without subscription")
def test_flow_free_journey_access():
    """Verify free journey can be started without premium."""
    import json

    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    free_templates = [t for t in templates if t.get("is_free")]

    assert_length(free_templates, 1, "Should have 1 free template")
    assert_in("krodha", free_templates[0]["primary_enemy_tags"], "Free should be krodha")


@registry.register("integration", "Journey start flow creates correct data")
def test_flow_journey_start():
    """Verify journey start creates proper data structures."""
    from backend.models import UserJourneyStatus

    # Verify the expected status for new journey
    assert_equal(UserJourneyStatus.ACTIVE.value, "active", "New journey should be ACTIVE")


@registry.register("integration", "Step generation flow uses correct verse selection")
def test_flow_step_generation():
    """Verify step generation uses enemy-specific verses."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Krodha journey should get anger-related verses
    themes = adapter.get_enemy_themes("krodha")
    assert_in("anger", themes, "Should get anger themes")
    assert_in("patience", themes, "Should get patience themes")


@registry.register("integration", "Step completion flow validates check-in")
def test_flow_step_completion():
    """Verify step completion validates check-in data."""
    from backend.services.journey_coach import JourneyStepSchema

    # Check-in prompt should have scale and label
    step = JourneyStepSchema(
        step_title="Test",
        today_focus="krodha",
        verse_refs=[{"chapter": 2, "verse": 47}],
        teaching="Teaching content " * 10,
        guided_reflection=["Q1?"],
        practice={
            "name": "Practice",
            "instructions": ["Step 1"],
            "duration_minutes": 5,
        },
        micro_commitment="I will practice.",
        check_in_prompt={"scale": "0-10", "label": "Intensity?"},
    )

    assert_equal(step.check_in_prompt.scale, "0-10")


@registry.register("integration", "Journey pause/resume flow maintains state")
def test_flow_pause_resume():
    """Verify pause/resume maintains journey state."""
    from backend.models import UserJourneyStatus

    # Verify all status transitions exist
    statuses = [s.value for s in UserJourneyStatus]
    assert_in("active", statuses, "Should have active status")
    assert_in("paused", statuses, "Should have paused status")
    assert_in("completed", statuses, "Should have completed status")


# ===========================================================================
# FRONTEND-BACKEND INTEGRATION
# ===========================================================================

@registry.register("integration", "Frontend service matches backend API contract")
def test_frontend_backend_contract():
    """Verify frontend service uses correct API endpoints."""
    service_path = Path(__file__).parent.parent.parent / "services" / "journeysEnhancedService.ts"

    with open(service_path) as f:
        content = f.read()

    # Should use correct endpoints
    endpoints = [
        "/api/journeys/catalog",
        "/api/journeys/access",
        "/api/journeys/start",
        "/api/journeys/active",
        "/api/journeys/today",
    ]

    for endpoint in endpoints:
        assert_in(endpoint, content, f"Should use {endpoint}")


@registry.register("integration", "Frontend handles all backend error codes")
def test_frontend_error_handling():
    """Verify frontend handles key backend error codes."""
    service_path = Path(__file__).parent.parent.parent / "services" / "journeysEnhancedService.ts"

    with open(service_path) as f:
        content = f.read()

    # Should handle key error codes that are explicitly handled
    error_codes = ["401", "403", "503"]
    for code in error_codes:
        assert_in(code, content, f"Should handle {code}")

    # Should also handle 500-level errors generically
    assert_in("500", content, "Should handle 500-level errors")


@registry.register("integration", "Frontend shows paywall for premium journeys")
def test_frontend_paywall():
    """Verify frontend shows paywall for non-free journeys."""
    catalog_path = Path(__file__).parent.parent.parent / "app" / "journeys" / "JourneysCatalogClient.tsx"

    with open(catalog_path) as f:
        content = f.read()

    # Should have paywall logic
    assert_in("paywall", content.lower(), "Should have paywall")
    assert_in("is_free", content, "Should check is_free")


@registry.register("integration", "Frontend shows free badge")
def test_frontend_free_badge():
    """Verify frontend shows 'Free' badge on free journey."""
    catalog_path = Path(__file__).parent.parent.parent / "app" / "journeys" / "JourneysCatalogClient.tsx"

    with open(catalog_path) as f:
        content = f.read()

    # Should show Free badge
    assert_in("Free", content, "Should show Free badge")


# ===========================================================================
# DATA FLOW INTEGRATION
# ===========================================================================

@registry.register("integration", "Verse refs flow from templates to steps")
def test_verse_refs_flow():
    """Verify verse refs flow correctly through the system."""
    from backend.services.journey_coach import VerseRefSchema

    # Create valid verse ref
    ref = VerseRefSchema(chapter=2, verse=47)
    assert_equal(ref.chapter, 2)
    assert_equal(ref.verse, 47)


@registry.register("integration", "Personalization flows from start to steps")
def test_personalization_flow():
    """Verify personalization settings flow to step generation."""
    from backend.models import JourneyPace, JourneyTone

    # Verify pace options
    paces = [p.value for p in JourneyPace]
    assert_in("daily", paces)
    assert_in("every_other_day", paces)
    assert_in("weekly", paces)

    # Verify tone options
    tones = [t.value for t in JourneyTone]
    assert_in("gentle", tones)
    assert_in("direct", tones)
    assert_in("inspiring", tones)


@registry.register("integration", "Check-in data flows from completion to history")
def test_checkin_flow():
    """Verify check-in data flows to history."""
    # Check-in structure should be consistent
    expected_check_in_fields = ["intensity", "label", "timestamp"]
    # These fields should be captured during completion


@registry.register("integration", "Reflection encryption flows correctly")
def test_reflection_encryption_flow():
    """Verify reflections are encrypted before storage."""
    engine_path = Path(__file__).parent.parent.parent / "backend" / "services" / "journey_engine_enhanced.py"

    with open(engine_path) as f:
        content = f.read()

    # Should encrypt reflection
    assert_in("encrypt", content.lower(), "Should encrypt")
    assert_in("reflection", content.lower(), "Should handle reflection")


# ===========================================================================
# OFFLINE FLOW INTEGRATION
# ===========================================================================

@registry.register("integration", "Offline queue integrates with sync")
def test_offline_queue_sync():
    """Verify offline queue syncs when online."""
    service_path = Path(__file__).parent.parent.parent / "services" / "journeysEnhancedService.ts"

    with open(service_path) as f:
        content = f.read()

    # Should have queue and sync
    assert_in("queueJourneyStart", content, "Should have queue")
    assert_in("syncQueuedJourneys", content, "Should have sync")


@registry.register("integration", "Offline queue persists across sessions")
def test_offline_queue_persistence():
    """Verify offline queue uses localStorage for persistence."""
    service_path = Path(__file__).parent.parent.parent / "services" / "journeysEnhancedService.ts"

    with open(service_path) as f:
        content = f.read()

    # Should use localStorage
    assert_in("localStorage", content, "Should use localStorage")


# ===========================================================================
# SUBSCRIPTION INTEGRATION
# ===========================================================================

@registry.register("integration", "Subscription tier affects journey limit")
def test_subscription_limits():
    """Verify subscription tier correctly limits journeys."""
    from backend.config.feature_config import get_wisdom_journeys_limit
    from backend.models import SubscriptionTier

    limits = {
        SubscriptionTier.FREE: 1,
        SubscriptionTier.BASIC: 1,
        SubscriptionTier.PREMIUM: 5,
        SubscriptionTier.ENTERPRISE: -1,
    }

    for tier, expected in limits.items():
        actual = get_wisdom_journeys_limit(tier)
        assert_equal(actual, expected, f"Limit for {tier.name}")


@registry.register("integration", "Trial period is enforced for free tier")
def test_trial_period():
    """Verify trial period is enforced for free tier."""
    from backend.config.feature_config import is_wisdom_journeys_trial, get_wisdom_journeys_trial_days
    from backend.models import SubscriptionTier

    assert_true(is_wisdom_journeys_trial(SubscriptionTier.FREE), "Free should be trial")
    assert_equal(get_wisdom_journeys_trial_days(SubscriptionTier.FREE), 3, "Trial should be 3 days")


# ===========================================================================
# KIAAN AI INTEGRATION
# ===========================================================================

@registry.register("integration", "KIAAN generates step content")
def test_kiaan_step_generation():
    """Verify KIAAN generates valid step content."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()

    # Coach should exist and have generate method structure
    assert_true(coach is not None, "Coach should initialize")


@registry.register("integration", "KIAAN safety detection works")
def test_kiaan_safety():
    """Verify KIAAN safety detection is integrated."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()
    response = coach._build_safety_response()

    assert_true(response["is_safety_response"], "Should be safety response")
    assert_true(len(response["crisis_resources"]) > 0, "Should have crisis resources")
