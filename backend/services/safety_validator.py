"""
Safety Validator Service

Implements:
- Crisis detection (self-harm, harm to others, acute distress)
- Emergency escalation with compassionate messaging
- Response quality validation (psychological soundness, secular language)
- Religious term sanitization
- Evidence-alignment checks (CBT/ACT/mindfulness)
"""

import re
from typing import Any


class SafetyValidator:
    """Validates safety and quality of responses."""

    # Crisis keywords that require immediate escalation
    CRISIS_KEYWORDS = {
        "self_harm": [
            "kill myself",
            "suicide",
            "suicidal",
            "end my life",
            "hurt myself",
            "self harm",
            "cut myself",
            "overdose",
            "want to die",
            "better off dead",
            "no reason to live",
        ],
        "harm_to_others": [
            "kill someone",
            "hurt someone",
            "harm others",
            "kill them",
            "murder",
            "violent thoughts",
        ],
        "acute_distress": [
            "can't take it anymore",
            "can't go on",
            "unbearable",
            "hopeless",
            "nothing matters",
        ],
    }

    # Religious terms to sanitize
    RELIGIOUS_TERMS = {
        "Krishna": "the teacher",
        "krishna": "the teacher",
        "Arjuna": "the student",
        "arjuna": "the student",
        "Lord": "the wise one",
        "lord": "the wise one",
        "God": "inner wisdom",
        "god": "inner wisdom",
        "Divine": "Universal",
        "divine": "universal",
        "Soul": "Essence",
        "soul": "essence",
        "Brahman": "universal consciousness",
        "karma": "consequences of actions",
        "dharma": "purpose",
        "moksha": "liberation",
        "atman": "inner self",
    }

    # Evidence-based therapy terms (these should be present)
    EVIDENCE_BASED_TERMS = [
        "awareness",
        "mindfulness",
        "acceptance",
        "values",
        "action",
        "thoughts",
        "feelings",
        "behavior",
        "practice",
        "notice",
        "observe",
        "choice",
        "control",
        "breathing",
        "grounding",
        "present moment",
    ]

    def __init__(self) -> None:
        """Initialize the safety validator."""
        pass

    def detect_crisis(self, message: str) -> dict[str, Any]:
        """
        Detect crisis indicators in user message.

        Args:
            message: User's message

        Returns:
            Dictionary with crisis detection results
        """
        message_lower = message.lower()
        crisis_detected = False
        crisis_types = []
        matched_keywords = []

        for crisis_type, keywords in self.CRISIS_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message_lower:
                    crisis_detected = True
                    if crisis_type not in crisis_types:
                        crisis_types.append(crisis_type)
                    matched_keywords.append(keyword)

        return {
            "crisis_detected": crisis_detected,
            "crisis_types": crisis_types,
            "matched_keywords": matched_keywords,
            "severity": self._assess_severity(crisis_types),
        }

    def _assess_severity(self, crisis_types: list[str]) -> str:
        """
        Assess severity of crisis.

        Args:
            crisis_types: List of detected crisis types

        Returns:
            Severity level: "none", "moderate", "high", "critical"
        """
        if not crisis_types:
            return "none"

        if "self_harm" in crisis_types or "harm_to_others" in crisis_types:
            return "critical"

        if "acute_distress" in crisis_types:
            return "high"

        return "moderate"

    def generate_crisis_response(self, crisis_info: dict[str, Any]) -> str:
        """
        Generate compassionate crisis escalation response.

        Args:
            crisis_info: Crisis detection information

        Returns:
            Crisis response text
        """
        severity = crisis_info.get("severity", "none")
        crisis_types = crisis_info.get("crisis_types", [])

        if severity == "critical":
            if "self_harm" in crisis_types:
                return self._get_self_harm_response()
            if "harm_to_others" in crisis_types:
                return self._get_harm_others_response()

        if severity == "high":
            return self._get_acute_distress_response()

        return ""

    def _get_self_harm_response(self) -> str:
        """Get response for self-harm crisis."""
        return """I hear that you're in a lot of pain right now. Your safety is the most important thing.

**Please reach out for immediate support:**

• **National Suicide Prevention Lifeline:** 988 (call or text, 24/7)
• **Crisis Text Line:** Text HOME to 741741
• **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, please call 911 or go to your nearest emergency room.

You don't have to face this alone. These services are staffed by caring professionals who want to help."""

    def _get_harm_others_response(self) -> str:
        """Get response for harm to others crisis."""
        return """I can see you're experiencing some intense and difficult thoughts. When thoughts of harming others arise, it's important to get professional support right away.

**Please reach out immediately:**

• **National Crisis Hotline:** 988 (24/7)
• **Crisis Text Line:** Text HOME to 741741
• **Local emergency services:** 911

These professionals are trained to help you work through these thoughts safely. You're taking the right step by recognizing you need support."""

    def _get_acute_distress_response(self) -> str:
        """Get response for acute distress."""
        return """I can hear how overwhelming things feel right now. You're experiencing significant distress, and you deserve support.

**Consider reaching out:**

• **National Crisis Hotline:** 988 (call or text, 24/7)
• **Crisis Text Line:** Text HOME to 741741
• **SAMHSA Helpline:** 1-800-662-4357

You can also:
• Contact a spiritual wellness professional
• Reach out to a trusted friend or family member
• Go to your nearest emergency room if you feel unsafe

These feelings can change, and support is available. You don't have to navigate this alone."""

    def sanitize_religious_terms(self, text: str) -> str:
        """
        Replace religious terms with secular alternatives.

        Args:
            text: Text to sanitize

        Returns:
            Sanitized text
        """
        if not text:
            return text

        sanitized = text

        # Replace religious terms (case-sensitive for proper nouns, then case-insensitive)
        for old_term, new_term in self.RELIGIOUS_TERMS.items():
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(old_term) + r'\b'
            sanitized = re.sub(pattern, new_term, sanitized)

        return sanitized

    def validate_response_quality(self, response: str) -> dict[str, Any]:
        """
        Validate response meets quality and safety standards.

        Args:
            response: Response text to validate

        Returns:
            Validation results
        """
        issues = []
        warnings = []

        # Check word count (120-250 words)
        word_count = len(response.split())
        if word_count < 120:
            issues.append(f"Response too short: {word_count} words (minimum 120)")
        elif word_count > 250:
            issues.append(f"Response too long: {word_count} words (maximum 250)")

        # Check for religious terms
        for term in self.RELIGIOUS_TERMS.keys():
            pattern = r'\b' + re.escape(term) + r'\b'
            if re.search(pattern, response):
                issues.append(f"Contains religious term: '{term}' - must be sanitized")

        # Check for evidence-based language
        evidence_based_count = sum(
            1 for term in self.EVIDENCE_BASED_TERMS if term.lower() in response.lower()
        )

        if evidence_based_count < 2:
            warnings.append(
                "Response lacks evidence-based psychological language (CBT/ACT/mindfulness)"
            )

        # Check minimum length
        if len(response) < 100:
            issues.append("Response too brief (< 100 characters)")

        # Check for medical advice (we should not provide)
        medical_terms = ["diagnose", "medication", "prescription", "disorder"]
        for term in medical_terms:
            if term in response.lower():
                warnings.append(
                    f"Response contains medical term '{term}' - ensure not providing medical advice"
                )

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "word_count": word_count,
            "evidence_based_score": evidence_based_count,
        }

    def check_evidence_alignment(self, response: str) -> dict[str, Any]:
        """
        Check if response aligns with evidence-based practices.

        Args:
            response: Response text

        Returns:
            Alignment assessment
        """
        response_lower = response.lower()

        # CBT patterns
        cbt_patterns = [
            "thoughts",
            "thinking",
            "belief",
            "reframe",
            "challenge",
            "evidence",
            "helpful",
        ]
        cbt_score = sum(1 for pattern in cbt_patterns if pattern in response_lower)

        # ACT patterns
        act_patterns = [
            "values",
            "acceptance",
            "committed action",
            "observe",
            "willing",
            "present",
        ]
        act_score = sum(1 for pattern in act_patterns if pattern in response_lower)

        # Mindfulness patterns
        mindfulness_patterns = [
            "breath",
            "notice",
            "awareness",
            "present moment",
            "observe",
            "ground",
        ]
        mindfulness_score = sum(
            1 for pattern in mindfulness_patterns if pattern in response_lower
        )

        total_score = cbt_score + act_score + mindfulness_score

        return {
            "cbt_score": cbt_score,
            "act_score": act_score,
            "mindfulness_score": mindfulness_score,
            "total_score": total_score,
            "aligned": total_score >= 3,
            "primary_approach": self._get_primary_approach(cbt_score, act_score, mindfulness_score),
        }

    def _get_primary_approach(
        self, cbt_score: int, act_score: int, mindfulness_score: int
    ) -> str:
        """Determine primary therapeutic approach used."""
        scores = {
            "CBT": cbt_score,
            "ACT": act_score,
            "Mindfulness": mindfulness_score,
        }

        if max(scores.values()) == 0:
            return "None"

        return max(scores, key=scores.get)  # type: ignore[arg-type, return-value]
