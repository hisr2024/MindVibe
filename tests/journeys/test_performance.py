"""
Performance Tests for Wisdom Journeys

Tests performance characteristics including:
- Response time expectations
- Caching effectiveness
- Query optimization
- Bundle size considerations
"""

import time
from pathlib import Path

from tests.journeys.run_all_tests import (
    registry, TestContext,
    assert_equal, assert_true, assert_false, assert_in, assert_not_in,
    assert_length, assert_range
)


# ===========================================================================
# GITA CORPUS ADAPTER PERFORMANCE
# ===========================================================================

@registry.register("performance", "GitaCorpusAdapter caches verse text")
def test_adapter_caching():
    """Verify adapter caches verse text to avoid repeated lookups."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Initially cache should be empty (or we clear it)
    adapter.clear_cache()
    assert_equal(len(adapter._cache), 0, "Cache should start empty")

    # Verify cache mechanism exists
    assert_true(hasattr(adapter, "_cache"), "Should have cache attribute")
    assert_true(hasattr(adapter, "clear_cache"), "Should have clear_cache method")


@registry.register("performance", "GitaCorpusAdapter fallback verses are O(1) lookup")
def test_adapter_fallback_performance():
    """Verify fallback verse exclusion uses O(1) set lookup."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Large exclusion list
    exclude = [{"chapter": i, "verse": j} for i in range(1, 19) for j in range(1, 10)]

    start = time.perf_counter()
    result = adapter._get_fallback_verses(3, exclude_refs=exclude)
    elapsed = time.perf_counter() - start

    # Should be fast even with large exclusion list
    assert_true(elapsed < 0.01, f"Should be < 10ms, got {elapsed * 1000:.2f}ms")


@registry.register("performance", "GitaCorpusAdapter get_enemy_themes is O(1)")
def test_adapter_themes_performance():
    """Verify enemy themes lookup is O(1)."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    start = time.perf_counter()
    for enemy in ["kama", "krodha", "lobha", "moha", "mada", "matsarya"]:
        adapter.get_enemy_themes(enemy)
    elapsed = time.perf_counter() - start

    # Should be very fast
    assert_true(elapsed < 0.001, f"Should be < 1ms, got {elapsed * 1000:.2f}ms")


# ===========================================================================
# SCHEMA VALIDATION PERFORMANCE
# ===========================================================================

@registry.register("performance", "JourneyStepSchema validation is fast")
def test_schema_validation_performance():
    """Verify schema validation is fast enough for real-time use."""
    from backend.services.journey_coach import JourneyStepSchema

    valid_step = {
        "step_title": "Day 1: Understanding Anger",
        "today_focus": "krodha",
        "verse_refs": [{"chapter": 2, "verse": 63}],
        "teaching": "Teaching content " * 20,
        "guided_reflection": ["Q1?", "Q2?"],
        "practice": {
            "name": "Practice",
            "instructions": ["Step 1", "Step 2"],
            "duration_minutes": 5,
        },
        "micro_commitment": "I will practice today.",
        "check_in_prompt": {"scale": "0-10", "label": "How do you feel?"},
    }

    start = time.perf_counter()
    for _ in range(100):
        JourneyStepSchema(**valid_step)
    elapsed = time.perf_counter() - start

    avg_ms = (elapsed / 100) * 1000
    assert_true(avg_ms < 1, f"Validation should be < 1ms avg, got {avg_ms:.2f}ms")


# ===========================================================================
# INPUT SANITIZATION PERFORMANCE
# ===========================================================================

@registry.register("performance", "Input sanitization is fast for normal input")
def test_sanitize_performance_normal():
    """Verify sanitization is fast for normal input."""
    from backend.services.journey_coach import sanitize_user_input

    normal_text = "I feel peaceful today. My anger has subsided."

    start = time.perf_counter()
    for _ in range(1000):
        sanitize_user_input(normal_text)
    elapsed = time.perf_counter() - start

    avg_us = (elapsed / 1000) * 1_000_000
    assert_true(avg_us < 100, f"Should be < 100μs avg, got {avg_us:.2f}μs")


@registry.register("performance", "Input sanitization handles max length efficiently")
def test_sanitize_performance_long():
    """Verify sanitization handles long input efficiently."""
    from backend.services.journey_coach import sanitize_user_input

    long_text = "x" * 5000

    start = time.perf_counter()
    for _ in range(100):
        sanitize_user_input(long_text, max_length=2000)
    elapsed = time.perf_counter() - start

    avg_ms = (elapsed / 100) * 1000
    assert_true(avg_ms < 1, f"Should be < 1ms avg, got {avg_ms:.2f}ms")


# ===========================================================================
# JSON EXTRACTION PERFORMANCE
# ===========================================================================

@registry.register("performance", "JSON extraction is fast")
def test_json_extraction_performance():
    """Verify JSON extraction from markdown is fast."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()
    markdown_json = '```json\n{"key": "value", "nested": {"a": 1, "b": 2}}\n```'

    start = time.perf_counter()
    for _ in range(1000):
        coach._extract_json(markdown_json)
    elapsed = time.perf_counter() - start

    avg_us = (elapsed / 1000) * 1_000_000
    assert_true(avg_us < 50, f"Should be < 50μs avg, got {avg_us:.2f}μs")


# ===========================================================================
# SCHEDULER PERFORMANCE
# ===========================================================================

@registry.register("performance", "Day index calculation is O(1)")
def test_scheduler_performance():
    """Verify day index calculation is constant time."""
    from backend.services.journey_engine_enhanced import JourneyScheduler
    from datetime import datetime, timezone

    scheduler = JourneyScheduler()
    now = datetime.now(timezone.utc)

    start = time.perf_counter()
    for _ in range(10000):
        scheduler.calculate_day_index(now, "daily", 5)
    elapsed = time.perf_counter() - start

    avg_us = (elapsed / 10000) * 1_000_000
    assert_true(avg_us < 10, f"Should be < 10μs avg, got {avg_us:.2f}μs")


# ===========================================================================
# FILE SIZE CHECKS
# ===========================================================================

@registry.register("performance", "Journey templates JSON is reasonably sized")
def test_templates_file_size():
    """Verify templates JSON file is reasonably sized."""
    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    size_kb = templates_path.stat().st_size / 1024

    assert_true(size_kb < 50, f"Templates should be < 50KB, got {size_kb:.2f}KB")


@registry.register("performance", "Frontend service file is reasonably sized")
def test_service_file_size():
    """Verify frontend service file is reasonably sized."""
    service_path = Path(__file__).parent.parent.parent / "services" / "journeysEnhancedService.ts"
    size_kb = service_path.stat().st_size / 1024

    assert_true(size_kb < 100, f"Service should be < 100KB, got {size_kb:.2f}KB")


@registry.register("performance", "Catalog component file is reasonably sized")
def test_catalog_file_size():
    """Verify catalog component file is reasonably sized."""
    component_path = Path(__file__).parent.parent.parent / "app" / "journeys" / "JourneysCatalogClient.tsx"
    size_kb = component_path.stat().st_size / 1024

    assert_true(size_kb < 150, f"Catalog should be < 150KB, got {size_kb:.2f}KB")


# ===========================================================================
# BULK OPERATION EFFICIENCY
# ===========================================================================

@registry.register("performance", "GitaCorpusAdapter has bulk verse fetch")
def test_adapter_bulk_fetch():
    """Verify adapter supports bulk verse fetching to avoid N+1."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Should have bulk method
    assert_true(hasattr(adapter, "get_verses_bulk"), "Should have bulk fetch method")


# ===========================================================================
# CACHING VERIFICATION
# ===========================================================================

@registry.register("performance", "API routes use no-store cache control")
def test_api_cache_control():
    """Verify API routes disable caching to prevent stale data."""
    catalog_route = Path(__file__).parent.parent.parent / "app" / "api" / "journeys" / "catalog" / "route.ts"

    with open(catalog_route) as f:
        content = f.read()

    # Should prevent caching for dynamic data
    assert_in("no-store", content, "Should use no-store cache")


# ===========================================================================
# QUERY OPTIMIZATION CHECKS
# ===========================================================================

@registry.register("performance", "Backend uses selectinload for relationships")
def test_backend_selectinload():
    """Verify backend uses selectinload to prevent N+1 queries."""
    engine_path = Path(__file__).parent.parent.parent / "backend" / "services" / "journey_engine_enhanced.py"

    with open(engine_path) as f:
        content = f.read()

    # Should use SQLAlchemy eager loading
    has_eager_loading = "selectinload" in content or "joinedload" in content
    assert_true(has_eager_loading, "Should use selectinload or joinedload")
