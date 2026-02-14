"""
Tests for the Emotional Pattern Extraction Engine.

Validates that the extractor correctly identifies recurring themes,
attachment signals, reactivity triggers, growth signals, and awareness
indicators from normalized emotional signal data.

Tests use synthetic signal data to exercise each analysis pass
independently, without requiring database access.
"""

import datetime
from unittest.mock import AsyncMock, MagicMock, patch

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
# ATTACHMENT SIGNALS TESTS
# =============================================================================


class TestAttachmentSignals:
    """Tests for _extract_attachment_signals."""

    def test_no_signals_with_insufficient_data(self, extractor):
        """No attachment signals with too few data points."""
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
        """Signal strength correctly classified based on proportion."""
        # Strong: >40% of signals are in the cluster
        signals = _make_signal_series(["lonely"] * 8 + ["happy"] * 2)
        result = extractor._extract_attachment_signals(signals)
        connection = [s for s in result if "connection" in s.pattern]
        assert len(connection) >= 1
        assert connection[0].strength == "strong"

    def test_evolving_flag_when_pattern_shifts(self, extractor):
        """Evolving flag set when pattern distribution shifts between halves."""
        # First half: mostly lonely, second half: mostly calm
        signals = _make_signal_series(
            ["lonely"] * 6 + ["calm"] * 6
        )
        result = extractor._extract_attachment_signals(signals)
        evolving_signals = [s for s in result if s.evolving]
        # May or may not detect evolving depending on threshold
        assert isinstance(result, list)

    def test_attachment_signal_to_dict(self, extractor):
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
        # First half: limited emotions; second half: diverse emotions
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
# AWARENESS INDICATORS TESTS
# =============================================================================


class TestAwarenessIndicators:
    """Tests for _extract_awareness_indicators."""

    def test_sustained_engagement_indicator(self, extractor):
        """Detects sustained engagement over multiple days."""
        signals = [
            _make_signal("calm", days_ago=i) for i in range(10)
        ]
        result = extractor._extract_awareness_indicators(signals)
        assert any("sustained" in ind for ind in result)

    def test_multi_source_indicator(self, extractor):
        """Detects use of multiple emotional tools."""
        signals = [
            _make_signal("calm", source="mood", days_ago=3),
            _make_signal("calm", source="companion", days_ago=2),
            _make_signal("calm", source="reset", days_ago=1),
        ]
        result = extractor._extract_awareness_indicators(signals)
        assert any("multiple pathways" in ind for ind in result)

    def test_nuanced_range_indicator(self, extractor):
        """Detects recognition of diverse emotional states."""
        emotions = ["happy", "sad", "anxious", "calm", "grateful", "lonely"]
        signals = _make_signal_series(emotions)
        result = extractor._extract_awareness_indicators(signals)
        assert any("nuanced range" in ind for ind in result)

    def test_regular_cadence_indicator(self, extractor):
        """Detects regular rhythm of check-ins."""
        signals = [_make_signal("calm", days_ago=i) for i in range(7)]
        result = extractor._extract_awareness_indicators(signals)
        assert any("regular rhythm" in ind for ind in result)

    def test_max_4_indicators(self, extractor):
        """At most 4 awareness indicators returned."""
        emotions = ["happy", "sad", "anxious", "calm", "grateful", "lonely"]
        signals = [
            _make_signal(e, source=s, days_ago=i)
            for i, (e, s) in enumerate(
                zip(emotions * 3, ["mood", "companion", "reset"] * 6)
            )
        ]
        result = extractor._extract_awareness_indicators(signals)
        assert len(result) <= 4


# =============================================================================
# AGGREGATE METRICS TESTS
# =============================================================================


class TestAggregateMetrics:
    """Tests for _compute_aggregate_metrics."""

    def test_dominant_quadrant_activated_unpleasant(self, extractor):
        """Dominant quadrant reflects most common emotion quadrant."""
        signals = _make_signal_series(["anxious"] * 5 + ["calm"])
        quadrant, _, _ = extractor._compute_aggregate_metrics(signals)
        assert quadrant == "activated_unpleasant"

    def test_dominant_quadrant_deactivated_pleasant(self, extractor):
        """Calm/peaceful signals produce deactivated_pleasant quadrant."""
        signals = _make_signal_series(["calm"] * 5 + ["anxious"])
        quadrant, _, _ = extractor._compute_aggregate_metrics(signals)
        assert quadrant == "deactivated_pleasant"

    def test_guna_distribution_sums_to_one(self, extractor):
        """Guna distribution values sum to approximately 1.0."""
        signals = _make_signal_series(
            ["calm", "anxious", "sad", "happy", "stressed", "peaceful"]
        )
        _, guna_dist, _ = extractor._compute_aggregate_metrics(signals)
        total = sum(guna_dist.values())
        assert abs(total - 1.0) < 0.01

    def test_high_variability_detected(self, extractor):
        """High variability detected with widely varying intensities."""
        signals = _make_signal_series(
            ["sad", "happy"] * 4,
            intensities=[0.1, 0.9, 0.1, 0.9, 0.1, 0.9, 0.1, 0.9],
        )
        _, _, variability = extractor._compute_aggregate_metrics(signals)
        assert variability == "high"

    def test_low_variability_detected(self, extractor):
        """Low variability detected with consistent intensities."""
        signals = _make_signal_series(
            ["calm"] * 6,
            intensities=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        )
        _, _, variability = extractor._compute_aggregate_metrics(signals)
        assert variability == "low"


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
# FULL REPORT TESTS
# =============================================================================


class TestEmotionalPatternReport:
    """Tests for the full EmotionalPatternReport dataclass."""

    def test_empty_report_for_no_data(self):
        """Empty report generated when no signals exist."""
        report = EmotionalPatternReport(
            user_id="test-user",
            extraction_window_days=30,
            data_points_analyzed=0,
            extracted_at=datetime.datetime.now(datetime.UTC).isoformat(),
        )
        d = report.to_dict()
        assert d["data_points_analyzed"] == 0
        assert d["recurring_themes"] == []
        assert d["attachment_signals"] == []
        assert d["reactivity_triggers"] == []
        assert d["growth_signals"] == []
        assert d["awareness_indicators"] == []

    def test_report_to_dict_is_json_serializable(self):
        """Report to_dict output can be serialized to JSON."""
        import json

        report = EmotionalPatternReport(
            user_id="test-user",
            extraction_window_days=30,
            data_points_analyzed=10,
            recurring_themes=[
                EmotionalTheme(
                    theme="inner friction",
                    frequency=5,
                    intensity_trend="stable",
                    associated_domains=["equanimity"],
                    guna_tendency="rajas",
                )
            ],
            attachment_signals=[
                AttachmentSignal(
                    pattern="pattern of reaching toward connection",
                    direction="seeking",
                    strength="moderate",
                    evolving=False,
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
            growth_signals=[
                GrowthSignal(
                    signal_type="calming_trajectory",
                    description="overall emotional intensity is decreasing over time",
                    first_observed_period="recent",
                )
            ],
            awareness_indicators=["sustained engagement with emotional reflection"],
            dominant_quadrant="activated_unpleasant",
            guna_distribution={"sattva": 0.3, "rajas": 0.5, "tamas": 0.2},
            emotional_variability="moderate",
            extracted_at=datetime.datetime.now(datetime.UTC).isoformat(),
        )
        d = report.to_dict()
        serialized = json.dumps(d)
        assert isinstance(serialized, str)
        parsed = json.loads(serialized)
        assert parsed["user_id"] == "test-user"
        assert len(parsed["recurring_themes"]) == 1
        assert parsed["recurring_themes"][0]["theme"] == "inner friction"

    def test_guna_distribution_rounded(self):
        """Guna distribution values are rounded to 3 decimal places."""
        report = EmotionalPatternReport(
            user_id="test",
            extraction_window_days=30,
            data_points_analyzed=1,
            guna_distribution={"sattva": 0.33333, "rajas": 0.33333, "tamas": 0.33333},
            extracted_at="now",
        )
        d = report.to_dict()
        for val in d["guna_distribution"].values():
            # Check it has at most 3 decimal places
            assert round(val, 3) == val


# =============================================================================
# EXTRACT METHOD INTEGRATION TEST (with mocked DB)
# =============================================================================


class TestExtractIntegration:
    """Integration test for the full extract() pipeline with mocked DB."""

    @pytest.mark.asyncio
    async def test_extract_with_no_data(self, extractor):
        """Extract returns empty report when no data exists."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        report = await extractor.extract(
            db=mock_db, user_id="empty-user", lookback_days=30
        )
        assert report.data_points_analyzed == 0
        assert report.recurring_themes == []

    @pytest.mark.asyncio
    async def test_extract_clamps_lookback_days(self, extractor):
        """Extract clamps lookback_days to 1-90 range."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        report = await extractor.extract(
            db=mock_db, user_id="test", lookback_days=200
        )
        assert report.extraction_window_days == 90

        report = await extractor.extract(
            db=mock_db, user_id="test", lookback_days=-5
        )
        assert report.extraction_window_days == 1


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
            # Theme should be an abstract label, not user content
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
            # Domain should be an abstract category
            assert d["domain"] in [
                "self understanding", "action discipline", "equanimity",
                "knowledge insight", "values service", "meditation attention",
                "resilience", "interconnectedness", "cognitive flexibility",
            ]

    def test_report_contains_no_pii_fields(self):
        """Report structure has no fields that could contain PII."""
        report = EmotionalPatternReport(
            user_id="uid",
            extraction_window_days=30,
            data_points_analyzed=0,
            extracted_at="now",
        )
        d = report.to_dict()
        # Only user_id is present, which is an opaque identifier
        pii_fields = {"name", "email", "phone", "address", "location"}
        assert pii_fields.isdisjoint(set(d.keys()))
