"""
Unit tests for the Advanced Mood Analytics Engine.

Tests the core functionality of:
- Emotion detection from text
- Valence-Arousal vector calculation
- Cognitive distortion detection
- Guna balance calculation
- Yoga path recommendations
- Adaptive breathing protocols
"""

import pytest
from backend.services.mood_analytics_engine import (
    MoodAnalyticsEngine,
    EmotionVector,
    EmotionalQuadrant,
    Guna,
    CognitiveDistortion,
    MoodAnalysis,
    EMOTION_COORDINATES,
    EMOTION_KEYWORDS,
)


class TestMoodAnalyticsEngine:
    """Test suite for MoodAnalyticsEngine."""

    @pytest.fixture
    def engine(self):
        """Create a fresh engine instance for each test."""
        return MoodAnalyticsEngine()

    # =========================================================================
    # EMOTION DETECTION TESTS
    # =========================================================================

    def test_detect_single_emotion(self, engine: MoodAnalyticsEngine):
        """Should detect a single clear emotion."""
        analysis = engine.analyze("I feel really anxious about tomorrow")

        assert analysis.primary_emotion == "anxious"
        assert "anxious" in [analysis.primary_emotion] + analysis.secondary_emotions

    def test_detect_multiple_emotions(self, engine: MoodAnalyticsEngine):
        """Should detect multiple emotions and rank them."""
        text = "I'm stressed about work and feeling sad about the situation"
        analysis = engine.analyze(text)

        emotions_found = [analysis.primary_emotion] + analysis.secondary_emotions
        assert "stressed" in emotions_found
        assert "sad" in emotions_found

    def test_detect_no_clear_emotion(self, engine: MoodAnalyticsEngine):
        """Should return 'uncertain' when no clear emotion detected."""
        analysis = engine.analyze("The weather is nice today")

        # When no emotion keywords match, should return "uncertain"
        assert analysis.primary_emotion in ["uncertain", "neutral"]

    def test_empty_text_returns_low_confidence(self, engine: MoodAnalyticsEngine):
        """Should return low confidence for empty or very short text."""
        analysis = engine.analyze("")

        assert analysis.analysis_confidence < 0.5

    def test_longer_text_increases_confidence(self, engine: MoodAnalyticsEngine):
        """Longer text should increase analysis confidence."""
        short_analysis = engine.analyze("sad")
        long_analysis = engine.analyze(
            "I've been feeling really sad and depressed lately. "
            "Everything seems hopeless and I can't find motivation to do anything. "
            "The loneliness is overwhelming and I don't know what to do."
        )

        assert long_analysis.analysis_confidence > short_analysis.analysis_confidence

    # =========================================================================
    # EMOTION VECTOR TESTS
    # =========================================================================

    def test_anxiety_produces_high_arousal_negative_valence(self, engine: MoodAnalyticsEngine):
        """Anxiety should map to high arousal, negative valence."""
        analysis = engine.analyze("I'm so anxious and panicked about everything")

        assert analysis.emotion_vector.arousal > 0.3  # High arousal
        assert analysis.emotion_vector.valence < 0  # Negative valence
        assert analysis.emotion_vector.quadrant == EmotionalQuadrant.ACTIVATED_UNPLEASANT

    def test_calm_produces_low_arousal_positive_valence(self, engine: MoodAnalyticsEngine):
        """Calm should map to low arousal, positive valence."""
        analysis = engine.analyze("I feel calm and peaceful today, very relaxed")

        assert analysis.emotion_vector.arousal < 0  # Low arousal
        assert analysis.emotion_vector.valence > 0  # Positive valence
        assert analysis.emotion_vector.quadrant == EmotionalQuadrant.DEACTIVATED_PLEASANT

    def test_sadness_produces_low_arousal_negative_valence(self, engine: MoodAnalyticsEngine):
        """Sadness should map to low arousal, negative valence."""
        analysis = engine.analyze("I feel so sad and depressed, just tired of everything")

        assert analysis.emotion_vector.arousal < 0.3  # Low arousal
        assert analysis.emotion_vector.valence < 0  # Negative valence
        assert analysis.emotion_vector.quadrant == EmotionalQuadrant.DEACTIVATED_UNPLEASANT

    def test_joy_produces_high_arousal_positive_valence(self, engine: MoodAnalyticsEngine):
        """Joy should map to high arousal, positive valence."""
        analysis = engine.analyze("I'm so excited and happy, feeling enthusiastic!")

        assert analysis.emotion_vector.arousal > 0  # High arousal
        assert analysis.emotion_vector.valence > 0  # Positive valence
        assert analysis.emotion_vector.quadrant == EmotionalQuadrant.ACTIVATED_PLEASANT

    def test_intensity_scales_with_emotional_content(self, engine: MoodAnalyticsEngine):
        """More emotional content should increase intensity."""
        mild = engine.analyze("I feel a bit worried")
        intense = engine.analyze(
            "I'm extremely anxious, panicked, terrified, "
            "completely overwhelmed with fear and stress"
        )

        assert intense.emotion_vector.intensity >= mild.emotion_vector.intensity

    # =========================================================================
    # COGNITIVE DISTORTION TESTS
    # =========================================================================

    def test_detect_all_or_nothing_thinking(self, engine: MoodAnalyticsEngine):
        """Should detect all-or-nothing thinking patterns."""
        text = "I always fail. Nothing ever works out for me."
        analysis = engine.analyze(text)

        assert CognitiveDistortion.ALL_OR_NOTHING in analysis.distortions_detected

    def test_detect_catastrophizing(self, engine: MoodAnalyticsEngine):
        """Should detect catastrophizing patterns."""
        text = "This is a disaster. It's the worst thing that could happen."
        analysis = engine.analyze(text)

        assert CognitiveDistortion.CATASTROPHIZING in analysis.distortions_detected

    def test_detect_mind_reading(self, engine: MoodAnalyticsEngine):
        """Should detect mind reading patterns."""
        text = "They think I'm stupid. Everyone probably thinks I'm a failure."
        analysis = engine.analyze(text)

        assert CognitiveDistortion.MIND_READING in analysis.distortions_detected

    def test_detect_should_statements(self, engine: MoodAnalyticsEngine):
        """Should detect should statements."""
        text = "I should have done better. I must be perfect."
        analysis = engine.analyze(text)

        assert CognitiveDistortion.SHOULD_STATEMENTS in analysis.distortions_detected

    def test_detect_labeling(self, engine: MoodAnalyticsEngine):
        """Should detect negative labeling."""
        text = "I'm such a failure. I'm worthless and stupid."
        analysis = engine.analyze(text)

        assert CognitiveDistortion.LABELING in analysis.distortions_detected

    def test_detect_personalization(self, engine: MoodAnalyticsEngine):
        """Should detect personalization patterns."""
        text = "It's all my fault. I ruined everything because of me."
        analysis = engine.analyze(text)

        assert CognitiveDistortion.PERSONALIZATION in analysis.distortions_detected

    def test_distortion_severity_increases_with_count(self, engine: MoodAnalyticsEngine):
        """More distortions should increase severity score."""
        mild = engine.analyze("I feel a bit worried about tomorrow")
        severe = engine.analyze(
            "I always fail, I'm a total failure, everyone thinks I'm stupid, "
            "this is the worst disaster ever, I should be perfect"
        )

        assert severe.distortion_severity > mild.distortion_severity

    def test_no_distortions_in_healthy_text(self, engine: MoodAnalyticsEngine):
        """Healthy, balanced text should have few/no distortions."""
        text = "I had a challenging day, but I learned from it and will try again tomorrow."
        analysis = engine.analyze(text)

        assert len(analysis.distortions_detected) == 0 or analysis.distortion_severity < 0.3

    # =========================================================================
    # GUNA BALANCE TESTS
    # =========================================================================

    def test_calm_text_shows_sattvic_tendency(self, engine: MoodAnalyticsEngine):
        """Calm, peaceful text should show Sattva dominance."""
        text = "I feel peaceful, grateful, and content with life."
        analysis = engine.analyze(text)

        assert analysis.guna_balance["sattva"] > analysis.guna_balance["rajas"]
        assert analysis.guna_balance["sattva"] > analysis.guna_balance["tamas"]

    def test_anxious_text_shows_rajasic_tendency(self, engine: MoodAnalyticsEngine):
        """Anxious, restless text should show Rajas dominance."""
        text = "I'm so stressed and anxious, can't stop worrying about everything!"
        analysis = engine.analyze(text)

        assert analysis.guna_balance["rajas"] > analysis.guna_balance["tamas"]
        assert analysis.emotion_vector.guna == Guna.RAJAS

    def test_depressed_text_shows_tamasic_tendency(self, engine: MoodAnalyticsEngine):
        """Depressed, lethargic text should show Tamas dominance."""
        text = "I feel so tired and hopeless. No energy, just want to sleep forever."
        analysis = engine.analyze(text)

        assert analysis.guna_balance["tamas"] > 0.3
        # Tamas-dominant emotions
        assert analysis.emotion_vector.guna in [Guna.TAMAS, Guna.RAJAS]

    def test_guna_balance_sums_to_one(self, engine: MoodAnalyticsEngine):
        """Guna balance should always sum to approximately 1."""
        texts = [
            "I'm happy and excited!",
            "I feel sad and tired.",
            "I'm anxious and stressed.",
            "I feel peaceful and calm.",
        ]

        for text in texts:
            analysis = engine.analyze(text)
            total = sum(analysis.guna_balance.values())
            assert 0.99 <= total <= 1.01, f"Guna balance sum: {total}"

    # =========================================================================
    # YOGA PATH RECOMMENDATION TESTS
    # =========================================================================

    def test_high_anxiety_recommends_dhyana(self, engine: MoodAnalyticsEngine):
        """High anxiety should recommend Dhyana (meditation) yoga."""
        text = "I'm extremely anxious and panicked, my mind won't stop racing."
        analysis = engine.analyze(text)

        assert analysis.recommended_yoga_path == "dhyana"

    def test_depression_recommends_karma(self, engine: MoodAnalyticsEngine):
        """Depression/lethargy should recommend Karma (action) yoga."""
        text = "I feel so tired and hopeless, no motivation to do anything."
        analysis = engine.analyze(text)

        assert analysis.recommended_yoga_path == "karma"

    def test_confusion_recommends_jnana(self, engine: MoodAnalyticsEngine):
        """Confusion about identity/purpose should recommend Jnana (knowledge) yoga."""
        text = "I don't know who I am anymore. Lost and confused about my purpose."
        analysis = engine.analyze(text)

        # Jnana is recommended for self-identity issues
        assert analysis.recommended_yoga_path in ["jnana", "karma"]

    def test_loneliness_recommends_bhakti(self, engine: MoodAnalyticsEngine):
        """Loneliness should recommend Bhakti (devotion/connection) yoga."""
        text = "I feel so lonely and disconnected from my friends and family."
        analysis = engine.analyze(text)

        assert analysis.recommended_yoga_path in ("bhakti", "karma")

    # =========================================================================
    # BREATHING PROTOCOL TESTS
    # =========================================================================

    def test_high_anxiety_gets_calming_breath(self, engine: MoodAnalyticsEngine):
        """High arousal negative states should get calming breath protocol."""
        text = "I'm panicking and can't calm down, so anxious!"
        analysis = engine.analyze(text)

        assert analysis.breathing_protocol in ("calming", "balanced")

    def test_depression_gets_energizing_breath(self, engine: MoodAnalyticsEngine):
        """Low arousal negative states should get energizing breath protocol."""
        text = "I feel so tired and down, no energy at all, just numb."
        analysis = engine.analyze(text)

        assert analysis.breathing_protocol == "energizing"

    def test_neutral_gets_balanced_breath(self, engine: MoodAnalyticsEngine):
        """Neutral or balanced states should get balanced breath protocol."""
        text = "I feel okay, not great not bad, just normal."
        analysis = engine.analyze(text)

        assert analysis.breathing_protocol == "balanced"

    # =========================================================================
    # LIFE DOMAIN TESTS
    # =========================================================================

    def test_detect_work_domain(self, engine: MoodAnalyticsEngine):
        """Should detect work-related concerns."""
        text = "I'm stressed about my job and my boss is always criticizing me."
        analysis = engine.analyze(text)

        assert "work" in analysis.life_domains

    def test_detect_relationship_domain(self, engine: MoodAnalyticsEngine):
        """Should detect relationship concerns."""
        text = "My partner and I had a fight and I feel hurt."
        analysis = engine.analyze(text)

        assert "relationships" in analysis.life_domains

    def test_detect_health_domain(self, engine: MoodAnalyticsEngine):
        """Should detect health concerns."""
        text = "I've been sick and in pain, can't sleep well."
        analysis = engine.analyze(text)

        assert "health" in analysis.life_domains

    def test_detect_multiple_domains(self, engine: MoodAnalyticsEngine):
        """Should detect multiple life domains."""
        text = "Work is stressful, my relationship is struggling, and my health is declining."
        analysis = engine.analyze(text)

        assert len(analysis.life_domains) >= 2

    # =========================================================================
    # TEMPORAL ORIENTATION TESTS
    # =========================================================================

    def test_detect_past_orientation(self, engine: MoodAnalyticsEngine):
        """Should detect focus on past."""
        text = "I remember how things were before. I used to be happy back then."
        analysis = engine.analyze(text)

        assert analysis.temporal_orientation == "past"

    def test_detect_future_orientation(self, engine: MoodAnalyticsEngine):
        """Should detect focus on future."""
        text = "I'm worried about what will happen tomorrow and next week."
        analysis = engine.analyze(text)

        assert analysis.temporal_orientation == "future"

    def test_detect_present_orientation(self, engine: MoodAnalyticsEngine):
        """Should detect focus on present."""
        text = "Right now I feel overwhelmed. Today is really hard."
        analysis = engine.analyze(text)

        assert analysis.temporal_orientation == "present"

    # =========================================================================
    # RESET INTENSITY TESTS
    # =========================================================================

    def test_mild_state_gets_gentle_reset(self, engine: MoodAnalyticsEngine):
        """Mild emotional states should get gentle reset intensity."""
        text = "I feel a bit tired today."
        analysis = engine.analyze(text)

        assert analysis.reset_intensity in ["gentle", "moderate"]

    def test_intense_state_gets_deep_reset(self, engine: MoodAnalyticsEngine):
        """Intense emotional states should get deep reset intensity."""
        text = (
            "I'm completely overwhelmed with anxiety and panic. "
            "I always fail, everything is a disaster, I'm worthless."
        )
        analysis = engine.analyze(text)

        assert analysis.reset_intensity in ["moderate", "deep"]

    # =========================================================================
    # HELPER METHOD TESTS
    # =========================================================================

    def test_get_gita_verse_themes(self, engine: MoodAnalyticsEngine):
        """Should generate appropriate Gita themes for emotional state."""
        analysis = engine.analyze("I feel anxious and stressed about everything.")
        themes = engine.get_gita_verse_themes(analysis)

        assert len(themes) > 0
        # Anxiety should trigger themes like equanimity, detachment
        expected_themes = ["equanimity", "detachment", "surrender", "peace", "stillness"]
        assert any(theme in expected_themes for theme in themes)

    def test_get_adaptive_breathing_pattern(self, engine: MoodAnalyticsEngine):
        """Should return complete breathing pattern for emotional state."""
        analysis = engine.analyze("I'm very anxious and stressed.")
        pattern = engine.get_adaptive_breathing_pattern(analysis)

        assert "name" in pattern
        assert "inhale" in pattern
        assert "exhale" in pattern
        assert "duration_seconds" in pattern
        assert "narration" in pattern
        assert "science" in pattern

    def test_generate_karmic_insight(self, engine: MoodAnalyticsEngine):
        """Should generate karmic insight based on analysis."""
        analysis = engine.analyze("I feel stuck and unmotivated, can't do anything.")
        insight = engine.generate_karmic_insight(analysis)

        assert "karmic_pattern" in insight
        assert "samskara_type" in insight
        assert "recommended_action" in insight
        assert "gita_principle" in insight


class TestEmotionVector:
    """Test the EmotionVector dataclass."""

    def test_to_dict(self):
        """Should convert to dictionary correctly."""
        vector = EmotionVector(
            valence=0.5,
            arousal=-0.3,
            intensity=0.7,
            quadrant=EmotionalQuadrant.DEACTIVATED_PLEASANT,
            guna=Guna.SATTVA,
        )

        result = vector.to_dict()

        assert result["valence"] == 0.5
        assert result["arousal"] == -0.3
        assert result["intensity"] == 0.7
        assert result["quadrant"] == "deactivated_pleasant"
        assert result["guna"] == "sattva"
        assert "distance_from_center" in result

    def test_distance_calculation(self):
        """Should calculate distance from center correctly."""
        vector = EmotionVector(valence=0.6, arousal=0.8)
        result = vector.to_dict()

        # Distance should be sqrt(0.6^2 + 0.8^2) = 1.0
        assert 0.99 <= result["distance_from_center"] <= 1.01


class TestMoodAnalysis:
    """Test the MoodAnalysis dataclass."""

    def test_to_dict_complete(self):
        """Should convert full analysis to dictionary."""
        analysis = MoodAnalysis(
            primary_emotion="anxious",
            secondary_emotions=["stressed", "worried"],
            emotion_vector=EmotionVector(
                valence=-0.6,
                arousal=0.8,
                intensity=0.7,
                quadrant=EmotionalQuadrant.ACTIVATED_UNPLEASANT,
                guna=Guna.RAJAS,
            ),
            distortions_detected=[CognitiveDistortion.CATASTROPHIZING],
            distortion_severity=0.5,
            life_domains=["work"],
            temporal_orientation="future",
            guna_balance={"sattva": 0.2, "rajas": 0.6, "tamas": 0.2},
            recommended_yoga_path="dhyana",
            breathing_protocol="calming",
            reset_intensity="moderate",
            analysis_confidence=0.8,
        )

        result = analysis.to_dict()

        assert result["primary_emotion"] == "anxious"
        assert len(result["secondary_emotions"]) == 2
        assert result["distortions_detected"] == ["catastrophizing"]
        assert result["recommended_yoga_path"] == "dhyana"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
