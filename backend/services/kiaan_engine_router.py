"""
KIAAN Engine Router — 4-Engine Routing Policy

Classifies every user query and routes to the best engine(s):
1. Guidance Engine — life meaning, ethics, purpose, Gita wisdom
2. Friend Engine — emotional support, warmth, behavioral understanding
3. Assistant Engine — tasks, reminders, ecosystem control
4. Voice Guide — navigation, device orchestration

Supports multi-engine blending when queries span domains.
"""

import re
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional

# Optional: transformer-based sentiment for richer emotion detection
try:
    from backend.services.voice_learning.sentiment_analysis import SentimentAnalyzer
    _sentiment_analyzer: Optional["SentimentAnalyzer"] = None

    def _get_sentiment_analyzer() -> Optional["SentimentAnalyzer"]:
        global _sentiment_analyzer
        if _sentiment_analyzer is None:
            try:
                _sentiment_analyzer = SentimentAnalyzer()
            except Exception:
                pass
        return _sentiment_analyzer
except ImportError:
    def _get_sentiment_analyzer():  # type: ignore[misc]
        return None

logger = logging.getLogger(__name__)


class EngineType(str, Enum):
    GUIDANCE = "guidance"
    FRIEND = "friend"
    ASSISTANT = "assistant"
    VOICE_GUIDE = "voice_guide"


@dataclass
class RoutingDecision:
    """The result of routing a user query to one or more engines."""
    primary_engine: EngineType
    secondary_engines: List[EngineType] = field(default_factory=list)
    confidence: float = 0.8
    reasoning: str = ""
    is_crisis: bool = False
    detected_intent: str = "general"
    detected_emotion: Optional[str] = None
    # Voice-mode hints produced when route() is called with voice_mode=True.
    # Downstream consumers (wisdom_engine.generate_response, prompt loader) use
    # these to render a 30–45s spoken arc instead of a 4-part textual response.
    voice_mode: bool = False
    voice_render_mode: str | None = None  # "voice" | "text"
    voice_target_duration_sec: int | None = None  # 30 | 45 | 60 cap
    voice_engine_bias: str | None = None  # explanation of bias applied


class EngineRouter:
    """Routes user queries to the appropriate KIAAN engine(s)."""

    # Intent patterns for each engine
    ASSISTANT_PATTERNS = [
        r'\b(remind|reminder|alarm|timer|schedule|set.*(?:reminder|alarm|timer))\b',
        r'\b(what time|what day|calendar|event)\b',
        r'\b(search|look up|find|google|wikipedia)\b',
        r'\b(calculate|convert|math|how much|how many)\b',
        r'\b(play|pause|stop|skip|volume|louder|softer)\b',
    ]

    GUIDANCE_PATTERNS = [
        r'\b(meaning|purpose|dharma|karma|detachment|liberation|moksha)\b',
        r'\b(gita|krishna|arjuna|bhagavad|verse|shloka|chapter)\b',
        r'\b(right.*wrong|ethical|moral|duty|path)\b',
        r'\b(wisdom|enlighten|spiritual|consciousness|soul|atma)\b',
        r'\b(why.*suffering|why.*pain|what.*life|purpose.*life)\b',
        r'\b(meditation|mindful|inner.*peace|yoga)\b',
    ]

    VOICE_GUIDE_PATTERNS = [
        r'\b(open|go to|navigate|take me|switch to|show)\b',
        r'\b(mood.*insight|emotional.*reset|karma.*reset|karmic.*tree)\b',
        r'\b(journal|companion|viyog|ardha|sadhana)\b',
    ]

    FRIEND_EMOTION_KEYWORDS = {
        'anxiety': ['anxious', 'worried', 'panic', 'nervous', 'stressed', 'overwhelmed'],
        'sadness': ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'crying', 'tears'],
        'anger': ['angry', 'furious', 'mad', 'frustrated', 'irritated', 'rage'],
        'loneliness': ['lonely', 'alone', 'isolated', 'nobody', 'no one cares'],
        'fear': ['scared', 'afraid', 'terrified', 'frightened', 'fearful'],
        'guilt': ['guilty', 'ashamed', 'blame', 'regret', 'sorry'],
        'confusion': ['confused', 'lost', 'don\'t know', 'uncertain', 'unsure'],
        'joy': ['happy', 'excited', 'grateful', 'thankful', 'blessed', 'wonderful'],
    }

    CRISIS_KEYWORDS = [
        'kill myself', 'suicide', 'suicidal', 'end my life', 'hurt myself',
        'self harm', 'cut myself', 'overdose', 'want to die', 'better off dead',
        'no reason to live', 'can\'t take it anymore', 'can\'t go on',
        'kill someone', 'hurt someone', 'harm others',
    ]

    def route(
        self,
        query: str,
        context: dict | None = None,
        *,
        voice_mode: bool = False,
    ) -> RoutingDecision:
        """
        Route a user query to the appropriate engine(s).

        Decision order:
        1. Crisis detection (instant) — Friend + Guidance
        2. Intent classification — primary engine
        3. Emotion detection — optional secondary engine
        4. Compose routing decision with confidence
        5. Voice-mode adjustments (only when voice_mode=True)

        Args:
            query: The raw user query text.
            context: Optional dict with session/conversation context.
            voice_mode: When True, the decision is annotated with voice-render
                hints (target duration, engine bias) and the engine selection
                policy is biased per the spec:
                  • Casual / short queries → FRIEND (warmth wins over wisdom)
                  • Wisdom-direct queries (>= 0.4 guidance score) → GUIDANCE
                  • Navigation queries → VOICE_GUIDE (always-awake nav)
                  • ASSISTANT is suppressed unless intent is unambiguous
                    (>=0.6 score), because mid-conversation tool execution
                    breaks the divine-presence illusion.

        Returns:
            RoutingDecision with primary engine, optional secondaries,
            confidence score, reasoning, and (when voice_mode=True) voice
            render hints.
        """
        query_lower = query.lower().strip()
        context = context or {}

        # Step 1: Crisis detection (highest priority)
        if self._detect_crisis(query_lower):
            logger.warning("Crisis detected in query — routing to Friend + Guidance")
            return self._apply_voice_mode(
                RoutingDecision(
                    primary_engine=EngineType.FRIEND,
                    secondary_engines=[EngineType.GUIDANCE],
                    confidence=0.99,
                    reasoning="Crisis signals detected — compassionate support with wisdom",
                    is_crisis=True,
                    detected_intent="crisis",
                    detected_emotion="distress",
                ),
                voice_mode=voice_mode,
                query_lower=query_lower,
            )

        # Step 2: Intent classification
        assistant_score = self._score_patterns(query_lower, self.ASSISTANT_PATTERNS)
        guidance_score = self._score_patterns(query_lower, self.GUIDANCE_PATTERNS)
        voice_guide_score = self._score_patterns(query_lower, self.VOICE_GUIDE_PATTERNS)

        # Step 3: Emotion detection
        detected_emotion = self._detect_emotion(query_lower)
        friend_score = 0.3 if detected_emotion else 0.1  # Base friend score

        # Emotional queries boost friend score
        if detected_emotion in ('sadness', 'anxiety', 'anger', 'loneliness', 'fear', 'guilt'):
            friend_score += 0.5

        # Casual/conversational queries
        if self._is_casual(query_lower):
            friend_score += 0.4

        # Step 4: Select primary engine
        scores = {
            EngineType.ASSISTANT: assistant_score,
            EngineType.GUIDANCE: guidance_score,
            EngineType.VOICE_GUIDE: voice_guide_score,
            EngineType.FRIEND: friend_score,
        }

        primary = max(scores, key=scores.get)
        primary_score = scores[primary]

        # If no strong signal, default to Friend
        if primary_score < 0.2:
            primary = EngineType.FRIEND
            primary_score = 0.5

        # Step 5: Determine secondary engines
        secondary: List[EngineType] = []

        # If primary is Guidance and user is emotional, add Friend
        if primary == EngineType.GUIDANCE and detected_emotion:
            secondary.append(EngineType.FRIEND)

        # If primary is Friend and query has Gita keywords, add Guidance
        if primary == EngineType.FRIEND and guidance_score > 0.2:
            secondary.append(EngineType.GUIDANCE)

        # If primary is Assistant and user wants motivation, add Friend
        if primary == EngineType.ASSISTANT and (detected_emotion or 'motivat' in query_lower):
            secondary.append(EngineType.FRIEND)

        # Build reasoning
        score_str = ', '.join(f'{k.value}={v:.2f}' for k, v in scores.items())
        reasoning = f"Scores: [{score_str}]. "
        if detected_emotion:
            reasoning += f"Emotion: {detected_emotion}. "
        if secondary:
            reasoning += f"Blending with {[e.value for e in secondary]}."

        decision = RoutingDecision(
            primary_engine=primary,
            secondary_engines=secondary,
            confidence=min(primary_score + 0.3, 1.0),
            reasoning=reasoning,
            is_crisis=False,
            detected_intent=primary.value,
            detected_emotion=detected_emotion,
        )

        decision = self._apply_voice_mode(
            decision, voice_mode=voice_mode, query_lower=query_lower
        )
        logger.info(
            "Routing decision: %s (conf=%.2f, voice=%s) — %s",
            decision.primary_engine.value,
            decision.confidence,
            decision.voice_mode,
            decision.reasoning,
        )
        return decision

    # ─── Voice-mode policy ────────────────────────────────────────────
    def _apply_voice_mode(
        self,
        decision: RoutingDecision,
        *,
        voice_mode: bool,
        query_lower: str,
    ) -> RoutingDecision:
        """Annotate (and lightly bias) a RoutingDecision for voice mode.

        Text-mode decisions pass through unchanged. Voice mode adds:
          • render_mode = "voice"
          • target duration based on engine + crisis state
          • a soft bias away from ASSISTANT when intent is ambiguous, because
            mid-conversation tool execution breaks the divine-presence illusion.

        We never *change* the primary engine in crisis state — safety routing
        wins over voice ergonomics.
        """
        if not voice_mode:
            decision.voice_mode = False
            decision.voice_render_mode = "text"
            return decision

        decision.voice_mode = True
        decision.voice_render_mode = "voice"

        # Crisis turns are tightly capped — the helpline audio is the priority,
        # not Sakha's commentary.
        if decision.is_crisis:
            decision.voice_target_duration_sec = 20
            decision.voice_engine_bias = "crisis: short routing acknowledgment only"
            return decision

        # Bias away from ASSISTANT when the signal is ambiguous in voice mode.
        # ASSISTANT in voice mode requires unambiguous intent (>= 0.6 confidence).
        if (
            decision.primary_engine == EngineType.ASSISTANT
            and decision.confidence < 0.6
        ):
            previous = decision.primary_engine
            # Prefer FRIEND for emotional context, GUIDANCE for wisdom-tinged
            # queries, VOICE_GUIDE only when explicit nav is present.
            if decision.detected_emotion:
                decision.primary_engine = EngineType.FRIEND
            elif self._score_patterns(query_lower, self.GUIDANCE_PATTERNS) > 0.2:
                decision.primary_engine = EngineType.GUIDANCE
            else:
                decision.primary_engine = EngineType.FRIEND
            decision.voice_engine_bias = (
                f"voice bias: ambiguous ASSISTANT (conf={decision.confidence:.2f}) "
                f"redirected from {previous.value} → {decision.primary_engine.value}"
            )
            decision.detected_intent = decision.primary_engine.value

        # Target duration per engine
        if decision.primary_engine == EngineType.GUIDANCE:
            decision.voice_target_duration_sec = 45  # full Sanskrit + arc
        elif decision.primary_engine == EngineType.FRIEND:
            decision.voice_target_duration_sec = 30  # warmth + presence
        elif decision.primary_engine == EngineType.VOICE_GUIDE:
            decision.voice_target_duration_sec = 25  # acknowledge + carry
        else:  # ASSISTANT
            decision.voice_target_duration_sec = 25
        return decision

    def _detect_crisis(self, query_lower: str) -> bool:
        """Check for crisis signals. Must be fast (<50ms)."""
        for keyword in self.CRISIS_KEYWORDS:
            if keyword in query_lower:
                return True
        return False

    def _score_patterns(self, query_lower: str, patterns: list) -> float:
        """Score how well a query matches a set of regex patterns."""
        matches = sum(1 for p in patterns if re.search(p, query_lower))
        return min(matches * 0.3, 1.0)

    def _detect_emotion(self, query_lower: str) -> Optional[str]:
        """Detect the dominant emotion in a query.

        Uses transformer-based SentimentAnalyzer when available for 13-category
        emotion detection with intensity scoring. Falls back to keyword matching
        when the analyzer is not loaded (cold start, import failure, etc.).
        """
        # Try transformer-based detection first (13 emotion categories vs 8 keywords)
        analyzer = _get_sentiment_analyzer()
        if analyzer is not None:
            try:
                result = analyzer.analyze(query_lower)
                if result and hasattr(result, "primary_emotion") and result.primary_emotion:
                    # Map analyzer emotion names to our engine emotion taxonomy
                    emotion = result.primary_emotion.lower()
                    intensity = getattr(result, "intensity", 0.5)
                    # Only trust the analyzer if intensity is meaningful
                    if intensity > 0.3 and emotion != "neutral":
                        return emotion
            except Exception:
                pass  # Fall through to keyword-based detection

        # Fallback: keyword-based emotion detection
        best_emotion = None
        best_count = 0
        for emotion, keywords in self.FRIEND_EMOTION_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in query_lower)
            if count > best_count:
                best_count = count
                best_emotion = emotion
        return best_emotion if best_count > 0 else None

    def _is_casual(self, query_lower: str) -> bool:
        """Detect casual/conversational queries."""
        casual_patterns = [
            r'^(hi|hello|hey|sup|what\'s up|how are you)',
            r'\b(chat|talk|hang out|bored|lonely|friend)\b',
            r'\b(tell me|about you|your name|who are you)\b',
            r'\b(joke|funny|laugh|fun)\b',
        ]
        return any(re.search(p, query_lower) for p in casual_patterns)


# Singleton
_router_instance: Optional[EngineRouter] = None


def get_engine_router() -> EngineRouter:
    """Get the singleton EngineRouter instance."""
    global _router_instance
    if _router_instance is None:
        _router_instance = EngineRouter()
    return _router_instance
