"""
Tests for the Emotional Pattern Extraction Engine.

Validates that the extractor correctly identifies recurring themes,
attachment patterns, reactivity triggers, growth signals, and produces
the correct emotional_intensity_estimate and self_awareness_level_estimate.

Tests use synthetic signal data to exercise each analysis pass
independently, without requiring database access.

Expected output schema:
{
    "recurring_themes": [],
    "reactivity_triggers": [],
    "attachment_patterns": [],
    "growth_signals": [],
    "emotional_intensity_estimate": "low | medium | high",
    "self_awareness_level_estimate": "emerging | moderate | strong"
}
"""

import datetime
import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.services.emotional_pattern_extraction import (
    AttachmentSignal,
    EmotionalPatternExtractor,
    EmotionalPatternReport,
    EmotionalTheme,
    GrowthSignal,
    ReactivityTrigger,
    _EMOTION_ABSTRACTIONS,
)


# =============================================================================
# HELPERS
# =============================================================================


def _make_signal(
    emotion: str,
    intensity: float = 0.5,
    domain: str = "self_understanding",
    source: str = "mood",
    tags: list[str] | None = None,
    days_ago: int = 0,
) -> dict:
    """Create a normalized signal dict for testing."""
    return {
        "timestamp": datetime.datetime.now(datetime.UTC)
        - datetime.timedelta(days=days_ago),
        "emotion": emotion,
        "intensity": intensity,
        "domain": domain,
        "source": source,
        "tags": tags or [],
    }


def _make_signal_series(
    emotions: list[str],
    intensities: list[float] | None = None,
    domain: str = "self_understanding",
    source: str = "mood",
) -> list[dict]:
    """Create a chronological series of signals."""
    n = len(emotions)
    if intensities is None:
        intensities = [0.5] * n
    signals = []
    for i, (emotion, intensity) in enumerate(zip(emotions, intensities)):
        signals.append(
            _make_signal(
                emotion=emotion,
                intensity=intensity,
                domain=domain,
                source=source,
                days_ago=n - i,
            )
        )
    return signals


@pytest.fixture
def extractor():
    """Create a fresh extractor instance."""
    return EmotionalPatternExtractor()


# =============================================================================
# OUTPUT SCHEMA TESTS
# =============================================================================


class TestOutputSchema:
    """Verify that the output matches the exact expected JSON schema."""

    def test_output_has_exactly_six_keys(self):
        """Report to_dict produces exactly the 6 required keys."""
        report = EmotionalPatternReport()
        d = report.to_dict()
        expected_keys = {
            "recurring_themes",
            "reactivity_triggers",
            "attachment_patterns",
            "growth_signals",
            "emotional_intensity_estimate",
            "self_awareness_level_estimate",
        }
        assert set(d.keys()) == expected_keys

    def test_empty_report_defaults(self):
        """Empty report has correct default values."""
        report = EmotionalPatternReport()
        d = report.to_dict()
        assert d["recurring_themes"] == []
        assert d["reactivity_triggers"] == []
        assert d["attachment_patterns"] == []
        assert d["growth_signals"] == []
        assert d["emotional_intensity_estimate"] == "medium"
        assert d["self_awareness_level_estimate"] == "emerging"

    def test_output_is_json_serializable(self):
        """Report to_dict output can be serialized to valid JSON."""
        report = EmotionalPatternReport(
            recurring_themes=[
                EmotionalTheme(
                    theme="inner friction",
                    frequency=5,
                    intensity_trend="stable",
                    associated_domains=["equanimity"],
                    guna_tendency="rajas",
                )
            ],
            reactivity_triggers=[
                ReactivityTrigger(
                    domain="resilience",
                    emotional_response="unsettledness",
                    recurrence=3,
                    intensity_level="high",
                )
            ],
            attachment_patterns=[
                AttachmentSignal(
                    pattern="pattern of reaching toward connection",
                    direction="seeking",
                    strength="moderate",
                    evolving=False,
                )
            ],
            growth_signals=[
                GrowthSignal(
                    signal_type="calming_trajectory",
                    description="overall emotional intensity is decreasing over time",
                    first_observed_period="recent",
                )
            ],
            emotional_intensity_estimate="high",
            self_awareness_level_estimate="moderate",
        )
        d = report.to_dict()
        serialized = json.dumps(d)
        parsed = json.loads(serialized)
        assert len(parsed["recurring_themes"]) == 1
        assert parsed["emotional_intensity_estimate"] == "high"
        assert parsed["self_awareness_level_estimate"] == "moderate"

    def test_intensity_estimate_valid_values(self):
        """emotional_intensity_estimate only uses low/medium/high."""
        for val in ["low", "medium", "high"]:
            report = EmotionalPatternReport(emotional_intensity_estimate=val)
            assert report.to_dict()["emotional_intensity_estimate"] == val

    def test_awareness_estimate_valid_values(self):
        """self_awareness_level_estimate only uses emerging/moderate/strong."""
        for val in ["emerging", "moderate", "strong"]:
            report = EmotionalPatternReport(self_awareness_level_estimate=val)
            assert report.to_dict()["self_awareness_level_estimate"] == val


# =============================================================================
# RECURRING THEMES TESTS
# =============================================================================


class TestRecurringThemes:
    """Tests for _extract_recurring_themes."""

    def test_no_themes_with_insufficient_data(self, extractor):
        """No themes returned when data points are below threshold."""
        signals = [_make_signal("sad"), _make_signal("happy")]
        themes = extractor._extract_recurring_themes(signals)
        assert themes == []

    def test_identifies_dominant_theme(self, extractor):
        """Correctly identifies the most frequent emotional theme."""
        signals = _make_signal_series(
            ["anxious", "anxious", "anxious", "happy", "sad"]
        )
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 1
        assert themes[0].theme == _EMOTION_ABSTRACTIONS["anxious"]
        assert themes[0].frequency == 3

    def test_multiple_themes_ordered_by_frequency(self, extractor):
        """Multiple themes returned in descending frequency order."""
        emotions = ["sad"] * 5 + ["anxious"] * 4 + ["happy"] * 3
        signals = _make_signal_series(emotions)
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 2
        assert themes[0].frequency >= themes[1].frequency

    def test_intensity_trend_increasing(self, extractor):
        """Detects increasing intensity trend."""
        signals = _make_signal_series(
            ["anxious"] * 9,
            intensities=[0.2, 0.2, 0.2, 0.4, 0.4, 0.4, 0.7, 0.8, 0.9],
        )
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 1
        assert themes[0].intensity_trend == "increasing"

    def test_intensity_trend_decreasing(self, extractor):
        """Detects decreasing intensity trend."""
        signals = _make_signal_series(
            ["sad"] * 9,
            intensities=[0.9, 0.8, 0.7, 0.5, 0.5, 0.5, 0.2, 0.2, 0.1],
        )
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 1
        assert themes[0].intensity_trend == "decreasing"

    def test_intensity_trend_stable(self, extractor):
        """Detects stable intensity trend."""
        signals = _make_signal_series(
            ["calm"] * 6,
            intensities=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        )
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 1
        assert themes[0].intensity_trend == "stable"

    def test_associated_domains_populated(self, extractor):
        """Theme associated domains are populated from signal domains."""
        signals = []
        for i in range(5):
            signals.append(
                _make_signal("stressed", domain="action_discipline", days_ago=5 - i)
            )
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 1
        assert "action_discipline" in themes[0].associated_domains

    def test_guna_tendency_for_rajasic_emotions(self, extractor):
        """Rajasic emotions produce rajas guna tendency."""
        signals = _make_signal_series(
            ["anxious"] * 5, intensities=[0.7] * 5
        )
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 1
        assert themes[0].guna_tendency == "rajas"

    def test_guna_tendency_for_sattvic_emotions(self, extractor):
        """Sattvic emotions produce sattva guna tendency."""
        signals = _make_signal_series(
            ["peaceful"] * 5, intensities=[0.4] * 5
        )
        themes = extractor._extract_recurring_themes(signals)
        assert len(themes) >= 1
        assert themes[0].guna_tendency == "sattva"

    def test_theme_to_dict_serialization(self, extractor):
        """EmotionalTheme.to_dict produces correct structure."""
        theme = EmotionalTheme(
            theme="inner friction",
            frequency=4,
            intensity_trend="stable",
            associated_domains=["equanimity"],
            guna_tendency="rajas",
        )
        d = theme.to_dict()
        assert d["theme"] == "inner friction"
        assert d["frequency"] == 4
        assert isinstance(d["associated_domains"], list)


# =============================================================================
# ATTACHMENT PATTERNS TESTS
# =============================================================================


class TestAttachmentPatterns:
    """Tests for _extract_attachment_signals (output key: attachment_patterns)."""

    def test_no_patterns_with_insufficient_data(self, extractor):
        """No attachment patterns with too few data points."""
        signals = [_make_signal("sad")]
        result = extractor._extract_attachment_signals(signals)
        assert result == []

    def test_connection_seeking_detected(self, extractor):
        """Detects connection seeking pattern from lonely/hurt signals."""
        signals = _make_signal_series(
            ["lonely"] * 4 + ["hurt"] * 3 + ["happy"] * 2
        )
        result = extractor._extract_attachment_signals(signals)
        seeking = [s for s in result if s.direction == "seeking"]
        assert len(seeking) >= 1

    def test_withdrawal_tendency_detected(self, extractor):
        """Detects withdrawal tendency from overwhelm/stress signals."""
        signals = _make_signal_series(
            ["overwhelmed"] * 5 + ["stressed"] * 4 + ["calm"]
        )
        result = extractor._extract_attachment_signals(signals)
        avoiding = [s for s in result if s.direction == "avoiding"]
        assert len(avoiding) >= 1

    def test_strength_classification(self, extractor):
        """Pattern strength correctly classified based on proportion."""
        signals = _make_signal_series(["lonely"] * 8 + ["happy"] * 2)
        result = extractor._extract_attachment_signals(signals)
        connection = [s for s in result if "connection" in s.pattern]
        assert len(connection) >= 1
        assert connection[0].strength == "strong"

    def test_evolving_flag_type(self, extractor):
        """Evolving flag is a boolean."""
        signals = _make_signal_series(["lonely"] * 6 + ["calm"] * 6)
        result = extractor._extract_attachment_signals(signals)
        for sig in result:
            assert isinstance(sig.evolving, bool)

    def test_attachment_pattern_to_dict(self, extractor):
        """AttachmentSignal.to_dict produces correct structure."""
        sig = AttachmentSignal(
            pattern="pattern of reaching toward connection",
            direction="seeking",
            strength="moderate",
            evolving=True,
        )
        d = sig.to_dict()
        assert d["direction"] == "seeking"
        assert d["evolving"] is True


# =============================================================================
# REACTIVITY TRIGGERS TESTS
# =============================================================================


class TestReactivityTriggers:
    """Tests for _extract_reactivity_triggers."""

    def test_no_triggers_with_insufficient_data(self, extractor):
        """No triggers returned when data is insufficient."""
        signals = [_make_signal("anxious", intensity=0.8)]
        result = extractor._extract_reactivity_triggers(signals)
        assert result == []

    def test_high_intensity_domain_flagged(self, extractor):
        """Domain with notably elevated intensity is flagged as trigger."""
        signals = [
            _make_signal("anxious", intensity=0.9, domain="resilience", days_ago=5),
            _make_signal("stressed", intensity=0.8, domain="resilience", days_ago=4),
            _make_signal("calm", intensity=0.2, domain="equanimity", days_ago=3),
            _make_signal("calm", intensity=0.3, domain="equanimity", days_ago=2),
            _make_signal("calm", intensity=0.2, domain="self_understanding", days_ago=1),
        ]
        result = extractor._extract_reactivity_triggers(signals)
        domains = [t.domain for t in result]
        assert "resilience" in domains

    def test_intensity_level_classification(self, extractor):
        """Trigger intensity level correctly classified."""
        signals = [
            _make_signal("angry", intensity=0.9, domain="resilience", days_ago=3),
            _make_signal("frustrated", intensity=0.8, domain="resilience", days_ago=2),
            _make_signal("calm", intensity=0.1, domain="equanimity", days_ago=1),
        ]
        result = extractor._extract_reactivity_triggers(signals)
        resilience_trigger = [t for t in result if t.domain == "resilience"]
        if resilience_trigger:
            assert resilience_trigger[0].intensity_level == "high"

    def test_triggers_sorted_by_recurrence(self, extractor):
        """Triggers are sorted by recurrence (most frequent first)."""
        signals = [
            _make_signal("anxious", intensity=0.8, domain="action_discipline", days_ago=7),
            _make_signal("stressed", intensity=0.7, domain="action_discipline", days_ago=6),
            _make_signal("stressed", intensity=0.7, domain="action_discipline", days_ago=5),
            _make_signal("anxious", intensity=0.8, domain="resilience", days_ago=4),
            _make_signal("stressed", intensity=0.7, domain="resilience", days_ago=3),
            _make_signal("calm", intensity=0.1, domain="equanimity", days_ago=2),
            _make_signal("calm", intensity=0.1, domain="equanimity", days_ago=1),
        ]
        result = extractor._extract_reactivity_triggers(signals)
        if len(result) >= 2:
            assert result[0].recurrence >= result[1].recurrence

    def test_max_5_triggers_returned(self, extractor):
        """At most 5 triggers are returned."""
        signals = []
        domains = [
            "self_understanding", "action_discipline", "equanimity",
            "knowledge_insight", "values_service", "meditation_attention",
            "resilience",
        ]
        for i, domain in enumerate(domains):
            for j in range(3):
                signals.append(
                    _make_signal(
                        "stressed",
                        intensity=0.8,
                        domain=domain,
                        days_ago=i * 3 + j + 1,
                    )
                )
        result = extractor._extract_reactivity_triggers(signals)
        assert len(result) <= 5

    def test_reactivity_trigger_to_dict(self, extractor):
        """ReactivityTrigger.to_dict produces correct structure."""
        trigger = ReactivityTrigger(
            domain="resilience",
            emotional_response="unsettledness",
            recurrence=5,
            intensity_level="high",
        )
        d = trigger.to_dict()
        assert d["domain"] == "resilience"
        assert d["recurrence"] == 5


# =============================================================================
# GROWTH SIGNALS TESTS
# =============================================================================


class TestGrowthSignals:
    """Tests for _extract_growth_signals."""

    def test_no_growth_with_insufficient_data(self, extractor):
        """No growth signals with too few data points."""
        signals = [_make_signal("anxious"), _make_signal("calm")]
        result = extractor._extract_growth_signals(signals)
        assert result == []

    def test_calming_trajectory_detected(self, extractor):
        """Detects calming trajectory when intensity decreases over time."""
        signals = _make_signal_series(
            ["stressed"] * 4 + ["calm"] * 4,
            intensities=[0.8, 0.8, 0.8, 0.7, 0.3, 0.3, 0.2, 0.2],
        )
        result = extractor._extract_growth_signals(signals)
        types = [g.signal_type for g in result]
        assert "calming_trajectory" in types

    def test_expanding_awareness_detected(self, extractor):
        """Detects expanding awareness when emotional vocabulary grows."""
        signals = _make_signal_series(
            ["sad", "sad", "sad", "sad", "happy", "calm", "anxious", "hopeful", "grateful", "excited"]
        )
        result = extractor._extract_growth_signals(signals)
        types = [g.signal_type for g in result]
        assert "expanding_awareness" in types

    def test_proactive_engagement_detected(self, extractor):
        """Detects increasing use of reset tools."""
        first_half = [
            _make_signal("sad", source="mood", days_ago=10),
            _make_signal("sad", source="mood", days_ago=9),
            _make_signal("sad", source="mood", days_ago=8),
            _make_signal("sad", source="mood", days_ago=7),
            _make_signal("sad", source="companion", days_ago=6),
        ]
        second_half = [
            _make_signal("calm", source="reset", days_ago=5),
            _make_signal("calm", source="reset", days_ago=4),
            _make_signal("calm", source="reset", days_ago=3),
            _make_signal("calm", source="mood", days_ago=2),
            _make_signal("calm", source="mood", days_ago=1),
        ]
        signals = first_half + second_half
        result = extractor._extract_growth_signals(signals)
        types = [g.signal_type for g in result]
        assert "proactive_engagement" in types

    def test_positive_shift_detected(self, extractor):
        """Detects shift toward more pleasant emotional states."""
        signals = _make_signal_series(
            ["angry", "stressed", "sad", "sad", "sad",
             "calm", "peaceful", "happy", "grateful", "hopeful"]
        )
        result = extractor._extract_growth_signals(signals)
        types = [g.signal_type for g in result]
        assert "positive_shift" in types

    def test_growth_signal_to_dict(self, extractor):
        """GrowthSignal.to_dict produces correct structure."""
        gs = GrowthSignal(
            signal_type="calming_trajectory",
            description="overall emotional intensity is decreasing over time",
            first_observed_period="recent",
        )
        d = gs.to_dict()
        assert d["signal_type"] == "calming_trajectory"
        assert d["first_observed_period"] == "recent"


# =============================================================================
# EMOTIONAL INTENSITY ESTIMATE TESTS
# =============================================================================


class TestEmotionalIntensityEstimate:
    """Tests for _compute_emotional_intensity_estimate."""

    def test_high_intensity(self, extractor):
        """High average intensity produces 'high' estimate."""
        signals = _make_signal_series(
            ["angry"] * 5, intensities=[0.8, 0.9, 0.7, 0.8, 0.9]
        )
        result = extractor._compute_emotional_intensity_estimate(signals)
        assert result == "high"

    def test_medium_intensity(self, extractor):
        """Medium average intensity produces 'medium' estimate."""
        signals = _make_signal_series(
            ["neutral"] * 5, intensities=[0.4, 0.5, 0.5, 0.4, 0.5]
        )
        result = extractor._compute_emotional_intensity_estimate(signals)
        assert result == "medium"

    def test_low_intensity(self, extractor):
        """Low average intensity produces 'low' estimate."""
        signals = _make_signal_series(
            ["calm"] * 5, intensities=[0.1, 0.2, 0.1, 0.2, 0.1]
        )
        result = extractor._compute_emotional_intensity_estimate(signals)
        assert result == "low"

    def test_empty_signals_returns_medium(self, extractor):
        """Empty signals default to 'medium'."""
        result = extractor._compute_emotional_intensity_estimate([])
        assert result == "medium"

    def test_returns_only_valid_values(self, extractor):
        """Result is always one of low/medium/high."""
        for intensities in [[0.1] * 5, [0.5] * 5, [0.9] * 5]:
            signals = _make_signal_series(
                ["neutral"] * 5, intensities=intensities
            )
            result = extractor._compute_emotional_intensity_estimate(signals)
            assert result in {"low", "medium", "high"}


# =============================================================================
# SELF AWARENESS LEVEL ESTIMATE TESTS
# =============================================================================


class TestSelfAwarenessLevelEstimate:
    """Tests for _compute_self_awareness_level."""

    def test_emerging_with_minimal_data(self, extractor):
        """Minimal signals produce 'emerging' awareness level."""
        signals = [_make_signal("sad", source="mood")]
        result = extractor._compute_self_awareness_level(signals, [], [])
        assert result == "emerging"

    def test_moderate_with_some_indicators(self, extractor):
        """Some awareness indicators and growth signals produce 'moderate'."""
        signals = _make_signal_series(
            ["sad", "happy", "anxious", "calm"], source="mood"
        )
        indicators = [
            "sustained engagement",
            "recognizing a nuanced range",
        ]
        growth = [
            GrowthSignal("calming_trajectory", "desc", "recent"),
        ]
        result = extractor._compute_self_awareness_level(
            signals, indicators, growth
        )
        assert result == "moderate"

    def test_strong_with_rich_engagement(self, extractor):
        """Rich engagement across multiple dimensions produces 'strong'."""
        emotions = ["sad", "happy", "anxious", "calm", "grateful", "hopeful"]
        signals = []
        for i, e in enumerate(emotions):
            signals.append(
                _make_signal(e, source=["mood", "companion", "reset"][i % 3], days_ago=i)
            )
        indicators = [
            "sustained engagement",
            "exploring multiple pathways",
            "recognizing a nuanced range",
            "developing a regular rhythm",
        ]
        growth = [
            GrowthSignal("calming_trajectory", "desc", "recent"),
            GrowthSignal("expanding_awareness", "desc", "recent"),
        ]
        result = extractor._compute_self_awareness_level(
            signals, indicators, growth
        )
        assert result == "strong"

    def test_returns_only_valid_values(self, extractor):
        """Result is always one of emerging/moderate/strong."""
        signals = [_make_signal("calm")]
        result = extractor._compute_self_awareness_level(signals, [], [])
        assert result in {"emerging", "moderate", "strong"}


# =============================================================================
# UTILITY HELPERS TESTS
# =============================================================================


class TestUtilityHelpers:
    """Tests for utility methods on the extractor."""

    def test_score_to_emotion_mapping(self, extractor):
        """Mood scores map to correct abstract emotions."""
        assert extractor._score_to_emotion(1) == "sad"
        assert extractor._score_to_emotion(3) == "stressed"
        assert extractor._score_to_emotion(5) == "neutral"
        assert extractor._score_to_emotion(7) == "calm"
        assert extractor._score_to_emotion(10) == "happy"

    def test_score_to_intensity(self, extractor):
        """Extreme scores produce higher intensity."""
        low_intensity = extractor._score_to_intensity(5)
        high_intensity = extractor._score_to_intensity(1)
        assert high_intensity > low_intensity

    def test_score_to_intensity_bounds(self, extractor):
        """Intensity values are bounded between 0 and 1."""
        for score in range(1, 11):
            intensity = extractor._score_to_intensity(score)
            assert 0.0 <= intensity <= 1.0

    def test_infer_guna_sattvic(self, extractor):
        """Sattvic emotions produce sattva guna."""
        assert extractor._infer_guna("calm", 0.5) == "sattva"
        assert extractor._infer_guna("peaceful", 0.3) == "sattva"
        assert extractor._infer_guna("grateful", 0.5) == "sattva"

    def test_infer_guna_rajasic(self, extractor):
        """Rajasic emotions produce rajas guna."""
        assert extractor._infer_guna("anxious", 0.7) == "rajas"
        assert extractor._infer_guna("angry", 0.8) == "rajas"
        assert extractor._infer_guna("stressed", 0.6) == "rajas"

    def test_infer_guna_tamasic(self, extractor):
        """Tamasic emotions produce tamas guna."""
        assert extractor._infer_guna("sad", 0.5) == "tamas"
        assert extractor._infer_guna("lonely", 0.4) == "tamas"
        assert extractor._infer_guna("overwhelmed", 0.6) == "tamas"

    def test_emotion_to_quadrant(self, extractor):
        """Emotions map to correct circumplex quadrants."""
        assert extractor._emotion_to_quadrant("happy") == "activated_pleasant"
        assert extractor._emotion_to_quadrant("anxious") == "activated_unpleasant"
        assert extractor._emotion_to_quadrant("calm") == "deactivated_pleasant"
        assert extractor._emotion_to_quadrant("sad") == "deactivated_unpleasant"
        assert extractor._emotion_to_quadrant("neutral") == "balanced"

    def test_compute_intensity_trend_stable(self, extractor):
        """Stable trend for consistent intensities."""
        assert extractor._compute_intensity_trend([0.5, 0.5, 0.5]) == "stable"

    def test_compute_intensity_trend_increasing(self, extractor):
        """Increasing trend for rising intensities."""
        assert extractor._compute_intensity_trend([0.2, 0.4, 0.6, 0.8, 0.9]) == "increasing"

    def test_compute_intensity_trend_decreasing(self, extractor):
        """Decreasing trend for falling intensities."""
        assert extractor._compute_intensity_trend([0.9, 0.7, 0.5, 0.2, 0.1]) == "decreasing"


# =============================================================================
# FULL EXTRACT INTEGRATION TEST (with mocked DB)
# =============================================================================


class TestExtractIntegration:
    """Integration test for the full extract() pipeline with mocked DB."""

    @pytest.mark.asyncio
    async def test_extract_with_no_data_returns_default_schema(self, extractor):
        """Extract returns empty report matching expected schema when no data."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        report = await extractor.extract(
            db=mock_db, user_id="empty-user", lookback_days=30
        )
        d = report.to_dict()

        # Must have exactly the 6 expected keys.
        assert set(d.keys()) == {
            "recurring_themes",
            "reactivity_triggers",
            "attachment_patterns",
            "growth_signals",
            "emotional_intensity_estimate",
            "self_awareness_level_estimate",
        }
        assert d["recurring_themes"] == []
        assert d["reactivity_triggers"] == []
        assert d["attachment_patterns"] == []
        assert d["growth_signals"] == []
        assert d["emotional_intensity_estimate"] in {"low", "medium", "high"}
        assert d["self_awareness_level_estimate"] in {"emerging", "moderate", "strong"}


# =============================================================================
# PRIVACY GUARANTEES TESTS
# =============================================================================


class TestPrivacyGuarantees:
    """Verify that the extraction engine respects privacy constraints."""

    def test_no_user_content_in_themes(self, extractor):
        """Theme descriptions don't contain any user text."""
        signals = _make_signal_series(
            ["anxious"] * 5, intensities=[0.7] * 5
        )
        themes = extractor._extract_recurring_themes(signals)
        for theme in themes:
            d = theme.to_dict()
            assert len(d["theme"]) < 50
            assert d["theme"] in _EMOTION_ABSTRACTIONS.values() or d["theme"] in _EMOTION_ABSTRACTIONS.keys()

    def test_no_specific_events_in_triggers(self, extractor):
        """Trigger descriptions use domain terms, not event details."""
        signals = [
            _make_signal("angry", intensity=0.9, domain="resilience", days_ago=3),
            _make_signal("frustrated", intensity=0.8, domain="resilience", days_ago=2),
            _make_signal("calm", intensity=0.1, domain="equanimity", days_ago=1),
        ]
        triggers = extractor._extract_reactivity_triggers(signals)
        for trigger in triggers:
            d = trigger.to_dict()
            assert d["domain"] in [
                "self understanding", "action discipline", "equanimity",
                "knowledge insight", "values service", "meditation attention",
                "resilience", "interconnectedness", "cognitive flexibility",
            ]

    def test_report_contains_no_pii_fields(self):
        """Report structure has no fields that could contain PII."""
        report = EmotionalPatternReport()
        d = report.to_dict()
        pii_fields = {"name", "email", "phone", "address", "location", "user_id"}
        assert pii_fields.isdisjoint(set(d.keys()))

    def test_no_user_id_in_output(self):
        """Output schema does not include user_id."""
        report = EmotionalPatternReport()
        d = report.to_dict()
        assert "user_id" not in d
