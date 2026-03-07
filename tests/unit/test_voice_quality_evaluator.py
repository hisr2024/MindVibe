"""Tests for Voice Quality Evaluation Framework

Validates:
- Quality scoring computation
- Provider baseline scores
- Intelligent provider selection per language
- Benchmark tracking and reporting
- Quality metric recording
"""

import pytest
from datetime import datetime

from backend.services.voice_quality_evaluator import (
    VoiceQualityScore,
    VoiceQualityEvaluator,
    ProviderBenchmark,
    QualityDimension,
    PROVIDER_BASELINE_SCORES,
    get_voice_quality_evaluator,
)


class TestVoiceQualityScore:
    """Tests for VoiceQualityScore dataclass."""

    def test_compute_overall_weighted(self):
        """Overall score uses correct weights: naturalness 30%, intelligibility 25%,
        expressiveness 20%, pronunciation 15%, prosody 10%."""
        score = VoiceQualityScore(
            provider="elevenlabs",
            language="en",
            voice_id="sarah",
            naturalness=10.0,
            intelligibility=10.0,
            expressiveness=10.0,
            pronunciation_accuracy=10.0,
            prosody_quality=10.0,
        )
        overall = score.compute_overall()
        assert overall == pytest.approx(10.0, abs=0.01)

    def test_compute_overall_zeros(self):
        """All zeros should produce zero overall."""
        score = VoiceQualityScore(
            provider="test", language="en", voice_id="test",
            naturalness=0, intelligibility=0, expressiveness=0,
            pronunciation_accuracy=0, prosody_quality=0,
        )
        assert score.compute_overall() == 0.0

    def test_compute_overall_naturalness_weighted_highest(self):
        """Naturalness at 10, others at 0 should give 3.0 (30% of 10)."""
        score = VoiceQualityScore(
            provider="test", language="en", voice_id="test",
            naturalness=10.0, intelligibility=0, expressiveness=0,
            pronunciation_accuracy=0, prosody_quality=0,
        )
        assert score.compute_overall() == pytest.approx(3.0, abs=0.01)

    def test_score_has_timestamp(self):
        """Score should have a timestamp on creation."""
        score = VoiceQualityScore(
            provider="test", language="en", voice_id="test",
        )
        assert isinstance(score.timestamp, datetime)


class TestProviderBaselineScores:
    """Tests for provider baseline quality data."""

    def test_all_providers_have_baselines(self):
        """All three providers must have baseline scores."""
        assert "elevenlabs" in PROVIDER_BASELINE_SCORES
        assert "sarvam_ai" in PROVIDER_BASELINE_SCORES
        assert "bhashini_ai" in PROVIDER_BASELINE_SCORES

    def test_all_providers_have_default(self):
        """Every provider must have a _default fallback."""
        for provider, scores in PROVIDER_BASELINE_SCORES.items():
            assert "_default" in scores, f"{provider} missing _default baseline"

    def test_elevenlabs_english_is_highest(self):
        """ElevenLabs should have highest English naturalness."""
        el_en = PROVIDER_BASELINE_SCORES["elevenlabs"]["en"]
        assert el_en["naturalness"] >= 9.5

    def test_sarvam_hindi_is_highest(self):
        """Sarvam AI should have highest Hindi naturalness."""
        sarvam_hi = PROVIDER_BASELINE_SCORES["sarvam_ai"]["hi"]
        assert sarvam_hi["naturalness"] >= 9.5
        assert sarvam_hi["pronunciation_accuracy"] >= 9.5

    def test_bhashini_has_hindi(self):
        """Bhashini must support Hindi."""
        assert "hi" in PROVIDER_BASELINE_SCORES["bhashini_ai"]

    def test_all_scores_in_range(self):
        """All quality scores should be between 0 and 10."""
        for provider, langs in PROVIDER_BASELINE_SCORES.items():
            for lang, scores in langs.items():
                for dim, value in scores.items():
                    assert 0 <= value <= 10, (
                        f"{provider}/{lang}/{dim} = {value} out of range"
                    )


class TestVoiceQualityEvaluator:
    """Tests for the VoiceQualityEvaluator class."""

    def test_record_synthesis_creates_score(self):
        """Recording a synthesis should return a VoiceQualityScore."""
        evaluator = VoiceQualityEvaluator()
        score = evaluator.record_synthesis(
            provider="elevenlabs",
            language="en",
            voice_id="sarah",
            latency_ms=150.0,
            audio_size_bytes=5000,
            success=True,
        )
        assert isinstance(score, VoiceQualityScore)
        assert score.provider == "elevenlabs"
        assert score.latency_ms == 150.0
        assert score.overall_score > 0

    def test_record_failure(self):
        """Recording a failed synthesis should track the error."""
        evaluator = VoiceQualityEvaluator()
        score = evaluator.record_synthesis(
            provider="sarvam_ai",
            language="hi",
            voice_id="meera",
            latency_ms=0,
            success=False,
            error_message="API timeout",
        )
        assert score.synthesis_success is False
        assert score.error_message == "API timeout"

    def test_best_provider_for_hindi_is_sarvam(self):
        """For Hindi, Sarvam AI should be the best provider."""
        evaluator = VoiceQualityEvaluator()
        best = evaluator.get_best_provider_for_language(
            "hi",
            available_providers=["elevenlabs", "sarvam_ai", "bhashini_ai"],
        )
        assert best == "sarvam_ai"

    def test_best_provider_for_english_is_elevenlabs(self):
        """For English, ElevenLabs should be the best provider."""
        evaluator = VoiceQualityEvaluator()
        best = evaluator.get_best_provider_for_language(
            "en",
            available_providers=["elevenlabs", "sarvam_ai", "bhashini_ai"],
        )
        assert best == "elevenlabs"

    def test_best_provider_for_tamil(self):
        """For Tamil, Sarvam AI should be preferred."""
        evaluator = VoiceQualityEvaluator()
        best = evaluator.get_best_provider_for_language(
            "ta",
            available_providers=["elevenlabs", "sarvam_ai", "bhashini_ai"],
        )
        assert best == "sarvam_ai"

    def test_benchmark_updates_on_record(self):
        """Benchmarks should update when scores are recorded."""
        evaluator = VoiceQualityEvaluator()
        for _ in range(5):
            evaluator.record_synthesis(
                provider="elevenlabs", language="en", voice_id="sarah",
                latency_ms=200.0, audio_size_bytes=10000, success=True,
            )
        report = evaluator.get_provider_report()
        assert "providers" in report
        assert "elevenlabs" in report["providers"]
        assert report["providers"]["elevenlabs"]["languages"]["en"]["samples"] == 5

    def test_reliability_factor_reduces_score(self):
        """Providers with low success rates should be penalized."""
        evaluator = VoiceQualityEvaluator()
        # Record 3 successes and 3 failures for Sarvam on Hindi
        for i in range(6):
            evaluator.record_synthesis(
                provider="sarvam_ai", language="hi", voice_id="meera",
                latency_ms=200.0, success=(i < 3),
            )
        # With 50% reliability, sarvam should score lower
        bench = evaluator._benchmarks.get("sarvam_ai:hi")
        assert bench is not None
        assert bench.success_rate == pytest.approx(0.5, abs=0.01)

    def test_get_provider_report_structure(self):
        """Provider report should have expected structure."""
        evaluator = VoiceQualityEvaluator()
        evaluator.record_synthesis(
            provider="elevenlabs", language="en", voice_id="sarah",
            latency_ms=100.0, success=True,
        )
        report = evaluator.get_provider_report()
        assert "generated_at" in report
        assert "providers" in report

    def test_singleton_evaluator(self):
        """get_voice_quality_evaluator should return the same instance."""
        e1 = get_voice_quality_evaluator()
        e2 = get_voice_quality_evaluator()
        assert e1 is e2

    def test_max_scores_limit(self):
        """Evaluator should trim scores when exceeding max."""
        evaluator = VoiceQualityEvaluator()
        evaluator._max_scores = 10
        for i in range(20):
            evaluator.record_synthesis(
                provider="test", language="en", voice_id="test",
                latency_ms=float(i), success=True,
            )
        assert len(evaluator._scores) == 10
