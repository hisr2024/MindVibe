"""
Service Layer Tests for Wisdom Journeys

Tests all service classes and functions:
- JourneyScheduler
- GitaCorpusAdapter
- JourneyCoach
- EnhancedJourneyEngine
- VersePicker
- StepGenerator
- ReflectionEncryption
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from tests.journeys.run_all_tests import (
    registry, TestContext,
    assert_equal, assert_true, assert_false, assert_in, assert_not_in,
    assert_length, assert_range, assert_raises
)


# ===========================================================================
# JOURNEY SCHEDULER TESTS
# ===========================================================================

@registry.register("service", "JourneyScheduler.validate_pace accepts valid paces")
def test_scheduler_valid_paces():
    """Verify scheduler accepts all valid pace values."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()

    assert_equal(scheduler.validate_pace("daily"), "daily")
    assert_equal(scheduler.validate_pace("every_other_day"), "every_other_day")
    assert_equal(scheduler.validate_pace("weekly"), "weekly")


@registry.register("service", "JourneyScheduler.validate_pace defaults invalid to daily")
def test_scheduler_invalid_pace_default():
    """Verify scheduler defaults invalid pace to 'daily'."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()

    assert_equal(scheduler.validate_pace("invalid"), "daily")
    assert_equal(scheduler.validate_pace(""), "daily")
    assert_equal(scheduler.validate_pace("hourly"), "daily")


@registry.register("service", "JourneyScheduler.calculate_day_index daily pace")
def test_scheduler_daily_pace():
    """Verify day index calculation for daily pace."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()
    now = datetime.now(timezone.utc)

    # Just started, 0 completed
    day_index = scheduler.calculate_day_index(now, "daily", 0)
    assert_equal(day_index, 1, "Day 1 for new journey")

    # Started 5 days ago, 3 completed
    started_5_days_ago = now - timedelta(days=5)
    day_index = scheduler.calculate_day_index(started_5_days_ago, "daily", 3)
    assert_equal(day_index, 4, "Day 4 after completing 3")


@registry.register("service", "JourneyScheduler.calculate_day_index every_other_day pace")
def test_scheduler_every_other_day():
    """Verify day index calculation for every-other-day pace."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()
    now = datetime.now(timezone.utc)

    # Started 10 days ago with every_other_day = 5 periods
    started_10_days_ago = now - timedelta(days=10)
    day_index = scheduler.calculate_day_index(started_10_days_ago, "every_other_day", 3)
    assert_range(day_index, 1, 6, "Day index should be reasonable for every_other_day")


@registry.register("service", "JourneyScheduler.calculate_day_index weekly pace")
def test_scheduler_weekly_pace():
    """Verify day index calculation for weekly pace."""
    from backend.services.journey_engine_enhanced import JourneyScheduler

    scheduler = JourneyScheduler()
    now = datetime.now(timezone.utc)

    # Started 21 days ago with weekly = 3 weeks
    started_21_days_ago = now - timedelta(days=21)
    day_index = scheduler.calculate_day_index(started_21_days_ago, "weekly", 2)
    assert_range(day_index, 1, 4, "Day index should be reasonable for weekly")


# ===========================================================================
# GITA CORPUS ADAPTER TESTS
# ===========================================================================

@registry.register("service", "GitaCorpusAdapter initializes correctly")
def test_gita_adapter_init():
    """Verify GitaCorpusAdapter initializes."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()
    assert_true(adapter is not None, "Adapter should initialize")


@registry.register("service", "GitaCorpusAdapter.get_enemy_themes returns correct themes")
def test_gita_adapter_enemy_themes():
    """Verify enemy themes mapping is correct."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Krodha (anger)
    krodha_themes = adapter.get_enemy_themes("krodha")
    assert_in("anger", krodha_themes, "Krodha should include 'anger'")
    assert_in("patience", krodha_themes, "Krodha should include 'patience'")
    assert_in("peace", krodha_themes, "Krodha should include 'peace'")

    # Kama (desire)
    kama_themes = adapter.get_enemy_themes("kama")
    assert_in("desire", kama_themes, "Kama should include 'desire'")
    assert_in("restraint", kama_themes, "Kama should include 'restraint'")

    # Moha (delusion)
    moha_themes = adapter.get_enemy_themes("moha")
    assert_in("delusion", moha_themes, "Moha should include 'delusion'")
    assert_in("wisdom", moha_themes, "Moha should include 'wisdom'")


@registry.register("service", "GitaCorpusAdapter.get_virtue_for_enemy maps all enemies")
def test_gita_adapter_virtues():
    """Verify virtue mapping for all six enemies."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    expected = {
        "kama": "restraint",
        "krodha": "peace",
        "lobha": "contentment",
        "moha": "wisdom",
        "mada": "humility",
        "matsarya": "joy",
    }

    for enemy, virtue in expected.items():
        assert_equal(adapter.get_virtue_for_enemy(enemy), virtue, f"Virtue for {enemy}")


@registry.register("service", "GitaCorpusAdapter.get_recommended_chapters returns valid chapters")
def test_gita_adapter_chapters():
    """Verify recommended chapters are valid (1-18)."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()
    enemies = ["kama", "krodha", "lobha", "moha", "mada", "matsarya"]

    for enemy in enemies:
        chapters = adapter.get_recommended_chapters(enemy)
        assert_true(len(chapters) > 0, f"Should have chapters for {enemy}")
        for ch in chapters:
            assert_range(ch, 1, 18, f"Chapter {ch} should be 1-18")


@registry.register("service", "GitaCorpusAdapter._get_fallback_verses returns valid refs")
def test_gita_adapter_fallback():
    """Verify fallback verses are valid."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()
    fallback = adapter._get_fallback_verses(5)

    assert_length(fallback, 5, "Should return requested number")
    for verse in fallback:
        assert_in("chapter", verse, "Should have chapter")
        assert_in("verse", verse, "Should have verse")
        assert_range(verse["chapter"], 1, 18, "Chapter should be 1-18")


@registry.register("service", "GitaCorpusAdapter._get_fallback_verses excludes refs correctly")
def test_gita_adapter_fallback_exclusion():
    """Verify fallback verses exclude specified refs."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Exclude verse 2:47 (famous karma yoga verse)
    exclude = [{"chapter": 2, "verse": 47}]
    fallback = adapter._get_fallback_verses(5, exclude_refs=exclude)

    for verse in fallback:
        if verse["chapter"] == 2 and verse["verse"] == 47:
            raise AssertionError("Should have excluded 2:47")


@registry.register("service", "GitaCorpusAdapter cache operations work")
def test_gita_adapter_cache():
    """Verify cache operations work correctly."""
    from backend.services.gita_corpus_adapter import GitaCorpusAdapter

    adapter = GitaCorpusAdapter()

    # Cache should be clearable
    adapter.clear_cache()
    assert_equal(len(adapter._cache), 0, "Cache should be empty after clear")


# ===========================================================================
# JOURNEY COACH TESTS
# ===========================================================================

@registry.register("service", "JourneyCoach initializes correctly")
def test_coach_init():
    """Verify JourneyCoach initializes."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()
    assert_true(coach is not None, "Coach should initialize")


@registry.register("service", "JourneyCoach._build_safety_response has required fields")
def test_coach_safety_response_fields():
    """Verify safety response contains all required fields."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()
    response = coach._build_safety_response()

    required_fields = [
        "is_safety_response", "safety_message", "crisis_resources",
        "gentle_guidance"
    ]

    for field in required_fields:
        assert_in(field, response, f"Safety response should have {field}")


@registry.register("service", "JourneyCoach._build_safety_response includes Indian helplines")
def test_coach_safety_indian_resources():
    """Verify safety response includes Indian crisis resources."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()
    response = coach._build_safety_response()
    resources_text = " ".join(response["crisis_resources"]).lower()

    indian_helplines = ["icall", "vandrevala", "aasra", "nimhans"]
    found = any(helpline in resources_text for helpline in indian_helplines)
    assert_true(found, "Should include at least one Indian helpline")


@registry.register("service", "JourneyCoach._extract_json handles plain JSON")
def test_coach_extract_json_plain():
    """Verify JSON extraction from plain JSON string."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()
    result = coach._extract_json('{"test": 123}')
    parsed = json.loads(result)

    assert_equal(parsed["test"], 123)


@registry.register("service", "JourneyCoach._extract_json handles markdown code blocks")
def test_coach_extract_json_markdown():
    """Verify JSON extraction from markdown code blocks."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()

    # With json language tag
    result = coach._extract_json('```json\n{"test": 456}\n```')
    parsed = json.loads(result)
    assert_equal(parsed["test"], 456)

    # Without language tag
    result = coach._extract_json('```\n{"test": 789}\n```')
    parsed = json.loads(result)
    assert_equal(parsed["test"], 789)


@registry.register("service", "JourneyCoach._extract_json handles surrounding text")
def test_coach_extract_json_with_text():
    """Verify JSON extraction ignores surrounding text."""
    from backend.services.journey_coach import JourneyCoach

    coach = JourneyCoach()
    result = coach._extract_json('Here is the response:\n```json\n{"key": "value"}\n```\nEnd.')
    parsed = json.loads(result)

    assert_equal(parsed["key"], "value")


# ===========================================================================
# SANITIZE USER INPUT TESTS
# ===========================================================================

@registry.register("service", "sanitize_user_input preserves normal text")
def test_sanitize_normal_text():
    """Verify normal text passes through unchanged."""
    from backend.services.journey_coach import sanitize_user_input

    normal_inputs = [
        "I feel peaceful today",
        "My anger has subsided",
        "Working on my desires",
        "Feeling grateful for life",
    ]

    for text in normal_inputs:
        result = sanitize_user_input(text)
        assert_equal(result, text, f"Normal text should be preserved: {text}")


@registry.register("service", "sanitize_user_input handles empty input")
def test_sanitize_empty():
    """Verify empty inputs are handled correctly."""
    from backend.services.journey_coach import sanitize_user_input

    assert_equal(sanitize_user_input(""), "")
    assert_equal(sanitize_user_input("   "), "")
    assert_equal(sanitize_user_input("\n\t"), "")


@registry.register("service", "sanitize_user_input truncates long input")
def test_sanitize_truncation():
    """Verify long inputs are truncated to max length."""
    from backend.services.journey_coach import sanitize_user_input

    long_text = "x" * 5000
    result = sanitize_user_input(long_text, max_length=2000)

    assert_equal(len(result), 2000)


@registry.register("service", "sanitize_user_input preserves Unicode")
def test_sanitize_unicode():
    """Verify Unicode characters are preserved."""
    from backend.services.journey_coach import sanitize_user_input

    # Sanskrit
    sanskrit = "कर्मण्येवाधिकारस्ते"
    assert_in(sanskrit, sanitize_user_input(sanskrit))

    # Hindi
    hindi = "मैं शांत हूं"
    assert_in(hindi, sanitize_user_input(hindi))

    # Emoji
    emoji_text = "Feeling peaceful 🙏"
    assert_in("🙏", sanitize_user_input(emoji_text))


@registry.register("service", "sanitize_user_input blocks injection patterns")
def test_sanitize_injections():
    """Verify known injection patterns are blocked."""
    from backend.services.journey_coach import sanitize_user_input

    # These specific patterns are confirmed to be blocked by the sanitizer
    blocked_injections = [
        "ignore all instructions",
        "disregard previous instructions",
        "new instructions:",
    ]

    for injection in blocked_injections:
        result = sanitize_user_input(injection)
        # Should be filtered
        is_blocked = "[filtered]" in result.lower()
        assert_true(is_blocked, f"Should block: {injection}")


# ===========================================================================
# SCHEMA VALIDATION TESTS
# ===========================================================================

@registry.register("service", "JourneyStepSchema validates correct input")
def test_step_schema_valid():
    """Verify valid step data passes schema validation."""
    from backend.services.journey_coach import JourneyStepSchema

    valid_step = {
        "step_title": "Day 1: Understanding Anger",
        "today_focus": "krodha",
        "verse_refs": [{"chapter": 2, "verse": 63}],
        "teaching": "Today we explore the nature of anger." * 5,
        "guided_reflection": ["Question 1?", "Question 2?"],
        "practice": {
            "name": "Breath Awareness",
            "instructions": ["Step 1", "Step 2"],
            "duration_minutes": 5,
        },
        "micro_commitment": "I will pause before reacting.",
        "check_in_prompt": {"scale": "0-10", "label": "Anger intensity?"},
    }

    step = JourneyStepSchema(**valid_step)
    assert_equal(step.step_title, "Day 1: Understanding Anger")
    assert_equal(step.today_focus, "krodha")


@registry.register("service", "JourneyStepSchema rejects invalid focus")
def test_step_schema_invalid_focus():
    """Verify invalid enemy focus is rejected."""
    from backend.services.journey_coach import JourneyStepSchema
    from pydantic import ValidationError

    invalid_step = {
        "step_title": "Test",
        "today_focus": "invalid_enemy",
        "verse_refs": [{"chapter": 2, "verse": 47}],
        "teaching": "x" * 60,
        "guided_reflection": ["q"],
        "practice": {"name": "p", "instructions": ["i"], "duration_minutes": 5},
        "micro_commitment": "x" * 15,
        "check_in_prompt": {"scale": "0-10", "label": "test"},
    }

    try:
        JourneyStepSchema(**invalid_step)
        raise AssertionError("Should reject invalid focus")
    except ValidationError:
        pass


@registry.register("service", "VerseRefSchema validates chapter range")
def test_verse_ref_chapter_range():
    """Verify chapter must be 1-18."""
    from backend.services.journey_coach import VerseRefSchema
    from pydantic import ValidationError

    # Valid
    valid = VerseRefSchema(chapter=1, verse=1)
    assert_equal(valid.chapter, 1)

    valid = VerseRefSchema(chapter=18, verse=78)
    assert_equal(valid.chapter, 18)

    # Invalid - chapter 0
    try:
        VerseRefSchema(chapter=0, verse=1)
        raise AssertionError("Should reject chapter 0")
    except ValidationError:
        pass

    # Invalid - chapter 19
    try:
        VerseRefSchema(chapter=19, verse=1)
        raise AssertionError("Should reject chapter 19")
    except ValidationError:
        pass


@registry.register("service", "VerseRefSchema validates verse is positive")
def test_verse_ref_verse_positive():
    """Verify verse must be positive."""
    from backend.services.journey_coach import VerseRefSchema
    from pydantic import ValidationError

    # Valid
    valid = VerseRefSchema(chapter=2, verse=1)
    assert_equal(valid.verse, 1)

    # Invalid - verse 0
    try:
        VerseRefSchema(chapter=2, verse=0)
        raise AssertionError("Should reject verse 0")
    except ValidationError:
        pass


# ===========================================================================
# VERSE PICKER TESTS
# ===========================================================================

@registry.register("service", "VersePicker initializes correctly")
def test_verse_picker_init():
    """Verify VersePicker initializes."""
    from backend.services.journey_engine_enhanced import VersePicker

    picker = VersePicker()
    assert_true(picker is not None, "VersePicker should initialize")


# ===========================================================================
# STEP GENERATOR TESTS
# ===========================================================================

@registry.register("service", "StepGenerator initializes correctly")
def test_step_generator_init():
    """Verify StepGenerator initializes."""
    from backend.services.journey_engine_enhanced import StepGenerator

    generator = StepGenerator()
    assert_true(generator is not None, "StepGenerator should initialize")


# ===========================================================================
# ENHANCED JOURNEY ENGINE TESTS
# ===========================================================================

@registry.register("service", "EnhancedJourneyEngine initializes correctly")
def test_engine_init():
    """Verify EnhancedJourneyEngine initializes."""
    from backend.services.journey_engine_enhanced import EnhancedJourneyEngine

    engine = EnhancedJourneyEngine()
    assert_true(engine is not None, "Engine should initialize")
