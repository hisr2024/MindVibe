"""
Data Integrity Tests for Wisdom Journeys

Tests data consistency, validation, and integrity across:
- Journey templates
- Database models
- JSON schemas
- Enum values
"""

import json
from pathlib import Path

from tests.journeys.run_all_tests import (
    registry, TestContext,
    assert_equal, assert_true, assert_false, assert_in, assert_not_in,
    assert_length, assert_range
)


# ===========================================================================
# JOURNEY TEMPLATES DATA INTEGRITY
# ===========================================================================

@registry.register("data", "Journey templates JSON is valid")
def test_templates_json_valid():
    """Verify journey_templates.json is valid JSON."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    assert_true(isinstance(data, dict), "Should be a JSON object")
    assert_in("templates", data, "Should have 'templates' key")


@registry.register("data", "Journey templates have unique IDs")
def test_templates_unique_ids():
    """Verify all template IDs are unique."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    ids = [t["id"] for t in templates]
    unique_ids = set(ids)

    assert_equal(len(ids), len(unique_ids), "All IDs should be unique")


@registry.register("data", "Journey templates have unique slugs")
def test_templates_unique_slugs():
    """Verify all template slugs are unique."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    slugs = [t["slug"] for t in templates]
    unique_slugs = set(slugs)

    assert_equal(len(slugs), len(unique_slugs), "All slugs should be unique")


@registry.register("data", "Journey templates cover all six enemies")
def test_templates_cover_all_enemies():
    """Verify templates cover all six inner enemies (Sad-Ripu)."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])

    # Collect all enemy tags
    all_enemies = set()
    for t in templates:
        all_enemies.update(t.get("primary_enemy_tags", []))

    expected = {"kama", "krodha", "lobha", "moha", "mada", "matsarya"}
    assert_equal(all_enemies, expected, "Should cover all six enemies")


@registry.register("data", "Journey templates difficulty is 1-5")
def test_templates_difficulty_range():
    """Verify difficulty is within valid range."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])

    for t in templates:
        difficulty = t.get("difficulty", 0)
        assert_range(difficulty, 1, 5, f"Difficulty for '{t['title']}'")


@registry.register("data", "Journey templates duration is reasonable")
def test_templates_duration_range():
    """Verify duration days is within reasonable range."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])

    for t in templates:
        duration = t.get("duration_days", 0)
        assert_range(duration, 7, 30, f"Duration for '{t['title']}'")


@registry.register("data", "Journey templates have valid color themes")
def test_templates_color_themes():
    """Verify color themes are from allowed set."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])

    valid_colors = {
        "red", "orange", "amber", "yellow", "lime", "green", "emerald",
        "teal", "cyan", "sky", "blue", "indigo", "violet", "purple",
        "fuchsia", "pink", "rose", "slate", "gray", "zinc", "neutral", "stone"
    }

    for t in templates:
        color = t.get("color_theme", "")
        assert_in(color, valid_colors, f"Color for '{t['title']}'")


@registry.register("data", "Journey templates have valid icon names")
def test_templates_icon_names():
    """Verify icon names are non-empty strings."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])

    for t in templates:
        icon = t.get("icon_name", "")
        assert_true(len(icon) > 0, f"Icon name for '{t['title']}' should be non-empty")


@registry.register("data", "Free journey is the Transform Anger journey")
def test_free_journey_is_krodha():
    """Verify the free journey is Transform Anger (Krodha)."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    free_templates = [t for t in templates if t.get("is_free", False)]

    assert_length(free_templates, 1, "Exactly one free journey")

    free = free_templates[0]
    assert_in("krodha", free["primary_enemy_tags"], "Free journey should target krodha")


# ===========================================================================
# DATABASE MODEL INTEGRITY
# ===========================================================================

@registry.register("data", "UserJourneyStatus enum has correct values")
def test_user_journey_status_values():
    """Verify UserJourneyStatus enum has all required values."""
    from backend.models import UserJourneyStatus

    expected = ["ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"]

    for value in expected:
        assert_true(hasattr(UserJourneyStatus, value), f"Missing status: {value}")


@registry.register("data", "JourneyPace enum has correct values")
def test_journey_pace_values():
    """Verify JourneyPace enum has all required values."""
    from backend.models import JourneyPace

    expected = ["DAILY", "EVERY_OTHER_DAY", "WEEKLY"]

    for value in expected:
        assert_true(hasattr(JourneyPace, value), f"Missing pace: {value}")


@registry.register("data", "JourneyTone enum has correct values")
def test_journey_tone_values():
    """Verify JourneyTone enum has all required values."""
    from backend.models import JourneyTone

    expected = ["GENTLE", "DIRECT", "INSPIRING"]

    for value in expected:
        assert_true(hasattr(JourneyTone, value), f"Missing tone: {value}")


@registry.register("data", "SubscriptionTier enum includes all tiers")
def test_subscription_tier_values():
    """Verify SubscriptionTier enum has all required values."""
    from backend.models import SubscriptionTier

    expected = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]

    for value in expected:
        assert_true(hasattr(SubscriptionTier, value), f"Missing tier: {value}")


# ===========================================================================
# MIGRATION INTEGRITY
# ===========================================================================

@registry.register("data", "is_free migration exists and is valid SQL")
def test_is_free_migration():
    """Verify is_free migration exists and has correct SQL."""
    migration_path = Path(__file__).parent.parent.parent / "migrations" / "20260129_add_is_free_to_journey_templates.sql"

    assert_true(migration_path.exists(), "Migration file should exist")

    with open(migration_path) as f:
        sql = f.read()

    # Check for required statements
    assert_in("ALTER TABLE", sql.upper(), "Should have ALTER TABLE")
    assert_in("is_free", sql.lower(), "Should add is_free column")
    assert_in("BOOLEAN", sql.upper(), "Should be BOOLEAN type")
    assert_in("default false", sql.lower(), "Should default to false")


@registry.register("data", "is_free migration creates index")
def test_is_free_migration_index():
    """Verify is_free migration creates index for fast lookups."""
    migration_path = Path(__file__).parent.parent.parent / "migrations" / "20260129_add_is_free_to_journey_templates.sql"

    with open(migration_path) as f:
        sql = f.read()

    assert_in("CREATE INDEX", sql.upper(), "Should create index")
    assert_in("is_free", sql.lower(), "Index should be on is_free column")


# ===========================================================================
# GITA CORPUS DATA INTEGRITY
# ===========================================================================

@registry.register("data", "ENEMY_TAG_THEMES covers all six enemies")
def test_enemy_tag_themes_coverage():
    """Verify ENEMY_TAG_THEMES has entries for all enemies."""
    from backend.services.gita_corpus_adapter import ENEMY_TAG_THEMES

    expected = ["kama", "krodha", "lobha", "moha", "mada", "matsarya"]

    for enemy in expected:
        assert_in(enemy, ENEMY_TAG_THEMES, f"Should have themes for {enemy}")
        assert_true(len(ENEMY_TAG_THEMES[enemy]) > 0, f"Should have themes for {enemy}")


@registry.register("data", "VIRTUE_TAGS maps all enemies to virtues")
def test_virtue_tags_coverage():
    """Verify VIRTUE_TAGS has entries for all enemies."""
    from backend.services.gita_corpus_adapter import VIRTUE_TAGS

    expected = ["kama", "krodha", "lobha", "moha", "mada", "matsarya"]

    for enemy in expected:
        assert_in(enemy, VIRTUE_TAGS, f"Should have virtue for {enemy}")
        assert_true(len(VIRTUE_TAGS[enemy]) > 0, f"Should have virtue for {enemy}")


@registry.register("data", "CHAPTER_THEMES covers all 18 chapters")
def test_chapter_themes_coverage():
    """Verify CHAPTER_THEMES has entries for all 18 Gita chapters."""
    from backend.services.gita_corpus_adapter import CHAPTER_THEMES

    for chapter in range(1, 19):
        assert_in(chapter, CHAPTER_THEMES, f"Should have themes for chapter {chapter}")
        assert_true(len(CHAPTER_THEMES[chapter]) > 0, f"Should have themes for chapter {chapter}")


# ===========================================================================
# FRONTEND DATA CONSISTENCY
# ===========================================================================

@registry.register("data", "Frontend service has all API functions")
def test_frontend_service_functions():
    """Verify frontend service exports all required functions."""
    service_path = Path(__file__).parent.parent.parent / "services" / "journeysEnhancedService.ts"

    with open(service_path) as f:
        content = f.read()

    required_functions = [
        "getCatalog",
        "getJourneyAccess",
        "startJourneys",
        "getActiveJourneys",
        "getTodayAgenda",
        "getTodayStep",
        "completeStep",
        "pauseJourney",
        "resumeJourney",
        "abandonJourney",
        "getJourneyHistory",
    ]

    for func in required_functions:
        assert_in(func, content, f"Should export {func}")


@registry.register("data", "Frontend service has offline queue functions")
def test_frontend_offline_functions():
    """Verify frontend service has offline queue support."""
    service_path = Path(__file__).parent.parent.parent / "services" / "journeysEnhancedService.ts"

    with open(service_path) as f:
        content = f.read()

    offline_functions = [
        "queueJourneyStart",
        "getQueuedJourneys",
        "syncQueuedJourneys",
        "removeFromQueue",
    ]

    for func in offline_functions:
        assert_in(func, content, f"Should have offline function {func}")


@registry.register("data", "Frontend catalog component exists")
def test_frontend_catalog_component():
    """Verify frontend catalog component exists."""
    component_path = Path(__file__).parent.parent.parent / "app" / "journeys" / "JourneysCatalogClient.tsx"
    assert_true(component_path.exists(), "Catalog component should exist")


@registry.register("data", "Frontend today agenda component exists")
def test_frontend_today_component():
    """Verify frontend today agenda component exists."""
    component_path = Path(__file__).parent.parent.parent / "app" / "journeys" / "today" / "TodayAgendaClient.tsx"
    assert_true(component_path.exists(), "Today agenda component should exist")


@registry.register("data", "Frontend step view component exists")
def test_frontend_step_view_component():
    """Verify frontend step view component exists."""
    component_path = Path(__file__).parent.parent.parent / "app" / "journeys" / "components" / "StepView.tsx"
    assert_true(component_path.exists(), "Step view component should exist")


# ===========================================================================
# CONFIGURATION CONSISTENCY
# ===========================================================================

@registry.register("data", "Feature config has journey limits for all tiers")
def test_feature_config_limits():
    """Verify feature config defines limits for all tiers."""
    from backend.config.feature_config import get_wisdom_journeys_limit
    from backend.models import SubscriptionTier

    # Should not raise for any tier
    for tier in SubscriptionTier:
        limit = get_wisdom_journeys_limit(tier)
        assert_true(
            isinstance(limit, int),
            f"Limit for {tier.name} should be int, got {type(limit)}"
        )


@registry.register("data", "Feature config trial flags are consistent")
def test_feature_config_trial():
    """Verify trial flag configuration is consistent."""
    from backend.config.feature_config import is_wisdom_journeys_trial, get_wisdom_journeys_trial_days
    from backend.models import SubscriptionTier

    # Free tier should be trial
    assert_true(is_wisdom_journeys_trial(SubscriptionTier.FREE), "Free tier should be trial")
    assert_equal(get_wisdom_journeys_trial_days(SubscriptionTier.FREE), 3, "Free trial should be 3 days")

    # Paid tiers should not be trial
    assert_false(is_wisdom_journeys_trial(SubscriptionTier.BASIC), "Basic should not be trial")
    assert_false(is_wisdom_journeys_trial(SubscriptionTier.PREMIUM), "Premium should not be trial")
    assert_false(is_wisdom_journeys_trial(SubscriptionTier.ENTERPRISE), "Enterprise should not be trial")
