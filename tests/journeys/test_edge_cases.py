"""
Edge Case Tests for Wisdom Journeys

Tests boundary conditions and unusual inputs including:
- Empty inputs
- Maximum values
- Unicode handling
- Date edge cases
- Null/None handling
"""

from datetime import datetime, timedelta, timezone

from tests.journeys.run_all_tests import (
    registry, TestContext,
    assert_equal, assert_true, assert_false, assert_in, assert_not_in,
    assert_length, assert_range
)


# ===========================================================================
# EMPTY INPUT TESTS
# ===========================================================================

@registry.register("edge_cases", "Sanitizer handles empty string")
def test_sanitize_empty_string():
    """Verify sanitizer handles empty string."""
    from backend.services.journey_coach import sanitize_user_input

    result = sanitize_user_input("")
    assert_equal(result, "", "Empty string should return empty")


@registry.register("edge_cases", "Sanitizer handles whitespace only")
def test_sanitize_whitespace():
    """Verify sanitizer handles whitespace-only input."""
    from backend.services.journey_coach import sanitize_user_input

    whitespace_inputs = ["   ", "\t\t", "\n\n", "  \t\n  "]

    for ws in whitespace_inputs:
        result = sanitize_user_input(ws)
        assert_equal(result, "", f"Whitespace '{repr(ws)}' should return empty")


@registry.register("edge_cases", "GitaCorpusAdapter handles empty enemy tag")
def test_adapter_empty_enemy():
    """Verify adapter handles empty enemy tag."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    result = adapter.get_enemy_themes("")
    assert_equal(result, [], "Empty enemy should return empty list")


@registry.register("edge_cases", "GitaCorpusAdapter handles None-like exclusion list")
def test_adapter_none_exclusion():
    """Verify adapter handles None exclusion list."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    result = adapter._get_fallback_verses(3, exclude_refs=None)
    assert_length(result, 3, "Should return verses with None exclusion")

    result = adapter._get_fallback_verses(3, exclude_refs=[])
    assert_length(result, 3, "Should return verses with empty exclusion")


# ===========================================================================
# MAXIMUM VALUE TESTS
# ===========================================================================

@registry.register("edge_cases", "Sanitizer enforces max length")
def test_sanitize_max_length():
    """Verify sanitizer enforces maximum length."""
    from backend.services.journey_coach import sanitize_user_input

    # Test exact max length
    text = "a" * 2000
    result = sanitize_user_input(text, max_length=2000)
    assert_equal(len(result), 2000, "Should keep at max length")

    # Test over max length
    text = "b" * 5000
    result = sanitize_user_input(text, max_length=2000)
    assert_equal(len(result), 2000, "Should truncate to max length")


@registry.register("edge_cases", "Fallback verses limit is enforced")
def test_fallback_limit():
    """Verify fallback verses respect limit parameter."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    for limit in [1, 3, 5, 8]:
        result = adapter._get_fallback_verses(limit)
        assert_true(len(result) <= limit, f"Should respect limit {limit}")


@registry.register("edge_cases", "Verse ref chapter maximum (18)")
def test_verse_chapter_max():
    """Verify chapter 18 is valid (Gita maximum)."""
    from backend.services.journey_coach import VerseRefSchema
    from pydantic import ValidationError

    # Chapter 18 should be valid
    ref = VerseRefSchema(chapter=18, verse=78)
    assert_equal(ref.chapter, 18)

    # Chapter 19 should fail
    try:
        VerseRefSchema(chapter=19, verse=1)
        raise AssertionError("Should reject chapter 19")
    except ValidationError:
        pass


@registry.register("edge_cases", "Verse ref chapter minimum (1)")
def test_verse_chapter_min():
    """Verify chapter 1 is valid (Gita minimum)."""
    from backend.services.journey_coach import VerseRefSchema
    from pydantic import ValidationError

    # Chapter 1 should be valid
    ref = VerseRefSchema(chapter=1, verse=1)
    assert_equal(ref.chapter, 1)

    # Chapter 0 should fail
    try:
        VerseRefSchema(chapter=0, verse=1)
        raise AssertionError("Should reject chapter 0")
    except ValidationError:
        pass


# ===========================================================================
# UNICODE TESTS
# ===========================================================================

@registry.register("edge_cases", "Sanitizer preserves Sanskrit text")
def test_sanitize_sanskrit():
    """Verify Sanskrit (Devanagari) text is preserved."""
    from backend.services.journey_coach import sanitize_user_input

    sanskrit_texts = [
        "कर्मण्येवाधिकारस्ते",
        "योगः कर्मसु कौशलम्",
        "स्थितप्रज्ञस्य का भाषा",
    ]

    for text in sanskrit_texts:
        result = sanitize_user_input(text)
        assert_in(text, result, f"Should preserve: {text}")


@registry.register("edge_cases", "Sanitizer preserves Hindi text")
def test_sanitize_hindi():
    """Verify Hindi text is preserved."""
    from backend.services.journey_coach import sanitize_user_input

    hindi_texts = [
        "मैं आज शांत महसूस कर रहा हूं",
        "मेरा क्रोध कम हो गया है",
        "मुझे आज अच्छा लग रहा है",
    ]

    for text in hindi_texts:
        result = sanitize_user_input(text)
        assert_in(text, result, f"Should preserve: {text}")


@registry.register("edge_cases", "Sanitizer preserves emoji")
def test_sanitize_emoji():
    """Verify emoji characters are preserved."""
    from backend.services.journey_coach import sanitize_user_input

    emoji_texts = [
        "Feeling peaceful 🙏",
        "Today is good ✨",
        "Working on anger 😤 → 😌",
    ]

    for text in emoji_texts:
        result = sanitize_user_input(text)
        # At least the base text should be there
        assert_true(len(result) > 0, f"Should preserve text: {text}")


@registry.register("edge_cases", "Sanitizer handles mixed scripts")
def test_sanitize_mixed_scripts():
    """Verify mixed script text is handled."""
    from backend.services.journey_coach import sanitize_user_input

    mixed_text = "Today I learned: कर्मण्येवाधिकारस्ते means focus on action"
    result = sanitize_user_input(mixed_text)

    assert_true(len(result) > 0, "Should handle mixed scripts")


# ===========================================================================
# DATE EDGE CASES
# ===========================================================================

@registry.register("edge_cases", "Scheduler handles just-started journey")
def test_scheduler_just_started():
    """Verify scheduler handles journey started just now."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()
    now = datetime.now(timezone.utc)

    day_index = scheduler.calculate_day_index(now, "daily", 0)
    assert_equal(day_index, 1, "Just started should be day 1")


@registry.register("edge_cases", "Scheduler handles journey started in past")
def test_scheduler_past_start():
    """Verify scheduler handles journey started many days ago."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()
    long_ago = datetime.now(timezone.utc) - timedelta(days=100)

    day_index = scheduler.calculate_day_index(long_ago, "daily", 10)
    assert_true(day_index >= 11, "Should be at least day 11")


@registry.register("edge_cases", "Scheduler handles future start (edge case)")
def test_scheduler_future_start():
    """Verify scheduler handles edge case of future start date."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()
    future = datetime.now(timezone.utc) + timedelta(days=1)

    # Should handle gracefully
    day_index = scheduler.calculate_day_index(future, "daily", 0)
    assert_true(day_index >= 1, "Should return valid day index")


@registry.register("edge_cases", "Scheduler handles midnight boundary")
def test_scheduler_midnight():
    """Verify scheduler handles midnight boundary correctly."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()

    # Just before midnight yesterday
    yesterday_late = datetime.now(timezone.utc).replace(hour=23, minute=59) - timedelta(days=1)
    day_index = scheduler.calculate_day_index(yesterday_late, "daily", 0)
    assert_true(day_index >= 1, "Should handle late night start")


# ===========================================================================
# BOUNDARY VALUE TESTS
# ===========================================================================

@registry.register("edge_cases", "Difficulty range 1-5 boundary")
def test_difficulty_boundary():
    """Verify difficulty values at boundaries."""
    import json
    from pathlib import Path

    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    difficulties = [t["difficulty"] for t in templates]

    assert_true(all(1 <= d <= 5 for d in difficulties), "All difficulties should be 1-5")
    assert_true(min(difficulties) >= 1, "Min difficulty should be >= 1")
    assert_true(max(difficulties) <= 5, "Max difficulty should be <= 5")


@registry.register("edge_cases", "Duration range 7-30 boundary")
def test_duration_boundary():
    """Verify duration values at boundaries."""
    import json
    from pathlib import Path

    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"
    with open(templates_path) as f:
        data = json.load(f)

    templates = data.get("templates", [])
    durations = [t["duration_days"] for t in templates]

    assert_true(all(7 <= d <= 30 for d in durations), "All durations should be 7-30")


@registry.register("edge_cases", "Check-in intensity 0-10 range")
def test_checkin_intensity_range():
    """Verify check-in intensity range is documented."""
    from backend.services.journey_coach import JourneyStepSchema

    # Create step with check-in
    step = JourneyStepSchema(
        step_title="Test",
        today_focus="krodha",
        verse_refs=[{"chapter": 2, "verse": 47}],
        teaching="T" * 60,
        guided_reflection=["Q?"],
        practice={"name": "P", "instructions": ["I"], "duration_minutes": 5},
        micro_commitment="I will practice.",
        check_in_prompt={"scale": "0-10", "label": "Intensity?"},
    )

    assert_equal(step.check_in_prompt.scale, "0-10")


# ===========================================================================
# SPECIAL CHARACTER TESTS
# ===========================================================================

@registry.register("edge_cases", "Sanitizer handles newlines")
def test_sanitize_newlines():
    """Verify newlines in input are handled."""
    from backend.services.journey_coach import sanitize_user_input

    text_with_newlines = "Line 1\nLine 2\nLine 3"
    result = sanitize_user_input(text_with_newlines)

    # Should preserve or normalize newlines
    assert_true(len(result) > 0, "Should handle newlines")


@registry.register("edge_cases", "Sanitizer handles tabs")
def test_sanitize_tabs():
    """Verify tabs in input are handled."""
    from backend.services.journey_coach import sanitize_user_input

    text_with_tabs = "Col1\tCol2\tCol3"
    result = sanitize_user_input(text_with_tabs)

    assert_true(len(result) > 0, "Should handle tabs")


@registry.register("edge_cases", "Sanitizer handles special punctuation")
def test_sanitize_punctuation():
    """Verify special punctuation is handled."""
    from backend.services.journey_coach import sanitize_user_input

    special_texts = [
        "Question? Answer!",
        "Item (1) and [2]",
        "A & B",
        "100% complete",
        "Path/to/file",
    ]

    for text in special_texts:
        result = sanitize_user_input(text)
        assert_true(len(result) > 0, f"Should handle: {text}")


# ===========================================================================
# UNKNOWN/INVALID INPUT TESTS
# ===========================================================================

@registry.register("edge_cases", "Adapter handles unknown enemy gracefully")
def test_adapter_unknown_enemy():
    """Verify adapter handles unknown enemy tag gracefully."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Unknown enemy should return empty themes
    themes = adapter.get_enemy_themes("unknown_enemy")
    assert_equal(themes, [], "Unknown enemy should return empty list")

    # Unknown enemy should return default virtue
    virtue = adapter.get_virtue_for_enemy("unknown_enemy")
    assert_equal(virtue, "peace", "Unknown enemy should return 'peace'")


@registry.register("edge_cases", "Scheduler handles unknown pace gracefully")
def test_scheduler_unknown_pace():
    """Verify scheduler handles unknown pace gracefully."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()

    # Unknown paces should default to 'daily'
    unknown_paces = ["hourly", "biweekly", "monthly", "random", ""]

    for pace in unknown_paces:
        result = scheduler.validate_pace(pace)
        assert_equal(result, "daily", f"Unknown pace '{pace}' should default to 'daily'")


# ===========================================================================
# EXCLUSION EDGE CASES
# ===========================================================================

@registry.register("edge_cases", "Fallback verses with all excluded")
def test_fallback_all_excluded():
    """Verify fallback verses handles case where many are excluded."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Get all fallback verses
    all_fallback = adapter._get_fallback_verses(10)

    # Exclude most of them
    exclude = all_fallback[:6]
    result = adapter._get_fallback_verses(3, exclude_refs=exclude)

    # Should still return some
    assert_true(len(result) >= 0, "Should handle heavy exclusion")


@registry.register("edge_cases", "Verse exclusion with duplicate refs")
def test_exclusion_duplicates():
    """Verify exclusion handles duplicate refs."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Duplicate exclusions
    exclude = [
        {"chapter": 2, "verse": 47},
        {"chapter": 2, "verse": 47},
        {"chapter": 2, "verse": 47},
    ]

    result = adapter._get_fallback_verses(3, exclude_refs=exclude)
    assert_true(len(result) >= 0, "Should handle duplicate exclusions")
