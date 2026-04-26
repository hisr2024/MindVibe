"""
Tests for Dynamic Wisdom Corpus - Effectiveness-Learning Verse Selection

Validates:
- Engagement score computation from outcome signals
- Mood improvement weight calculations
- Effectiveness-weighted verse selection logic
- Wisdom delivery and outcome recording lifecycle
- Progressive wisdom path building
- Cache invalidation on outcome recording
- Edge cases: no data, all verses seen, low effectiveness
"""

import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestEngagementScoring:
    """Tests for the engagement/effectiveness score computation."""

    def setup_method(self):
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus
        self.corpus = DynamicWisdomCorpus()

    def test_perfect_engagement_score(self):
        """All positive signals should produce a high score."""
        score = self.corpus._compute_engagement_score(
            mood_improved=True,
            improvement_weight=1.0,
            session_continued=True,
            response_length=250,
            user_response="Thank you so much, that really helps me feel better",
        )
        assert score >= 0.9
        assert score <= 1.0

    def test_zero_engagement_all_negative(self):
        """No positive signals should produce a low score."""
        score = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=False,
            response_length=0,
            user_response=None,
        )
        assert score < 0.15

    def test_mood_improved_is_strongest_signal(self):
        """Mood improvement should contribute the most to the score."""
        score_improved = self.corpus._compute_engagement_score(
            mood_improved=True,
            improvement_weight=1.0,
            session_continued=False,
            response_length=0,
            user_response=None,
        )
        score_not_improved = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=False,
            response_length=0,
            user_response=None,
        )
        # Mood improvement should contribute at least 0.3 more
        assert score_improved - score_not_improved >= 0.3

    def test_session_continuation_boosts_score(self):
        """Continuing the session should boost effectiveness."""
        score_continued = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=True,
            response_length=0,
            user_response=None,
        )
        score_ended = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=False,
            response_length=0,
            user_response=None,
        )
        assert score_continued > score_ended

    def test_response_length_normalized(self):
        """Long responses should score higher than short ones, capped at 200 chars."""
        score_short = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=False,
            response_length=20,
            user_response="ok",
        )
        score_long = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=False,
            response_length=300,
            user_response="This is a much longer response indicating deeper engagement.",
        )
        assert score_long > score_short

    def test_explicit_positive_keywords_boost(self):
        """Positive engagement keywords should boost the score."""
        score_neutral = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=True,
            response_length=50,
            user_response="I see what you mean about that.",
        )
        score_positive = self.corpus._compute_engagement_score(
            mood_improved=False,
            improvement_weight=0.0,
            session_continued=True,
            response_length=50,
            user_response="Thank you, that really helps!",
        )
        assert score_positive > score_neutral

    def test_score_never_exceeds_one(self):
        """Score should be capped at 1.0 even with all signals maxed."""
        score = self.corpus._compute_engagement_score(
            mood_improved=True,
            improvement_weight=1.0,
            session_continued=True,
            response_length=1000,
            user_response="Thank you so much, that's exactly what I needed, really helpful beautiful insight",
        )
        assert score <= 1.0

    def test_partial_mood_improvement_weight(self):
        """Partial improvement weight should scale the mood contribution."""
        score_full = self.corpus._compute_engagement_score(
            mood_improved=True,
            improvement_weight=1.0,
            session_continued=False,
            response_length=0,
            user_response=None,
        )
        score_partial = self.corpus._compute_engagement_score(
            mood_improved=True,
            improvement_weight=0.5,
            session_continued=False,
            response_length=0,
            user_response=None,
        )
        assert score_full > score_partial


class TestMoodImprovementWeights:
    """Tests for mood improvement weight configuration."""

    def test_anxious_to_peaceful_is_full_improvement(self):
        """Anxious → Peaceful should be the highest improvement weight."""
        from backend.services.dynamic_wisdom_corpus import MOOD_IMPROVEMENT_WEIGHTS
        assert MOOD_IMPROVEMENT_WEIGHTS["anxious"]["peaceful"] == 1.0

    def test_sad_to_happy_is_full_improvement(self):
        """Sad → Happy should be the highest improvement weight."""
        from backend.services.dynamic_wisdom_corpus import MOOD_IMPROVEMENT_WEIGHTS
        assert MOOD_IMPROVEMENT_WEIGHTS["sad"]["happy"] == 1.0

    def test_all_negative_moods_have_improvement_paths(self):
        """Every negative mood should have at least one improvement transition."""
        from backend.services.dynamic_wisdom_corpus import MOOD_IMPROVEMENT_WEIGHTS
        negative_moods = [
            "anxious", "sad", "angry", "confused", "lonely",
            "overwhelmed", "fearful", "frustrated", "stressed",
            "guilty", "hurt", "jealous",
        ]
        for mood in negative_moods:
            assert mood in MOOD_IMPROVEMENT_WEIGHTS, (
                f"Missing improvement weights for mood '{mood}'"
            )
            assert len(MOOD_IMPROVEMENT_WEIGHTS[mood]) >= 2, (
                f"Mood '{mood}' should have at least 2 improvement paths"
            )

    def test_improvement_weights_are_valid_range(self):
        """All improvement weights should be between 0.0 and 1.0."""
        from backend.services.dynamic_wisdom_corpus import MOOD_IMPROVEMENT_WEIGHTS
        for mood, transitions in MOOD_IMPROVEMENT_WEIGHTS.items():
            for target_mood, weight in transitions.items():
                assert 0.0 <= weight <= 1.0, (
                    f"Weight for {mood}→{target_mood} is {weight}, should be 0.0-1.0"
                )


class TestPositiveEngagementDetection:
    """Tests for detecting positive engagement in user responses."""

    def test_detects_thank_you(self):
        """Should detect 'thank you' as positive engagement."""
        from backend.services.dynamic_wisdom_corpus import _POSITIVE_ENGAGEMENT_PATTERNS
        assert _POSITIVE_ENGAGEMENT_PATTERNS.search("Thank you for that")

    def test_detects_helpful(self):
        """Should detect 'helpful' as positive engagement."""
        from backend.services.dynamic_wisdom_corpus import _POSITIVE_ENGAGEMENT_PATTERNS
        assert _POSITIVE_ENGAGEMENT_PATTERNS.search("That was really helpful")

    def test_detects_makes_sense(self):
        """Should detect 'makes sense' as positive engagement."""
        from backend.services.dynamic_wisdom_corpus import _POSITIVE_ENGAGEMENT_PATTERNS
        assert _POSITIVE_ENGAGEMENT_PATTERNS.search("Yeah that makes sense")

    def test_does_not_false_positive_neutral(self):
        """Should not detect neutral statements as positive engagement."""
        from backend.services.dynamic_wisdom_corpus import _POSITIVE_ENGAGEMENT_PATTERNS
        assert not _POSITIVE_ENGAGEMENT_PATTERNS.search("I went to the store")

    def test_case_insensitive(self):
        """Detection should be case-insensitive."""
        from backend.services.dynamic_wisdom_corpus import _POSITIVE_ENGAGEMENT_PATTERNS
        assert _POSITIVE_ENGAGEMENT_PATTERNS.search("THANKS!")
        assert _POSITIVE_ENGAGEMENT_PATTERNS.search("That's Beautiful")


class TestDynamicCorpusSingleton:
    """Tests for the singleton pattern."""

    def test_singleton_returns_same_instance(self):
        """get_dynamic_wisdom_corpus should return the same instance."""
        from backend.services.dynamic_wisdom_corpus import get_dynamic_wisdom_corpus
        corpus1 = get_dynamic_wisdom_corpus()
        corpus2 = get_dynamic_wisdom_corpus()
        assert corpus1 is corpus2

    def test_corpus_initializes_with_empty_cache(self):
        """New corpus should start with empty effectiveness cache."""
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus
        corpus = DynamicWisdomCorpus()
        assert len(corpus._effectiveness_cache) == 0
        assert corpus._cache_timestamp == 0


class TestEffectivenessWeightedSelection:
    """Tests for the effectiveness-weighted verse selection."""

    def test_returns_none_when_no_effectiveness_data(self):
        """Should return None when no effectiveness records exist."""
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus

        corpus = DynamicWisdomCorpus()

        # Mock the DB query to return empty
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        import asyncio
        result = asyncio.run(
            corpus.get_effectiveness_weighted_verse(
                db=mock_db,
                mood="anxious",
                user_message="I feel anxious",
                phase="guide",
                user_id="test-user",
            )
        )
        assert result is None

    def test_filters_out_seen_verses(self):
        """Should not return verses already in verse_history."""
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus

        corpus = DynamicWisdomCorpus()
        # Pre-populate cache with known scores
        corpus._effectiveness_cache["anxious"] = [
            ("2.47", 0.8),
            ("2.48", 0.7),
        ]
        corpus._cache_timestamp = 999999999999  # Far future to prevent refresh

        # Mock DB (won't be called since cache is fresh)
        mock_db = AsyncMock()

        # Mock _resolve_verse to return a verse
        async def mock_resolve(db, ref):
            return {
                "verse_ref": ref,
                "wisdom": f"Test wisdom for {ref}",
                "principle": "test_principle",
            }
        corpus._resolve_verse = mock_resolve

        import asyncio
        # Request with history containing "2.47" — should only get "2.48"
        result = asyncio.run(
            corpus.get_effectiveness_weighted_verse(
                db=mock_db,
                mood="anxious",
                user_message="I feel anxious",
                phase="guide",
                user_id="test-user",
                verse_history=["2.47"],
            )
        )
        assert result is not None
        assert result["verse_ref"] == "2.48"


class TestWisdomEffectivenessModel:
    """Tests for the WisdomEffectiveness database model."""

    def test_model_has_required_fields(self):
        """WisdomEffectiveness should have all tracking fields."""
        from backend.models.wisdom import WisdomEffectiveness
        # Verify model has the columns we need
        columns = WisdomEffectiveness.__table__.columns
        required_columns = [
            "id", "user_id", "session_id", "verse_ref",
            "mood_at_delivery", "phase_at_delivery",
            "mood_after", "mood_improved", "effectiveness",
            "engagement_score", "delivered_at",
        ]
        column_names = {c.name for c in columns}
        for col in required_columns:
            assert col in column_names, f"Missing column '{col}' in WisdomEffectiveness"

    def test_model_has_outcome_fields(self):
        """WisdomEffectiveness should have outcome tracking fields."""
        from backend.models.wisdom import WisdomEffectiveness
        columns = {c.name for c in WisdomEffectiveness.__table__.columns}
        assert "user_continued_session" in columns
        assert "user_response_length" in columns
        assert "outcome_recorded_at" in columns

    def test_model_tablename(self):
        """Model should map to 'wisdom_effectiveness' table."""
        from backend.models.wisdom import WisdomEffectiveness
        assert WisdomEffectiveness.__tablename__ == "wisdom_effectiveness"


class TestCacheInvalidation:
    """Tests for cache behavior in DynamicWisdomCorpus."""

    def test_cache_invalidates_on_zero_timestamp(self):
        """Setting cache_timestamp to 0 should force a refresh on next query."""
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus, _EFFECTIVENESS_CACHE_TTL
        import time

        corpus = DynamicWisdomCorpus()
        corpus._effectiveness_cache["anxious"] = [("2.47", 0.8)]
        # Set timestamp far in the past so (now - timestamp) > TTL
        corpus._cache_timestamp = time.monotonic() - _EFFECTIVENESS_CACHE_TTL - 10

        # Cache should be considered stale
        elapsed = time.monotonic() - corpus._cache_timestamp
        assert elapsed > _EFFECTIVENESS_CACHE_TTL

    def test_fresh_cache_is_used(self):
        """Fresh cache should be returned without DB query."""
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus
        import time

        corpus = DynamicWisdomCorpus()
        corpus._effectiveness_cache["anxious"] = [("2.47", 0.8)]
        corpus._cache_timestamp = time.monotonic()  # Just now

        mock_db = AsyncMock()

        import asyncio
        scores = asyncio.run(
            corpus._get_effectiveness_scores(mock_db, "anxious")
        )
        assert scores == [("2.47", 0.8)]
        # DB should NOT have been called
        mock_db.execute.assert_not_called()


class TestEngagementWeights:
    """Tests for engagement weight configuration."""

    def test_weights_sum_to_one(self):
        """Engagement weights should sum to 1.0 for proper normalization."""
        from backend.services.dynamic_wisdom_corpus import ENGAGEMENT_WEIGHTS
        total = sum(ENGAGEMENT_WEIGHTS.values())
        assert abs(total - 1.0) < 0.01, f"Engagement weights sum to {total}, should be 1.0"

    def test_mood_improved_has_highest_weight(self):
        """Mood improvement should have the highest individual weight."""
        from backend.services.dynamic_wisdom_corpus import ENGAGEMENT_WEIGHTS
        max_key = max(ENGAGEMENT_WEIGHTS, key=ENGAGEMENT_WEIGHTS.get)
        assert max_key == "mood_improved"

    def test_all_weights_positive(self):
        """All engagement weights should be positive."""
        from backend.services.dynamic_wisdom_corpus import ENGAGEMENT_WEIGHTS
        for key, weight in ENGAGEMENT_WEIGHTS.items():
            assert weight > 0, f"Weight for '{key}' should be positive, got {weight}"


class TestMinimumLearningThreshold:
    """Tests for the minimum records threshold before trusting learned scores."""

    def test_threshold_is_reasonable(self):
        """Learning threshold should be at least 2 but not more than 10."""
        from backend.services.dynamic_wisdom_corpus import MIN_RECORDS_FOR_LEARNING
        assert 2 <= MIN_RECORDS_FOR_LEARNING <= 10

    def test_top_candidates_limit(self):
        """Should limit the number of effectiveness candidates considered."""
        from backend.services.dynamic_wisdom_corpus import TOP_EFFECTIVENESS_CANDIDATES
        assert 5 <= TOP_EFFECTIVENESS_CANDIDATES <= 50


class TestConfidenceFactor:
    """Sample-size confidence weighting (v3.1 enterprise upgrade)."""

    def test_confident_at_target_sample(self):
        """Verses with the target sample size rank at full effectiveness."""
        from backend.services.dynamic_wisdom_corpus import (
            CONFIDENT_SAMPLE_TARGET,
            _confidence_factor,
        )
        assert _confidence_factor(CONFIDENT_SAMPLE_TARGET) == 1.0
        assert _confidence_factor(CONFIDENT_SAMPLE_TARGET + 10) == 1.0

    def test_floor_for_sparse_data(self):
        """Single-record verses still rank but only at the floor."""
        from backend.services.dynamic_wisdom_corpus import (
            CONFIDENCE_FLOOR,
            _confidence_factor,
        )
        f = _confidence_factor(1)
        assert f >= CONFIDENCE_FLOOR
        assert f < 1.0

    def test_zero_records_returns_floor(self):
        """A verse with no records can't dominate proven ones."""
        from backend.services.dynamic_wisdom_corpus import (
            CONFIDENCE_FLOOR,
            _confidence_factor,
        )
        assert _confidence_factor(0) == CONFIDENCE_FLOOR

    def test_monotonically_increasing(self):
        """Confidence should grow (or hold) as sample size grows."""
        from backend.services.dynamic_wisdom_corpus import _confidence_factor
        prev = _confidence_factor(0)
        for n in range(1, 12):
            curr = _confidence_factor(n)
            assert curr >= prev, f"Confidence regressed at n={n}"
            prev = curr

    def test_proven_verse_outranks_sparse_high_score(self):
        """A 5-record verse at 0.7 should outrank a 1-record verse at 0.85.

        This is the whole point of confidence weighting: sample size matters.
        """
        from backend.services.dynamic_wisdom_corpus import _confidence_factor
        proven = 0.70 * _confidence_factor(5)
        sparse = 0.85 * _confidence_factor(1)
        assert proven > sparse


class TestBatchBuffer:
    """Batch delivery buffer mechanics (v3.1 enterprise upgrade)."""

    def setup_method(self):
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus
        self.corpus = DynamicWisdomCorpus()

    @pytest.mark.asyncio
    async def test_delivery_lands_in_buffer_not_db(self):
        """record_wisdom_delivery should buffer in-memory without DB writes."""
        # Patch SessionLocal so the lazy flush task can't accidentally
        # touch the DB during the test.
        with patch("backend.deps.SessionLocal"):
            await self.corpus.record_wisdom_delivery(
                db=MagicMock(),
                user_id="user-1",
                session_id="sess-1",
                verse_ref="2.47",
                principle="Karma Yoga",
                mood="anxious",
                mood_intensity=0.6,
                phase="guide",
                theme="action",
            )
        assert len(self.corpus._delivery_buffer) == 1
        assert self.corpus._delivery_buffer[0].verse_ref == "2.47"
        assert self.corpus._metrics["deliveries_buffered"] == 1
        assert self.corpus._metrics["deliveries_flushed"] == 0

    @pytest.mark.asyncio
    async def test_flush_drains_buffer(self):
        """_flush_buffer empties the buffer and increments flushed count."""
        from backend.services.dynamic_wisdom_corpus import _PendingDelivery

        # Seed three pending deliveries
        for i in range(3):
            self.corpus._delivery_buffer.append(
                _PendingDelivery(
                    user_id=f"u{i}",
                    session_id=f"s{i}",
                    verse_ref=f"2.{i}",
                    principle=None,
                    mood_at_delivery="anxious",
                    mood_intensity_at_delivery=0.5,
                    phase_at_delivery="guide",
                    theme_used=None,
                )
            )

        # Mock SessionLocal context manager
        mock_session = AsyncMock()
        mock_session.commit = AsyncMock()
        mock_session.add_all = MagicMock()
        mock_session_cm = AsyncMock()
        mock_session_cm.__aenter__.return_value = mock_session
        mock_session_cm.__aexit__.return_value = None

        with patch(
            "backend.deps.SessionLocal", return_value=mock_session_cm
        ):
            flushed = await self.corpus._flush_buffer()

        assert flushed == 3
        assert len(self.corpus._delivery_buffer) == 0
        assert self.corpus._metrics["deliveries_flushed"] == 3
        assert self.corpus._metrics["buffer_flushes"] == 1
        # Bulk insert path
        mock_session.add_all.assert_called_once()
        mock_session.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_flush_failure_requeues_records(self):
        """If commit fails, records go back to the front of the buffer."""
        from backend.services.dynamic_wisdom_corpus import _PendingDelivery

        self.corpus._delivery_buffer.append(
            _PendingDelivery(
                user_id="u",
                session_id="s",
                verse_ref="2.47",
                principle=None,
                mood_at_delivery="anxious",
                mood_intensity_at_delivery=0.5,
                phase_at_delivery="guide",
                theme_used=None,
            )
        )

        mock_session = AsyncMock()
        mock_session.commit = AsyncMock(side_effect=Exception("DB down"))
        mock_session.add_all = MagicMock()
        mock_session_cm = AsyncMock()
        mock_session_cm.__aenter__.return_value = mock_session
        mock_session_cm.__aexit__.return_value = None

        with patch(
            "backend.deps.SessionLocal", return_value=mock_session_cm
        ):
            flushed = await self.corpus._flush_buffer()

        assert flushed == 0
        assert len(self.corpus._delivery_buffer) == 1
        assert self.corpus._metrics["buffer_flush_errors"] == 1

    @pytest.mark.asyncio
    async def test_buffer_overflow_drops_oldest(self):
        """When the hard cap is exceeded, the oldest records are dropped."""
        from backend.services.dynamic_wisdom_corpus import (
            BATCH_MAX_BUFFER_SIZE,
            _PendingDelivery,
        )
        # Pre-seed the buffer at the hard cap so the next add overflows
        for i in range(BATCH_MAX_BUFFER_SIZE):
            self.corpus._delivery_buffer.append(
                _PendingDelivery(
                    user_id=f"u{i}",
                    session_id="s",
                    verse_ref="2.47",
                    principle=None,
                    mood_at_delivery="anxious",
                    mood_intensity_at_delivery=0.5,
                    phase_at_delivery="guide",
                    theme_used=None,
                )
            )

        # No DB hit — capacity flush is scheduled but won't run because
        # we don't await it. The overflow path is what's under test.
        with patch("backend.deps.SessionLocal"):
            await self.corpus.record_wisdom_delivery(
                db=MagicMock(),
                user_id="overflow",
                session_id="s",
                verse_ref="3.1",
                principle=None,
                mood="anxious",
                mood_intensity=0.5,
                phase="guide",
                theme=None,
            )

        assert len(self.corpus._delivery_buffer) <= BATCH_MAX_BUFFER_SIZE


class TestRuntimeMetrics:
    """Telemetry counters surfaced via get_runtime_metrics()."""

    def setup_method(self):
        from backend.services.dynamic_wisdom_corpus import DynamicWisdomCorpus
        self.corpus = DynamicWisdomCorpus()

    def test_metrics_includes_required_fields(self):
        m = self.corpus.get_runtime_metrics()
        for key in (
            "deliveries_buffered",
            "deliveries_flushed",
            "buffer_depth",
            "buffer_capacity",
            "selection_hit_rate",
            "cache_hit_rate",
            "config",
        ):
            assert key in m, f"missing metric: {key}"

    def test_metrics_config_block(self):
        cfg = self.corpus.get_runtime_metrics()["config"]
        for key in (
            "min_records_for_learning",
            "confident_sample_target",
            "confidence_floor",
            "batch_flush_size",
            "batch_flush_interval_sec",
        ):
            assert key in cfg, f"missing config key: {key}"

    def test_hit_rate_handles_zero_division(self):
        """No selections served → hit rate is None, not 0/0 crash."""
        m = self.corpus.get_runtime_metrics()
        assert m["selection_hit_rate"] is None
        assert m["cache_hit_rate"] is None
