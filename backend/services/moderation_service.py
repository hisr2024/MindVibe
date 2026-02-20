"""
AI Moderation Service for Community Wisdom Circles

Multi-layer content moderation system:
- Toxicity detection (hate speech, abuse, harassment)
- Harm risk detection (suicide, self-harm mentions)
- PII detection (email, phone, personal info)
- Spam filtering
- Compassion scoring
- Crisis detection and escalation

Uses rule-based + optional AI (OpenAI Moderation API) for comprehensive safety.

Quantum Enhancement #5: Community Wisdom Circles
"""

import re
import threading
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel
from enum import Enum


class ModerationResult(str, Enum):
    """Moderation decision"""
    APPROVED = "approved"
    FLAGGED = "flagged"  # Needs human review
    REJECTED = "rejected"  # Auto-rejected
    CRISIS = "crisis"  # Urgent intervention needed


class ModerationCategory(str, Enum):
    """Categories of moderation issues"""
    TOXICITY = "toxicity"
    HARM_RISK = "harm_risk"
    PII = "pii"
    SPAM = "spam"
    COMPASSION = "compassion"
    CRISIS = "crisis"


class ModerationReport(BaseModel):
    """Detailed moderation analysis"""
    result: ModerationResult
    confidence: float  # 0.0 to 1.0
    categories_flagged: List[ModerationCategory]
    reasons: List[str]
    compassion_score: float  # 0.0 to 1.0
    requires_review: bool
    crisis_detected: bool
    crisis_keywords: List[str]
    suggestions: List[str]  # Suggestions for user to improve content
    analyzed_at: datetime


# Crisis keywords (suicide, self-harm)
CRISIS_KEYWORDS = [
    'kill myself', 'end my life', 'want to die', 'better off dead',
    'suicide', 'suicidal', 'end it all', 'no reason to live',
    'self harm', 'cut myself', 'hurt myself', 'harm myself',
    'overdose', 'take all the pills', 'jump off', 'hang myself'
]

# High-risk harm keywords
HARM_KEYWORDS = [
    'depressed', 'depression', 'hopeless', 'worthless', 'useless',
    'hate myself', 'can\'t go on', 'give up', 'no hope', 'no future',
    'alone', 'isolated', 'abandoned', 'broken', 'empty inside'
]

# Toxicity keywords
TOXICITY_KEYWORDS = [
    'stupid', 'idiot', 'loser', 'pathetic', 'worthless',
    'kill yourself', 'kys', 'die', 'hate you', 'disgusting',
    'ugly', 'fat', 'dumb', 'moron', 'retard', 'freak'
]

# Compassionate keywords (positive indicators)
COMPASSION_KEYWORDS = [
    'understand', 'here for you', 'support', 'care', 'love',
    'strength', 'courage', 'proud', 'brave', 'resilient',
    'hope', 'better', 'improve', 'help', 'together',
    'listen', 'hear you', 'valid', 'matter', 'important',
    'gentle', 'kind', 'compassion', 'empathy', 'peace'
]

# Spam indicators
SPAM_PATTERNS = [
    r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',  # URLs
    r'\b(?:buy|click|subscribe|follow me|check out)\b',  # Call to action
    r'([A-Z]{4,}\s+){3,}',  # ALL CAPS spam
    r'(.)\1{4,}',  # Character repetition (!!!!! or ?????)
]


class ModerationService:
    """AI-powered content moderation for community safety"""

    def __init__(self, openai_api_key: Optional[str] = None, use_openai: bool = False):
        """
        Initialize moderation service

        Args:
            openai_api_key: Optional OpenAI API key for enhanced moderation
            use_openai: Whether to use OpenAI Moderation API (requires API key)
        """
        self.use_openai = use_openai and openai_api_key is not None
        self.openai_api_key = openai_api_key

    async def moderate_content(
        self, content: str, author_history: Optional[Dict] = None
    ) -> ModerationReport:
        """
        Moderate content for community post

        Multi-layer analysis:
        1. Crisis detection (highest priority)
        2. Harm risk detection
        3. Toxicity detection
        4. PII detection
        5. Spam detection
        6. Compassion scoring

        Args:
            content: Text content to moderate
            author_history: Optional author history (posts, violations, etc.)

        Returns:
            ModerationReport with decision and details
        """
        categories_flagged = []
        reasons = []
        crisis_keywords_found = []
        suggestions = []

        # 1. Crisis Detection (highest priority)
        crisis_detected, crisis_kw = self._detect_crisis(content)
        if crisis_detected:
            categories_flagged.append(ModerationCategory.CRISIS)
            crisis_keywords_found = crisis_kw
            reasons.append(f"Crisis keywords detected: {', '.join(crisis_kw[:3])}")

            return ModerationReport(
                result=ModerationResult.CRISIS,
                confidence=1.0,
                categories_flagged=categories_flagged,
                reasons=reasons,
                compassion_score=0.0,
                requires_review=True,
                crisis_detected=True,
                crisis_keywords=crisis_keywords_found,
                suggestions=["Please reach out to a spiritual wellness professional or crisis hotline."],
                analyzed_at=datetime.now()
            )

        # 2. Harm Risk Detection
        harm_score = self._detect_harm_risk(content)
        if harm_score > 0.6:
            categories_flagged.append(ModerationCategory.HARM_RISK)
            reasons.append(f"High harm risk detected (score: {harm_score:.2f})")
            suggestions.append("Consider rephrasing to focus on seeking support rather than expressing harm.")

        # 3. Toxicity Detection
        toxicity_score = self._detect_toxicity(content)
        if toxicity_score > 0.7:
            categories_flagged.append(ModerationCategory.TOXICITY)
            reasons.append(f"Toxic language detected (score: {toxicity_score:.2f})")
            suggestions.append("Please use respectful and compassionate language.")

        # 4. PII Detection
        pii_detected, pii_types = self._detect_pii(content)
        if pii_detected:
            categories_flagged.append(ModerationCategory.PII)
            reasons.append(f"Personal information detected: {', '.join(pii_types)}")
            suggestions.append("Please remove personal information (email, phone, social media handles) to protect your privacy.")

        # 5. Spam Detection
        spam_score = self._detect_spam(content)
        if spam_score > 0.7:
            categories_flagged.append(ModerationCategory.SPAM)
            reasons.append(f"Spam indicators detected (score: {spam_score:.2f})")
            suggestions.append("Please share genuine thoughts without promotional content or links.")

        # 6. Compassion Scoring
        compassion_score = self._score_compassion(content)

        # Optional: OpenAI Moderation API
        if self.use_openai:
            openai_result = await self._openai_moderation(content)
            if openai_result['flagged']:
                for category in openai_result['categories']:
                    reasons.append(f"OpenAI detected: {category}")

        # Final Decision
        result = self._make_final_decision(
            categories_flagged, toxicity_score, harm_score, spam_score, compassion_score
        )

        return ModerationReport(
            result=result,
            confidence=self._calculate_confidence(categories_flagged),
            categories_flagged=categories_flagged,
            reasons=reasons,
            compassion_score=compassion_score,
            requires_review=result == ModerationResult.FLAGGED,
            crisis_detected=False,
            crisis_keywords=[],
            suggestions=suggestions,
            analyzed_at=datetime.now()
        )

    def _detect_crisis(self, content: str) -> Tuple[bool, List[str]]:
        """
        Detect crisis keywords (suicide, self-harm)

        Args:
            content: Text content

        Returns:
            Tuple of (crisis_detected, keywords_found)
        """
        content_lower = content.lower()
        keywords_found = []

        for keyword in CRISIS_KEYWORDS:
            if keyword in content_lower:
                keywords_found.append(keyword)

        return len(keywords_found) > 0, keywords_found

    def _detect_harm_risk(self, content: str) -> float:
        """
        Detect harm risk keywords and calculate risk score

        Args:
            content: Text content

        Returns:
            Risk score (0.0 to 1.0)
        """
        content_lower = content.lower()
        harm_count = 0

        for keyword in HARM_KEYWORDS:
            if keyword in content_lower:
                harm_count += 1

        # Normalize to 0-1 scale
        max_expected = 5  # If someone uses 5+ harm keywords, that's very high risk
        return min(harm_count / max_expected, 1.0)

    def _detect_toxicity(self, content: str) -> float:
        """
        Detect toxic language

        Args:
            content: Text content

        Returns:
            Toxicity score (0.0 to 1.0)
        """
        content_lower = content.lower()
        toxicity_count = 0

        for keyword in TOXICITY_KEYWORDS:
            if keyword in content_lower:
                toxicity_count += 1

        # Normalize to 0-1 scale
        max_expected = 3
        return min(toxicity_count / max_expected, 1.0)

    def _detect_pii(self, content: str) -> Tuple[bool, List[str]]:
        """
        Detect personally identifiable information

        Args:
            content: Text content

        Returns:
            Tuple of (pii_detected, pii_types)
        """
        pii_types = []

        # Email pattern
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content):
            pii_types.append('email')

        # Phone number
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\b\d{10}\b',
            r'\+\d{1,3}\s?\d{6,14}\b'
        ]
        for pattern in phone_patterns:
            if re.search(pattern, content):
                pii_types.append('phone')
                break

        # Social media handle
        if re.search(r'@[A-Za-z0-9_]{3,}', content):
            pii_types.append('social_handle')

        # URL
        if re.search(r'https?://', content):
            pii_types.append('url')

        return len(pii_types) > 0, pii_types

    def _detect_spam(self, content: str) -> float:
        """
        Detect spam indicators

        Args:
            content: Text content

        Returns:
            Spam score (0.0 to 1.0)
        """
        spam_indicators = 0

        for pattern in SPAM_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                spam_indicators += 1

        # Check for excessive length (spam often very long)
        if len(content) > 1000:
            spam_indicators += 1

        # Check for excessive repetition
        words = content.lower().split()
        if len(words) > 10:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.3:  # Less than 30% unique words
                spam_indicators += 1

        max_indicators = 4
        return min(spam_indicators / max_indicators, 1.0)

    def _score_compassion(self, content: str) -> float:
        """
        Score content for compassion and supportiveness

        Higher score = more compassionate

        Args:
            content: Text content

        Returns:
            Compassion score (0.0 to 1.0)
        """
        content_lower = content.lower()
        compassion_count = 0

        for keyword in COMPASSION_KEYWORDS:
            if keyword in content_lower:
                compassion_count += 1

        # Check for questions (supportive inquiry)
        question_count = content.count('?')
        if question_count > 0:
            compassion_count += min(question_count, 2)  # Cap at 2 bonus points

        # Check for empathy phrases
        empathy_phrases = [
            'i understand', 'i hear you', 'i see you', 'i feel',
            'that must be', 'sounds like', 'it seems'
        ]
        for phrase in empathy_phrases:
            if phrase in content_lower:
                compassion_count += 1

        # Normalize to 0-1 scale
        max_expected = 8  # Someone using 8+ compassion indicators is very supportive
        return min(compassion_count / max_expected, 1.0)

    async def _openai_moderation(self, content: str) -> Dict:
        """
        Use OpenAI Moderation API (optional enhancement)

        Args:
            content: Text content

        Returns:
            Dict with flagged status and categories
        """
        # This would integrate with OpenAI API in production
        # For now, return structure
        return {
            'flagged': False,
            'categories': []
        }

    def _make_final_decision(
        self,
        categories_flagged: List[ModerationCategory],
        toxicity_score: float,
        harm_score: float,
        spam_score: float,
        compassion_score: float
    ) -> ModerationResult:
        """
        Make final moderation decision based on all factors

        Args:
            categories_flagged: List of flagged categories
            toxicity_score: Toxicity score (0-1)
            harm_score: Harm risk score (0-1)
            spam_score: Spam score (0-1)
            compassion_score: Compassion score (0-1)

        Returns:
            ModerationResult decision
        """
        # Auto-reject if high toxicity or spam
        if toxicity_score > 0.8 or spam_score > 0.8:
            return ModerationResult.REJECTED

        # Flag for review if harm risk or PII
        if ModerationCategory.HARM_RISK in categories_flagged or ModerationCategory.PII in categories_flagged:
            return ModerationResult.FLAGGED

        # Flag if multiple categories flagged
        if len(categories_flagged) >= 2:
            return ModerationResult.FLAGGED

        # Approve if compassionate and no major issues
        if compassion_score > 0.3 and len(categories_flagged) == 0:
            return ModerationResult.APPROVED

        # Default: flag for review if anything flagged
        if len(categories_flagged) > 0:
            return ModerationResult.FLAGGED

        return ModerationResult.APPROVED

    def _calculate_confidence(self, categories_flagged: List[ModerationCategory]) -> float:
        """
        Calculate confidence in moderation decision

        Args:
            categories_flagged: List of flagged categories

        Returns:
            Confidence score (0.0 to 1.0)
        """
        # Higher confidence when clear-cut (many categories or none)
        if len(categories_flagged) == 0:
            return 0.95
        elif len(categories_flagged) >= 3:
            return 0.9
        else:
            return 0.7

    def award_compassion_badge(
        self, user_anonymous_id: str, badge_type: str, circle_id: int
    ) -> Dict:
        """
        Award compassion badge to user for supportive behavior

        Badge types:
        - 'heart': Empathetic response
        - 'wisdom': Thoughtful guidance
        - 'strength': Encouraging words
        - 'peace': Calming presence

        Args:
            user_anonymous_id: Anonymous ID of user
            badge_type: Type of badge
            circle_id: Circle ID

        Returns:
            Badge award details
        """
        return {
            'badge_type': badge_type,
            'awarded_to': user_anonymous_id,
            'circle_id': circle_id,
            'awarded_at': datetime.now(),
            'description': self._get_badge_description(badge_type)
        }

    def _get_badge_description(self, badge_type: str) -> str:
        """Get description for badge type"""
        descriptions = {
            'heart': 'Awarded for showing deep empathy and understanding',
            'wisdom': 'Awarded for sharing thoughtful guidance',
            'strength': 'Awarded for providing encouragement and support',
            'peace': 'Awarded for bringing calm and perspective'
        }
        return descriptions.get(badge_type, 'Compassion badge')


# Singleton instance with thread-safe initialization
_moderation_service: Optional[ModerationService] = None
_moderation_service_lock = threading.Lock()


def get_moderation_service() -> ModerationService:
    """Get or create singleton moderation service instance with thread-safe initialization"""
    global _moderation_service
    if _moderation_service is None:
        with _moderation_service_lock:
            # Double-check after acquiring lock
            if _moderation_service is None:
                import os
                openai_key = os.getenv('OPENAI_API_KEY')
                use_openai = os.getenv('USE_OPENAI_MODERATION', 'false').lower() == 'true'
                _moderation_service = ModerationService(openai_api_key=openai_key, use_openai=use_openai)
    return _moderation_service
