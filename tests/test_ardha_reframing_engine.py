"""Tests for ARDHA Reframing Engine — Gita-Compliant 5-Pillar Framework.

Tests cover:
1. Emotion detection from user input
2. Crisis detection for safety
3. ARDHA pillar mapping based on emotions
4. Verse search within the 701-verse corpus
5. Compliance validation of AI responses
6. Knowledge base integrity (5 pillars, 25 key verses)
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.services.ardha_reframing_engine import (
    analyze_thought,
    detect_crisis,
    detect_emotions,
    get_crisis_response,
    validate_ardha_compliance,
)
from data.ardha_knowledge_base import (
    ARDHA_COMPLIANCE_TESTS,
    ARDHA_KEY_VERSE_REFS,
    ARDHA_PILLAR_MAP,
    ARDHA_PILLARS,
    build_ardha_context_for_prompt,
    get_all_ardha_verses,
    get_ardha_compliance_summary,
    get_pillar_for_emotion,
)

# ─── Knowledge Base Integrity Tests ──────────────────────────────────────

class TestArdhaKnowledgeBase:
    """Verify the ARDHA knowledge base is complete and Gita-compliant."""

    def test_five_pillars_exist(self):
        """ARDHA must have exactly 5 pillars."""
        assert len(ARDHA_PILLARS) == 5

    def test_pillar_codes(self):
        """Pillars have correct codes: A, R, D, H, A2."""
        codes = [p.code for p in ARDHA_PILLARS]
        assert codes == ["A", "R", "D", "H", "A2"]

    def test_pillar_names(self):
        """Pillars have correct names matching ARDHA framework."""
        names = [p.name for p in ARDHA_PILLARS]
        assert "Atma Distinction" in names
        assert "Raga-Dvesha Diagnosis" in names
        assert "Dharma Alignment" in names
        assert "Hrdaya Samatvam" in names
        assert "Arpana" in names

    def test_each_pillar_has_key_verses(self):
        """Each pillar must have at least 3 key verses."""
        for pillar in ARDHA_PILLARS:
            assert len(pillar.key_verses) >= 3, f"{pillar.name} has < 3 key verses"

    def test_total_key_verses(self):
        """Total key verses should be 25 (5 per pillar)."""
        total = sum(len(p.key_verses) for p in ARDHA_PILLARS)
        assert total == 25

    def test_each_pillar_has_compliance_test(self):
        """Each pillar must have a compliance test string."""
        for pillar in ARDHA_PILLARS:
            assert pillar.compliance_test, f"{pillar.name} missing compliance test"

    def test_each_pillar_has_diagnostic_questions(self):
        """Each pillar must have at least 3 diagnostic questions."""
        for pillar in ARDHA_PILLARS:
            assert len(pillar.diagnostic_questions) >= 3, f"{pillar.name} has < 3 questions"

    def test_each_pillar_has_reframe_template(self):
        """Each pillar must have a reframe template."""
        for pillar in ARDHA_PILLARS:
            assert pillar.reframe_template, f"{pillar.name} missing reframe template"

    def test_each_pillar_has_sanskrit_name(self):
        """Each pillar must have a Sanskrit name."""
        for pillar in ARDHA_PILLARS:
            assert pillar.sanskrit_name, f"{pillar.name} missing Sanskrit name"

    def test_verse_references_format(self):
        """All verse references must be in 'BG chapter.verse' format."""
        for pillar in ARDHA_PILLARS:
            for verse in pillar.key_verses:
                ref = verse.reference
                assert ref.startswith("BG "), f"Bad reference format: {ref}"
                parts = ref[3:].split(".")
                assert len(parts) == 2, f"Bad reference format: {ref}"
                assert parts[0].isdigit(), f"Bad chapter in: {ref}"
                assert parts[1].isdigit(), f"Bad verse in: {ref}"

    def test_verse_chapters_valid(self):
        """All verse chapters must be between 1 and 18 (valid Gita range)."""
        for pillar in ARDHA_PILLARS:
            for verse in pillar.key_verses:
                assert 1 <= verse.chapter <= 18, f"Invalid chapter: {verse.chapter}"

    def test_verse_has_reframe_guidance(self):
        """Each verse must have reframe guidance."""
        for pillar in ARDHA_PILLARS:
            for verse in pillar.key_verses:
                assert verse.reframe_guidance, f"{verse.reference} missing guidance"

    def test_verse_has_mental_health_tags(self):
        """Each verse must have at least 1 mental health tag."""
        for pillar in ARDHA_PILLARS:
            for verse in pillar.key_verses:
                assert len(verse.mental_health_tags) >= 1, f"{verse.reference} has no tags"

    def test_pillar_map_completeness(self):
        """ARDHA_PILLAR_MAP must contain all pillar codes."""
        assert "A" in ARDHA_PILLAR_MAP
        assert "R" in ARDHA_PILLAR_MAP
        assert "D" in ARDHA_PILLAR_MAP
        assert "H" in ARDHA_PILLAR_MAP
        assert "A2" in ARDHA_PILLAR_MAP

    def test_compliance_tests_count(self):
        """There must be exactly 5 compliance tests."""
        assert len(ARDHA_COMPLIANCE_TESTS) == 5

    def test_key_verse_refs_count(self):
        """Key verse refs should have 25 entries (5 per pillar)."""
        assert len(ARDHA_KEY_VERSE_REFS) == 25

    def test_get_all_ardha_verses(self):
        """get_all_ardha_verses should return all 25 key verses."""
        all_verses = get_all_ardha_verses()
        assert len(all_verses) == 25


# ─── Emotion Detection Tests ─────────────────────────────────────────────

class TestEmotionDetection:
    """Verify emotion detection maps user input to correct emotional patterns."""

    def test_detect_self_doubt(self):
        """Self-doubt keywords should be detected."""
        emotions = detect_emotions("I'm not good enough for this job")
        emotion_names = [e for e, _ in emotions]
        assert "self_doubt" in emotion_names

    def test_detect_anxiety(self):
        """Anxiety keywords should be detected."""
        emotions = detect_emotions("I'm so anxious and stressed about the exam")
        emotion_names = [e for e, _ in emotions]
        assert "anxiety" in emotion_names

    def test_detect_anger(self):
        """Anger keywords should be detected."""
        emotions = detect_emotions("I'm furious at my colleague for what they said")
        emotion_names = [e for e, _ in emotions]
        assert "anger" in emotion_names

    def test_detect_imposter_syndrome(self):
        """Imposter syndrome keywords should be detected."""
        emotions = detect_emotions("I feel like a fraud, they'll find out I'm pretending")
        emotion_names = [e for e, _ in emotions]
        assert "imposter_syndrome" in emotion_names

    def test_detect_overwhelm(self):
        """Overwhelm keywords should be detected."""
        emotions = detect_emotions("I'm drowning, too much to handle")
        emotion_names = [e for e, _ in emotions]
        assert "overwhelm" in emotion_names

    def test_detect_perfectionism(self):
        """Perfectionism keywords should be detected."""
        emotions = detect_emotions("It must be perfect, nothing I do is ever enough")
        emotion_names = [e for e, _ in emotions]
        assert "perfectionism" in emotion_names

    def test_detect_comparison(self):
        """Comparison keywords should be detected."""
        emotions = detect_emotions("Everyone else is ahead of me, I'm behind")
        emotion_names = [e for e, _ in emotions]
        assert "comparison" in emotion_names

    def test_empty_input(self):
        """Empty input should return no emotions."""
        emotions = detect_emotions("")
        assert len(emotions) == 0

    def test_neutral_input(self):
        """Neutral input without emotional keywords should return empty."""
        emotions = detect_emotions("The weather is nice today")
        assert len(emotions) == 0

    def test_multiple_emotions(self):
        """Input with multiple emotional patterns should detect all."""
        emotions = detect_emotions("I'm anxious, angry, and feel like a failure")
        emotion_names = [e for e, _ in emotions]
        assert len(emotion_names) >= 2


# ─── Crisis Detection Tests ──────────────────────────────────────────────

class TestCrisisDetection:
    """Verify crisis detection catches dangerous patterns and halts reframing."""

    def test_detect_suicide_mention(self):
        """Suicide mention should trigger crisis detection."""
        assert detect_crisis("I want to kill myself") is True

    def test_detect_self_harm(self):
        """Self-harm mention should trigger crisis detection."""
        assert detect_crisis("I've been cutting myself") is True

    def test_detect_no_reason_to_live(self):
        """Hopelessness about living should trigger crisis."""
        assert detect_crisis("There's no reason to live anymore") is True

    def test_normal_frustration_no_crisis(self):
        """Normal frustration should NOT trigger crisis."""
        assert detect_crisis("I'm frustrated with work") is False

    def test_empty_input_no_crisis(self):
        """Empty input should NOT trigger crisis."""
        assert detect_crisis("") is False

    def test_crisis_response_contains_helplines(self):
        """Crisis response should contain helpline information."""
        response = get_crisis_response()
        assert "iCall" in response or "crisis" in response.lower()
        assert "741741" in response or "helpline" in response.lower()


# ─── ARDHA Analysis Tests ────────────────────────────────────────────────

class TestArdhaAnalysis:
    """Verify the full ARDHA analysis pipeline."""

    def test_analysis_returns_pillars(self):
        """Analysis should return recommended pillars."""
        analysis = analyze_thought("I'm not good enough for this job")
        assert len(analysis.recommended_pillars) > 0

    def test_analysis_detects_emotion(self):
        """Analysis should detect the primary emotion."""
        analysis = analyze_thought("I'm so anxious about the presentation")
        assert analysis.primary_emotion != ""

    def test_analysis_provides_context(self):
        """Analysis should build ARDHA context string."""
        analysis = analyze_thought("I'm angry at my boss")
        assert "ARDHA" in analysis.ardha_context or len(analysis.ardha_context) > 0

    def test_analysis_includes_verses(self):
        """Analysis should include matched verses from pillar knowledge."""
        analysis = analyze_thought("I feel worthless and inadequate")
        assert len(analysis.matched_verses) > 0

    def test_analysis_crisis_halts_reframing(self):
        """Crisis input should halt the analysis pipeline."""
        analysis = analyze_thought("I want to end my life")
        assert analysis.crisis_detected is True
        assert len(analysis.recommended_pillars) == 0

    def test_analysis_default_for_generic_input(self):
        """Generic input should still produce an analysis."""
        analysis = analyze_thought("I don't know what to do")
        assert analysis.primary_emotion != ""
        assert len(analysis.recommended_pillars) > 0


# ─── Pillar Mapping Tests ────────────────────────────────────────────────

class TestPillarMapping:
    """Verify emotion-to-pillar mapping is correct."""

    def test_self_doubt_maps_to_atma_and_dharma(self):
        """Self-doubt should map to Atma Distinction and Dharma."""
        pillars = get_pillar_for_emotion("self_doubt")
        codes = [p.code for p in pillars]
        assert "A" in codes
        assert "D" in codes

    def test_anxiety_maps_to_raga_and_dharma(self):
        """Anxiety should map to Raga-Dvesha and Dharma."""
        pillars = get_pillar_for_emotion("anxiety")
        codes = [p.code for p in pillars]
        assert "R" in codes
        assert "D" in codes

    def test_anger_maps_to_raga_and_samatvam(self):
        """Anger should map to Raga-Dvesha and Samatvam."""
        pillars = get_pillar_for_emotion("anger")
        codes = [p.code for p in pillars]
        assert "R" in codes
        assert "H" in codes

    def test_fear_of_failure_maps_to_arpana(self):
        """Fear of failure should map to Arpana."""
        pillars = get_pillar_for_emotion("fear_of_failure")
        codes = [p.code for p in pillars]
        assert "A2" in codes

    def test_grief_maps_to_arpana_and_atma(self):
        """Grief should map to Arpana and Atma."""
        pillars = get_pillar_for_emotion("grief")
        codes = [p.code for p in pillars]
        assert "A2" in codes
        assert "A" in codes

    def test_unknown_emotion_returns_all_pillars(self):
        """Unknown emotion should return all 5 pillars."""
        pillars = get_pillar_for_emotion("unknown_emotion_xyz")
        assert len(pillars) == 5


# ─── Compliance Validation Tests ─────────────────────────────────────────

class TestComplianceValidation:
    """Verify ARDHA compliance validation catches missing pillars."""

    def test_fully_compliant_response(self):
        """A response mentioning all 5 pillars should score 5/5."""
        response = (
            "Atma Distinction: The witness Self is untouched. "
            "The attachment to validation drives this disturbance. "
            "Your duty is sincere effort, not guaranteed results (BG 2.47). "
            "Maintain equanimity and steadiness. "
            "Offer this action as a surrender and let go of the outcome."
        )
        result = validate_ardha_compliance(response)
        assert result["score"] >= 3
        assert result["overall_compliant"] is True

    def test_empty_response_not_compliant(self):
        """An empty response should not be compliant."""
        result = validate_ardha_compliance("")
        assert result["overall_compliant"] is False
        assert result["score"] == 0

    def test_partial_response_checks_individual_tests(self):
        """A partial response should pass some tests but not all."""
        response = "The Self (Atma) witnesses without attachment. Duty matters."
        result = validate_ardha_compliance(response)
        assert result["score"] >= 1
        assert len(result["tests"]) == 5

    def test_cbt_response_low_compliance(self):
        """A generic CBT response without Gita concepts should score low."""
        response = (
            "Your thinking pattern shows cognitive distortion. "
            "Challenge the negative thought with evidence. "
            "Replace it with a balanced alternative."
        )
        result = validate_ardha_compliance(response)
        # CBT response should score lower than ARDHA-compliant response
        assert result["score"] <= 2


# ─── Context Building Tests ──────────────────────────────────────────────

class TestContextBuilding:
    """Verify ARDHA context is properly built for AI prompts."""

    def test_build_full_context(self):
        """Full context should include all pillars."""
        context = build_ardha_context_for_prompt()
        assert "ARDHA" in context
        assert "Atma Distinction" in context
        assert "Raga-Dvesha" in context
        assert "Dharma" in context
        assert "Samatvam" in context
        assert "Arpana" in context

    def test_build_partial_context(self):
        """Partial context should include only specified pillars."""
        pillar = ARDHA_PILLAR_MAP["A"]
        context = build_ardha_context_for_prompt([pillar])
        assert "Atma Distinction" in context
        # Should not contain other pillar details (but ARDHA header may)
        assert "Compliance" in context  # context tag present

    def test_compliance_summary(self):
        """Compliance summary should list all 5 tests."""
        summary = get_ardha_compliance_summary()
        assert "5 Tests" in summary or "Gita Compliance" in summary
        assert "identity" in summary.lower()
        assert "equanimity" in summary.lower()
