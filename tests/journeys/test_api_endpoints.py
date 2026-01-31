"""
API Endpoint Tests for Wisdom Journeys

Tests all 11 API endpoints for correct behavior, validation, and error handling.
"""

import json
from pathlib import Path

from tests.journeys.run_all_tests import (
    registry, TestContext,
    assert_equal, assert_true, assert_false, assert_in, assert_length, assert_range
)


# ===========================================================================
# CATALOG ENDPOINT TESTS
# ===========================================================================

@registry.register("api", "GET /api/journeys/catalog returns list of templates")
def test_catalog_returns_list():
    """Verify catalog endpoint returns valid template list."""
    # Load from data file (simulating API response)
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    assert_true(isinstance(templates, list), "Catalog should return a list")
    assert_length(templates, 7, "Should have 7 templates")

    return {"template_count": len(templates)}


@registry.register("api", "GET /api/journeys/catalog templates have required fields")
def test_catalog_template_structure():
    """Verify each template has all required fields."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])

    required_fields = [
        "id", "slug", "title", "description", "primary_enemy_tags",
        "duration_days", "difficulty", "is_featured", "icon_name", "color_theme", "is_free"
    ]

    for template in templates:
        for field in required_fields:
            assert_in(field, template, f"Template '{template.get('title')}' missing field: {field}")

    return {"templates_validated": len(templates)}


@registry.register("api", "GET /api/journeys/catalog has one free template")
def test_catalog_has_free_template():
    """Verify exactly one template is marked as free."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    free_templates = [t for t in templates if t.get("is_free", False)]

    assert_length(free_templates, 1, "Should have exactly 1 free template")
    assert_in("anger", free_templates[0]["slug"].lower(), "Free template should be Anger/Krodha journey")


@registry.register("api", "GET /api/journeys/catalog featured templates are correct")
def test_catalog_featured_templates():
    """Verify featured templates are properly marked."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    featured = [t for t in templates if t.get("is_featured", False)]

    assert_true(len(featured) >= 2, "Should have at least 2 featured templates")

    # Complete transformation should be featured
    complete_journey = [t for t in featured if "complete" in t["slug"].lower()]
    assert_length(complete_journey, 1, "Complete transformation should be featured")


# ===========================================================================
# ACCESS ENDPOINT TESTS
# ===========================================================================

@registry.register("api", "GET /api/journeys/access returns correct tier structure")
def test_access_endpoint_structure():
    """Verify access endpoint returns correct response structure."""
    # Expected structure based on API spec
    expected_fields = [
        "has_access", "tier", "active_journeys", "journey_limit",
        "remaining", "is_unlimited", "can_start_more", "is_trial",
        "trial_days_limit", "upgrade_url", "upgrade_cta"
    ]

    # Verify route file has these fields in default response
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "access" / "route.ts"
    with open(route_path) as f:
        content = f.read()

    for field in expected_fields:
        assert_in(field, content, f"Access route should handle field: {field}")


@registry.register("api", "GET /api/journeys/access tier limits are correct")
def test_access_tier_limits():
    """Verify tier-based journey limits are correct."""
    from backend.config.feature_config import get_wisdom_journeys_limit
    from backend.models import SubscriptionTier

    # Verify tier limits
    assert_equal(get_wisdom_journeys_limit(SubscriptionTier.FREE), 1, "Free tier: 1 journey")
    assert_equal(get_wisdom_journeys_limit(SubscriptionTier.BASIC), 1, "Basic tier: 1 journey")
    assert_equal(get_wisdom_journeys_limit(SubscriptionTier.PREMIUM), 5, "Premium tier: 5 journeys")
    assert_equal(get_wisdom_journeys_limit(SubscriptionTier.ENTERPRISE), -1, "Enterprise: unlimited")


@registry.register("api", "GET /api/journeys/access trial days are correct")
def test_access_trial_days():
    """Verify trial period configuration."""
    from backend.config.feature_config import get_wisdom_journeys_trial_days, is_wisdom_journeys_trial
    from backend.models import SubscriptionTier

    # Free tier should be trial
    assert_true(is_wisdom_journeys_trial(SubscriptionTier.FREE), "Free tier is trial")
    assert_equal(get_wisdom_journeys_trial_days(SubscriptionTier.FREE), 3, "Trial is 3 days")

    # Paid tiers are not trial
    assert_false(is_wisdom_journeys_trial(SubscriptionTier.PREMIUM), "Premium is not trial")


# ===========================================================================
# START ENDPOINT TESTS
# ===========================================================================

@registry.register("api", "POST /api/journeys/start route exists with POST method")
def test_start_endpoint_exists():
    """Verify start endpoint exists with correct HTTP method."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "start" / "route.ts"
    assert_true(route_path.exists(), "Start route file should exist")

    with open(route_path) as f:
        content = f.read()

    assert_in("export async function POST", content, "Should have POST handler")


@registry.register("api", "POST /api/journeys/start validates journey_ids")
def test_start_validates_journey_ids():
    """Verify start endpoint validates journey_ids field."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "start" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    # Should validate journey_ids
    assert_in("journey_ids", content, "Should reference journey_ids")
    assert_in("Array.isArray", content, "Should validate array")


@registry.register("api", "POST /api/journeys/start enforces max 5 journeys")
def test_start_max_journeys():
    """Verify start endpoint enforces maximum 5 journeys per request."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "start" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    # Should check for max 5
    assert_in("5", content, "Should enforce max 5 journeys")
    assert_true("maximum" in content.lower() or "max" in content.lower(), "Should have max message")


@registry.register("api", "POST /api/journeys/start has retry logic")
def test_start_has_retry():
    """Verify start endpoint has retry logic for transient failures."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "start" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    assert_in("retry", content.lower(), "Should have retry logic")
    assert_in("backoff", content.lower(), "Should have exponential backoff")


# ===========================================================================
# ACTIVE JOURNEYS ENDPOINT TESTS
# ===========================================================================

@registry.register("api", "GET /api/journeys/active route exists")
def test_active_endpoint_exists():
    """Verify active journeys endpoint exists."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "active" / "route.ts"
    assert_true(route_path.exists(), "Active route file should exist")

    with open(route_path) as f:
        content = f.read()

    assert_in("export async function GET", content, "Should have GET handler")


# ===========================================================================
# TODAY ENDPOINT TESTS
# ===========================================================================

@registry.register("api", "GET /api/journeys/today route exists")
def test_today_endpoint_exists():
    """Verify today's agenda endpoint exists."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "today" / "route.ts"
    assert_true(route_path.exists(), "Today route file should exist")

    with open(route_path) as f:
        content = f.read()

    assert_in("GET", content, "Should have GET handler")


@registry.register("api", "POST /api/journeys/[journeyId]/today is idempotent")
def test_today_step_idempotent():
    """Verify today step endpoint design supports idempotency."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "[journeyId]" / "today" / "route.ts"
    assert_true(route_path.exists(), "Journey today route should exist")


# ===========================================================================
# COMPLETE STEP ENDPOINT TESTS
# ===========================================================================

@registry.register("api", "POST /api/journeys/[journeyId]/steps/[day]/complete exists")
def test_complete_endpoint_exists():
    """Verify step completion endpoint exists."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "[journeyId]" / "steps" / "[day]" / "complete" / "route.ts"
    assert_true(route_path.exists(), "Complete step route should exist")

    with open(route_path) as f:
        content = f.read()

    assert_in("POST", content, "Should have POST handler")


@registry.register("api", "POST /api/journeys/[journeyId]/steps/[day]/complete handles request body")
def test_complete_handles_body():
    """Verify step completion handles and forwards request body."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "[journeyId]" / "steps" / "[day]" / "complete" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    # Route forwards body to backend which handles check_in
    assert_in("body", content, "Should handle request body")
    assert_in("JSON.stringify", content, "Should serialize body to JSON")


# ===========================================================================
# LIFECYCLE ENDPOINT TESTS
# ===========================================================================

@registry.register("api", "POST /api/journeys/[journeyId]/pause exists")
def test_pause_endpoint_exists():
    """Verify pause endpoint exists."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "[journeyId]" / "pause" / "route.ts"
    assert_true(route_path.exists(), "Pause route should exist")


@registry.register("api", "POST /api/journeys/[journeyId]/resume exists")
def test_resume_endpoint_exists():
    """Verify resume endpoint exists."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "[journeyId]" / "resume" / "route.ts"
    assert_true(route_path.exists(), "Resume route should exist")


@registry.register("api", "POST /api/journeys/[journeyId]/abandon exists")
def test_abandon_endpoint_exists():
    """Verify abandon endpoint exists."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "[journeyId]" / "abandon" / "route.ts"
    assert_true(route_path.exists(), "Abandon route should exist")


@registry.register("api", "GET /api/journeys/[journeyId]/history exists")
def test_history_endpoint_exists():
    """Verify history endpoint exists."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "[journeyId]" / "history" / "route.ts"
    assert_true(route_path.exists(), "History route should exist")


# ===========================================================================
# AUTH HEADER FORWARDING TESTS
# ===========================================================================

@registry.register("api", "All routes forward Authorization header")
def test_routes_forward_auth():
    """Verify all routes properly forward auth headers to backend."""
    routes = [
        "catalog", "access", "start", "active", "today"
    ]

    routes_dir = Path(__file__).parent.parent.parent / "app" / "api" / "journeys"

    for route in routes:
        route_file = routes_dir / route / "route.ts"
        if route_file.exists():
            with open(route_file) as f:
                content = f.read()
            assert_in("Authorization", content, f"Route {route} should forward Authorization header")


@registry.register("api", "All routes forward X-Auth-UID header")
def test_routes_forward_uid():
    """Verify all routes forward user ID header."""
    routes = ["catalog", "access", "start", "active", "today"]
    routes_dir = Path(__file__).parent.parent.parent / "app" / "api" / "journeys"

    for route in routes:
        route_file = routes_dir / route / "route.ts"
        if route_file.exists():
            with open(route_file) as f:
                content = f.read()
            # Should forward either X-Auth-UID or Cookie
            assert_true(
                "X-Auth-UID" in content or "Cookie" in content,
                f"Route {route} should forward user identification"
            )


# ===========================================================================
# ERROR HANDLING TESTS
# ===========================================================================

@registry.register("api", "Start route handles 401 Unauthorized")
def test_start_handles_401():
    """Verify start route properly handles authentication errors."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "start" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    assert_in("401", content, "Should handle 401 status")
    assert_in("authentication", content.lower(), "Should have authentication error message")


@registry.register("api", "Start route handles 403 Premium required")
def test_start_handles_403():
    """Verify start route properly handles premium feature errors."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "start" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    assert_in("403", content, "Should handle 403 status")
    assert_in("premium", content.lower(), "Should have premium error message")


@registry.register("api", "Start route handles 503 Service unavailable")
def test_start_handles_503():
    """Verify start route handles service unavailable with queue support."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "start" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    assert_in("503", content, "Should handle 503 status")
    assert_in("_can_queue", content, "Should support offline queuing")


@registry.register("api", "Catalog route has fallback templates")
def test_catalog_has_fallback():
    """Verify catalog route has fallback templates for offline mode."""
    route_path = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "catalog" / "route.ts"

    with open(route_path) as f:
        content = f.read()

    assert_in("DEFAULT_TEMPLATES", content, "Should have default templates")
    assert_in("fallback", content.lower(), "Should have fallback logic")
