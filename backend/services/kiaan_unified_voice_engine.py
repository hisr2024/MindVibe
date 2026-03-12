"""KIAAN Unified Voice Engine - Three-Engine Architecture

Merges the Voice Companion (Guidance + Friend engines) with the Voice Guide
into a single unified system. KIAAN is now an always-awake voice assistant
(like Siri, Alexa, Bixby) that can independently guide users anywhere in the
KIAAN Ecosystem and provide voice input to any tool.

THREE ENGINES:
    Engine 1 - GUIDANCE ENGINE:
        Bhagavad Gita wisdom delivery through modern, secular lens.
        Behavioral science framework (CBT, MI, Polyvagal, ACT).
        5-phase conversation: CONNECT -> LISTEN -> UNDERSTAND -> GUIDE -> EMPOWER.

    Engine 2 - FRIEND ENGINE:
        Best friend personality, warm and supportive.
        Cross-session memory (life events, preferences, emotional patterns).
        Mood detection and trend analytics.
        Crisis detection with helpline support.

    Engine 3 - VOICE GUIDE ENGINE (NEW):
        Always-awake voice assistant capabilities.
        Ecosystem-wide navigation via voice commands.
        Voice input injection into any KIAAN tool.
        Intent classification and routing.
        Context-aware tool switching.
        Proactive guidance based on user state.

The three engines work in concert: the Voice Guide is the 'ears and hands'
that routes and directs, the Guidance Engine is the 'wisdom', and the
Friend Engine is the 'heart'.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ─── Engine Mode Enum ─────────────────────────────────────────────────────────

class KiaanEngineMode(str, Enum):
    """Which engine is currently active for this interaction."""
    GUIDANCE = "guidance"
    FRIEND = "friend"
    VOICE_GUIDE = "voice_guide"


class VoiceGuideAction(str, Enum):
    """Actions the Voice Guide engine can perform across the ecosystem."""
    NAVIGATE = "navigate"
    INPUT_TO_TOOL = "input_to_tool"
    QUERY = "query"
    CONTROL = "control"
    MOOD_CHECK = "mood_check"
    DAILY_WISDOM = "daily_wisdom"
    VERSE_LOOKUP = "verse_lookup"
    START_SESSION = "start_session"
    END_SESSION = "end_session"


class EcosystemTool(str, Enum):
    """All tools in the KIAAN ecosystem that the Voice Guide can interact with."""
    KIAAN_CHAT = "kiaan-chat"
    COMPANION = "companion"
    VIYOGA = "viyoga"
    ARDHA = "ardha"
    RELATIONSHIP_COMPASS = "relationship-compass"
    EMOTIONAL_RESET = "emotional-reset"
    KARMA_RESET = "karma-reset"
    KARMA_FOOTPRINT = "karma-footprint"
    KARMIC_TREE = "karmic-tree"
    SACRED_REFLECTIONS = "sacred-reflections"
    KIAAN_VIBE = "kiaan-vibe"
    WISDOM_ROOMS = "wisdom-rooms"
    SADHANA = "sadhana"
    GITA_LIBRARY = "gita-library"
    MOOD_INSIGHTS = "mood-insights"


# ─── Data Classes ─────────────────────────────────────────────────────────────

@dataclass
class VoiceGuideResult:
    """Result from the Voice Guide engine processing a voice command."""
    action: VoiceGuideAction
    target_tool: Optional[EcosystemTool] = None
    route: Optional[str] = None
    response: str = ""
    input_payload: Optional[Dict[str, Any]] = None
    confidence: float = 0.0
    engine_mode: KiaanEngineMode = KiaanEngineMode.VOICE_GUIDE
    follow_up: Optional[str] = None
    should_speak: bool = True
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UnifiedEngineResult:
    """Unified result from any of the three engines."""
    engine: KiaanEngineMode
    response: str
    mood: Optional[str] = None
    mood_intensity: float = 0.5
    voice_guide_result: Optional[VoiceGuideResult] = None
    guidance_data: Optional[Dict[str, Any]] = None
    friend_data: Optional[Dict[str, Any]] = None
    follow_up: Optional[str] = None
    should_speak: bool = True
    audio_config: Optional[Dict[str, Any]] = None


# ─── Tool Route Mapping ──────────────────────────────────────────────────────

TOOL_ROUTES: Dict[EcosystemTool, str] = {
    EcosystemTool.KIAAN_CHAT: "/kiaan/chat",
    EcosystemTool.COMPANION: "/companion",
    EcosystemTool.VIYOGA: "/tools/viyog",
    EcosystemTool.ARDHA: "/tools/ardha",
    EcosystemTool.RELATIONSHIP_COMPASS: "/tools/relationship-compass",
    EcosystemTool.EMOTIONAL_RESET: "/tools/emotional-reset",
    EcosystemTool.KARMA_RESET: "/tools/karma-reset",
    EcosystemTool.KARMA_FOOTPRINT: "/tools/karma-footprint",
    EcosystemTool.KARMIC_TREE: "/tools/karmic-tree",
    EcosystemTool.SACRED_REFLECTIONS: "/sacred-reflections",
    EcosystemTool.KIAAN_VIBE: "/kiaan-vibe",
    EcosystemTool.WISDOM_ROOMS: "/wisdom-rooms",
    EcosystemTool.SADHANA: "/sadhana",
    EcosystemTool.GITA_LIBRARY: "/kiaan-vibe/gita",
    EcosystemTool.MOOD_INSIGHTS: "/dashboard/analytics",
}

# Tool name aliases for voice recognition
TOOL_ALIASES: Dict[str, EcosystemTool] = {
    "chat": EcosystemTool.KIAAN_CHAT,
    "kiaan": EcosystemTool.KIAAN_CHAT,
    "companion": EcosystemTool.COMPANION,
    "friend": EcosystemTool.COMPANION,
    "voice": EcosystemTool.COMPANION,
    "viyoga": EcosystemTool.VIYOGA,
    "viyog": EcosystemTool.VIYOGA,
    "detachment": EcosystemTool.VIYOGA,
    "letting go": EcosystemTool.VIYOGA,
    "ardha": EcosystemTool.ARDHA,
    "reframe": EcosystemTool.ARDHA,
    "reframing": EcosystemTool.ARDHA,
    "thought": EcosystemTool.ARDHA,
    "relationship": EcosystemTool.RELATIONSHIP_COMPASS,
    "compass": EcosystemTool.RELATIONSHIP_COMPASS,
    "emotional reset": EcosystemTool.EMOTIONAL_RESET,
    "reset emotions": EcosystemTool.EMOTIONAL_RESET,
    "calm down": EcosystemTool.EMOTIONAL_RESET,
    "karma reset": EcosystemTool.KARMA_RESET,
    "heal karma": EcosystemTool.KARMA_RESET,
    "forgiveness": EcosystemTool.KARMA_RESET,
    "footprint": EcosystemTool.KARMA_FOOTPRINT,
    "daily actions": EcosystemTool.KARMA_FOOTPRINT,
    "karmic tree": EcosystemTool.KARMIC_TREE,
    "growth": EcosystemTool.KARMIC_TREE,
    "progress": EcosystemTool.KARMIC_TREE,
    "journal": EcosystemTool.SACRED_REFLECTIONS,
    "reflections": EcosystemTool.SACRED_REFLECTIONS,
    "diary": EcosystemTool.SACRED_REFLECTIONS,
    "music": EcosystemTool.KIAAN_VIBE,
    "vibe": EcosystemTool.KIAAN_VIBE,
    "meditation": EcosystemTool.KIAAN_VIBE,
    "wisdom rooms": EcosystemTool.WISDOM_ROOMS,
    "community": EcosystemTool.WISDOM_ROOMS,
    "sadhana": EcosystemTool.SADHANA,
    "daily practice": EcosystemTool.SADHANA,
    "gita": EcosystemTool.GITA_LIBRARY,
    "verses": EcosystemTool.GITA_LIBRARY,
    "bhagavad gita": EcosystemTool.GITA_LIBRARY,
    "mood": EcosystemTool.MOOD_INSIGHTS,
    "insights": EcosystemTool.MOOD_INSIGHTS,
    "analytics": EcosystemTool.MOOD_INSIGHTS,
}

# Tool descriptions for voice responses
TOOL_DESCRIPTIONS: Dict[EcosystemTool, str] = {
    EcosystemTool.KIAAN_CHAT: "KIAAN Chat - your spiritual companion for text conversations",
    EcosystemTool.COMPANION: "KIAAN Companion - your divine best friend with voice",
    EcosystemTool.VIYOGA: "Viyoga - release attachment to outcomes with Gita wisdom",
    EcosystemTool.ARDHA: "Ardha - reframe thoughts using Gita-aligned cognitive techniques",
    EcosystemTool.RELATIONSHIP_COMPASS: "Relationship Compass - Gita-grounded relationship guidance",
    EcosystemTool.EMOTIONAL_RESET: "Emotional Reset - 7-step guided inner peace flow",
    EcosystemTool.KARMA_RESET: "Karma Reset - heal relational harm with compassion",
    EcosystemTool.KARMA_FOOTPRINT: "Karma Footprint - daily action reflection",
    EcosystemTool.KARMIC_TREE: "Karmic Tree - visual spiritual progress tracking",
    EcosystemTool.SACRED_REFLECTIONS: "Sacred Reflections - encrypted spiritual journaling",
    EcosystemTool.KIAAN_VIBE: "KIAAN Vibe Player - divine Gita verses and meditation audio",
    EcosystemTool.WISDOM_ROOMS: "Wisdom Rooms - Bhagavad Gita community wisdom",
    EcosystemTool.SADHANA: "Nityam Sadhana - daily sacred spiritual practice",
    EcosystemTool.GITA_LIBRARY: "Gita Library - explore all 700+ sacred verses",
    EcosystemTool.MOOD_INSIGHTS: "Mood Insights - inner state patterns and analytics",
}


# ─── Voice Guide Intent Patterns ─────────────────────────────────────────────

# Navigation commands
NAVIGATION_PATTERNS = [
    re.compile(r"(?:take me to|go to|open|show me|navigate to|switch to|bring up)\s+(.+)", re.IGNORECASE),
    re.compile(r"^(?:let'?s|lets)\s+(?:go to|try|use|open)\s+(.+)", re.IGNORECASE),
    re.compile(r"^(?:start|begin|launch)\s+(.+)", re.IGNORECASE),
]

# Input injection patterns - "tell ardha that...", "write in journal..."
INPUT_PATTERNS = [
    re.compile(r"(?:tell|say to|input to|type in|write in|send to)\s+(\w+)\s+(?:that\s+)?(.+)", re.IGNORECASE),
    re.compile(r"(?:add|put|enter)\s+(?:this\s+)?(?:in|into|to)\s+(\w+)[:]\s*(.+)", re.IGNORECASE),
    re.compile(r"(?:journal|write|note|reflect)\s*[:]\s*(.+)", re.IGNORECASE),
]

# Control commands
CONTROL_PATTERNS = [
    (re.compile(r"^(?:stop|cancel|end|quit|close|shut up|be quiet)", re.IGNORECASE), "stop"),
    (re.compile(r"^(?:pause|wait|hold on|one moment)", re.IGNORECASE), "pause"),
    (re.compile(r"^(?:resume|continue|go on|keep going)", re.IGNORECASE), "resume"),
    (re.compile(r"^(?:louder|volume up|speak louder)", re.IGNORECASE), "volume_up"),
    (re.compile(r"^(?:softer|quieter|volume down|speak softer)", re.IGNORECASE), "volume_down"),
    (re.compile(r"^(?:repeat|say that again|what did you say)", re.IGNORECASE), "repeat"),
]

# Verse lookup
VERSE_PATTERNS = [
    re.compile(r"(?:read|show|what is|explain|recite)\s+(?:verse|bg|gita|bhagavad gita)\s*(\d+)[.:](\d+)", re.IGNORECASE),
    re.compile(r"(?:bg|gita)\s*(\d+)[.:](\d+)", re.IGNORECASE),
    re.compile(r"chapter\s*(\d+)\s*verse\s*(\d+)", re.IGNORECASE),
]

# Mood check patterns
MOOD_CHECK_PATTERNS = [
    re.compile(r"(?:how am i|check my mood|what's my mood|mood check|how do i feel)", re.IGNORECASE),
    re.compile(r"(?:i feel|i'm feeling|feeling)\s+(\w+)", re.IGNORECASE),
]

# Daily wisdom request
WISDOM_PATTERNS = [
    re.compile(r"(?:daily wisdom|today's wisdom|give me wisdom|morning wisdom|inspire me|motivate me)", re.IGNORECASE),
    re.compile(r"(?:what does the gita say about|gita wisdom for|teach me about)\s+(.+)", re.IGNORECASE),
]

# Emotion keywords for mood detection
EMOTION_KEYWORDS: Dict[str, List[str]] = {
    "anxiety": ["anxious", "worried", "scared", "nervous", "panic", "fearful", "restless", "uneasy"],
    "sadness": ["sad", "depressed", "down", "unhappy", "crying", "grief", "mourning", "heartbroken"],
    "anger": ["angry", "furious", "mad", "frustrated", "irritated", "rage", "resentful"],
    "guilt": ["guilty", "ashamed", "regret", "sorry", "remorse", "blame myself"],
    "confusion": ["confused", "lost", "uncertain", "don't know", "unsure", "stuck"],
    "loneliness": ["lonely", "alone", "isolated", "nobody", "no one understands"],
    "overwhelm": ["overwhelmed", "too much", "can't cope", "breaking down", "falling apart"],
    "hope": ["hopeful", "better", "improving", "optimistic", "grateful"],
    "peace": ["peaceful", "calm", "serene", "relaxed", "content", "at ease"],
    "excitement": ["excited", "happy", "joyful", "amazing", "wonderful", "great"],
}


# ─── Unified Voice Engine ─────────────────────────────────────────────────────

class KiaanUnifiedVoiceEngine:
    """
    The unified KIAAN Voice Engine with three sub-engines.

    This is the central intelligence that determines which engine to activate
    based on the user's voice input, and coordinates between them seamlessly.

    Always-awake: KIAAN listens continuously (when permitted) and can be
    activated by voice at any time, from any screen in the ecosystem.
    """

    def __init__(self):
        self._friendship_engine = None
        self._companion_engine = None
        self._guidance_engine = None
        logger.info("KIAAN Unified Voice Engine initialized with 3 engines: Guidance + Friend + Voice Guide")

    def _get_friendship_engine(self):
        """Lazy-load the friendship engine to avoid circular imports."""
        if self._friendship_engine is None:
            try:
                from backend.services.kiaan_friendship_engine import get_friendship_engine
                self._friendship_engine = get_friendship_engine()
            except ImportError:
                logger.warning("Friendship engine not available")
        return self._friendship_engine

    def _get_companion_engine(self):
        """Lazy-load the companion friend engine."""
        if self._companion_engine is None:
            try:
                from backend.services.companion_friend_engine import CompanionFriendEngine
                self._companion_engine = CompanionFriendEngine()
            except ImportError:
                logger.warning("Companion friend engine not available")
        return self._companion_engine

    # ─── Engine 3: Voice Guide ─────────────────────────────────────────

    def classify_voice_command(
        self,
        transcript: str,
        current_tool: Optional[str] = None,
        user_mood: Optional[str] = None,
    ) -> VoiceGuideResult:
        """
        Classify a voice command and determine the appropriate action.

        The Voice Guide engine processes the raw transcript and decides:
        1. Is this a navigation command? -> Route to tool
        2. Is this input for a specific tool? -> Inject into tool
        3. Is this a control command? -> Execute control action
        4. Is this a mood check? -> Run mood analysis
        5. Is this a wisdom request? -> Fetch daily wisdom
        6. Is this a verse lookup? -> Find and read verse
        7. Is this a general query? -> Route to Friend/Guidance engine

        Args:
            transcript: Raw voice transcript from STT
            current_tool: Which tool the user is currently in (for context)
            user_mood: Currently detected mood (if available)

        Returns:
            VoiceGuideResult with action, target, route, and response
        """
        text = transcript.strip()
        if not text:
            return VoiceGuideResult(
                action=VoiceGuideAction.QUERY,
                response="I didn't catch that. Could you say it again?",
                confidence=0.0,
            )

        lower = text.lower()

        # 1. Control commands (highest priority)
        for pattern, command in CONTROL_PATTERNS:
            if pattern.search(lower):
                return VoiceGuideResult(
                    action=VoiceGuideAction.CONTROL,
                    response=self._get_control_response(command),
                    confidence=0.95,
                    context={"command": command},
                )

        # 2. Navigation commands
        for pattern in NAVIGATION_PATTERNS:
            match = pattern.search(lower)
            if match:
                tool_name = match.group(1).strip()
                resolved = self._resolve_tool(tool_name)
                if resolved:
                    route = TOOL_ROUTES.get(resolved, "/companion")
                    desc = TOOL_DESCRIPTIONS.get(resolved, "")
                    return VoiceGuideResult(
                        action=VoiceGuideAction.NAVIGATE,
                        target_tool=resolved,
                        route=route,
                        response=f"Opening {desc}",
                        confidence=0.9,
                        follow_up=f"I'm taking you to {desc.split(' - ')[0]}. What would you like to do there?",
                    )

        # 3. Input injection to specific tool
        for pattern in INPUT_PATTERNS[:2]:  # First two patterns have tool + content
            match = pattern.search(lower)
            if match:
                tool_name = match.group(1).strip()
                content = match.group(2).strip()
                resolved = self._resolve_tool(tool_name)
                if resolved:
                    route = TOOL_ROUTES.get(resolved, "/companion")
                    return VoiceGuideResult(
                        action=VoiceGuideAction.INPUT_TO_TOOL,
                        target_tool=resolved,
                        route=route,
                        response=f"Sending your input to {TOOL_DESCRIPTIONS.get(resolved, tool_name).split(' - ')[0]}",
                        input_payload={"content": content, "source": "voice_guide"},
                        confidence=0.85,
                    )

        # Journal/write shortcut (third pattern)
        journal_match = INPUT_PATTERNS[2].search(lower)
        if journal_match:
            content = journal_match.group(1).strip()
            return VoiceGuideResult(
                action=VoiceGuideAction.INPUT_TO_TOOL,
                target_tool=EcosystemTool.SACRED_REFLECTIONS,
                route=TOOL_ROUTES[EcosystemTool.SACRED_REFLECTIONS],
                response="Adding to your Sacred Reflections journal",
                input_payload={"content": content, "source": "voice_guide"},
                confidence=0.85,
            )

        # 4. Verse lookup
        for pattern in VERSE_PATTERNS:
            match = pattern.search(lower)
            if match:
                chapter = match.group(1)
                verse = match.group(2)
                return VoiceGuideResult(
                    action=VoiceGuideAction.VERSE_LOOKUP,
                    target_tool=EcosystemTool.GITA_LIBRARY,
                    route=f"/kiaan-vibe/gita/{chapter}",
                    response=f"Looking up Chapter {chapter}, Verse {verse} of the Bhagavad Gita",
                    confidence=0.95,
                    context={"chapter": chapter, "verse": verse},
                )

        # 5. Mood check
        for pattern in MOOD_CHECK_PATTERNS:
            match = pattern.search(lower)
            if match:
                feeling = match.group(1) if match.lastindex and match.lastindex >= 1 else None
                return VoiceGuideResult(
                    action=VoiceGuideAction.MOOD_CHECK,
                    response=self._get_mood_check_response(feeling, user_mood),
                    confidence=0.85,
                    context={"detected_feeling": feeling, "current_mood": user_mood},
                )

        # 6. Daily wisdom request
        for pattern in WISDOM_PATTERNS:
            match = pattern.search(lower)
            if match:
                topic = match.group(1) if match.lastindex and match.lastindex >= 1 else None
                return VoiceGuideResult(
                    action=VoiceGuideAction.DAILY_WISDOM,
                    response="Let me find some wisdom for you...",
                    confidence=0.85,
                    context={"topic": topic, "mood": user_mood},
                )

        # 7. Detect emotion in free-form speech and suggest tool
        detected_mood = self._detect_emotion(lower)
        if detected_mood:
            suggested_tool = self._suggest_tool_for_mood(detected_mood)
            if suggested_tool and current_tool != suggested_tool.value:
                desc = TOOL_DESCRIPTIONS.get(suggested_tool, "")
                return VoiceGuideResult(
                    action=VoiceGuideAction.QUERY,
                    target_tool=suggested_tool,
                    route=TOOL_ROUTES.get(suggested_tool),
                    response="",  # Let Friend/Guidance engine generate the response
                    confidence=0.6,
                    engine_mode=KiaanEngineMode.FRIEND,
                    follow_up=f"Would you like me to take you to {desc.split(' - ')[0]}? It might help.",
                    context={"detected_mood": detected_mood, "suggested_tool": suggested_tool.value},
                )

        # 8. Default: general query for Friend/Guidance engine
        return VoiceGuideResult(
            action=VoiceGuideAction.QUERY,
            response="",
            confidence=0.5,
            engine_mode=KiaanEngineMode.FRIEND,
            context={"raw_transcript": text},
        )

    def detect_engine_mode(
        self,
        transcript: str,
        conversation_history: Optional[List[Dict]] = None,
    ) -> KiaanEngineMode:
        """
        Detect which engine should handle this interaction.

        Priority:
        1. Voice Guide: navigation, control, tool input commands
        2. Guidance: explicit wisdom/Gita requests, crisis situations
        3. Friend: casual chat, venting, sharing, general conversation
        """
        lower = transcript.lower().strip()

        # Voice Guide triggers
        for pattern in NAVIGATION_PATTERNS:
            if pattern.search(lower):
                return KiaanEngineMode.VOICE_GUIDE
        for pattern, _ in CONTROL_PATTERNS:
            if pattern.search(lower):
                return KiaanEngineMode.VOICE_GUIDE
        for pattern in INPUT_PATTERNS:
            if pattern.search(lower):
                return KiaanEngineMode.VOICE_GUIDE
        for pattern in VERSE_PATTERNS:
            if pattern.search(lower):
                return KiaanEngineMode.VOICE_GUIDE

        # Guidance triggers
        guidance_keywords = [
            "gita", "verse", "chapter", "wisdom", "bhagavad",
            "krishna", "arjuna", "dharma", "karma", "yoga",
            "guide me", "what should i do", "help me understand",
            "meaning of life", "spiritual", "sacred",
        ]
        for keyword in guidance_keywords:
            if keyword in lower:
                return KiaanEngineMode.GUIDANCE

        # Default to friend mode
        return KiaanEngineMode.FRIEND

    async def process_unified(
        self,
        transcript: str,
        current_tool: Optional[str] = None,
        user_mood: Optional[str] = None,
        conversation_history: Optional[List[Dict]] = None,
        user_name: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> UnifiedEngineResult:
        """
        Process a voice input through the unified engine pipeline.

        This is the main entry point. It:
        1. Detects which engine should handle the input
        2. Routes to the Voice Guide for commands, or Friend/Guidance for conversation
        3. Returns a unified result with response, mood, and any actions

        Args:
            transcript: Raw voice transcript
            current_tool: Which tool the user is currently using
            user_mood: Currently detected mood
            conversation_history: Recent conversation messages
            user_name: User's preferred name
            session_id: Current session identifier

        Returns:
            UnifiedEngineResult combining all three engines' capabilities
        """
        # Step 1: Voice Guide classifies the command
        voice_result = self.classify_voice_command(transcript, current_tool, user_mood)

        # Step 2: If Voice Guide handles it directly (navigation, control, input)
        if voice_result.action in (
            VoiceGuideAction.NAVIGATE,
            VoiceGuideAction.INPUT_TO_TOOL,
            VoiceGuideAction.CONTROL,
            VoiceGuideAction.VERSE_LOOKUP,
        ):
            return UnifiedEngineResult(
                engine=KiaanEngineMode.VOICE_GUIDE,
                response=voice_result.response,
                mood=user_mood,
                voice_guide_result=voice_result,
                follow_up=voice_result.follow_up,
                should_speak=voice_result.should_speak,
            )

        # Step 3: For mood checks and wisdom, use the friendship engine
        if voice_result.action == VoiceGuideAction.MOOD_CHECK:
            return UnifiedEngineResult(
                engine=KiaanEngineMode.VOICE_GUIDE,
                response=voice_result.response,
                mood=voice_result.context.get("detected_feeling") or user_mood,
                voice_guide_result=voice_result,
                follow_up="Would you like to talk about how you're feeling, or should I suggest something?",
            )

        if voice_result.action == VoiceGuideAction.DAILY_WISDOM:
            wisdom_response = await self._get_daily_wisdom(
                voice_result.context.get("topic"),
                voice_result.context.get("mood"),
            )
            return UnifiedEngineResult(
                engine=KiaanEngineMode.GUIDANCE,
                response=wisdom_response,
                mood=user_mood,
                voice_guide_result=voice_result,
                guidance_data={"type": "daily_wisdom", "topic": voice_result.context.get("topic")},
            )

        # Step 4: Route to Friend or Guidance engine for conversation
        engine_mode = self.detect_engine_mode(transcript, conversation_history)

        if engine_mode == KiaanEngineMode.GUIDANCE:
            return await self._process_guidance(
                transcript, user_mood, conversation_history, user_name,
            )

        # Default: Friend engine
        return await self._process_friend(
            transcript, user_mood, conversation_history, user_name, voice_result,
        )

    # ─── Internal Processing Methods ──────────────────────────────────

    async def _process_guidance(
        self,
        transcript: str,
        user_mood: Optional[str],
        history: Optional[List[Dict]],
        user_name: Optional[str],
    ) -> UnifiedEngineResult:
        """Process through the Guidance engine (Gita wisdom)."""
        engine = self._get_friendship_engine()
        if engine:
            try:
                detection = engine.detect_mode(transcript, history)
                response_text = engine.get_mood_response(detection.mood)

                # Enrich with chapter guide if available
                guidance_data = {}
                if detection.suggested_chapter:
                    chapter_guide = engine.get_chapter_guide(detection.suggested_chapter)
                    if chapter_guide:
                        guidance_data = chapter_guide
                        daily_practice = chapter_guide.get("daily_practice", "")
                        response_text = (
                            f"{response_text}\n\n"
                            f"This reminds me of {chapter_guide.get('modern_title', '')} - "
                            f"{chapter_guide.get('modern_lesson', '')}\n\n"
                            f"Try this today: {daily_practice or 'Take a moment to breathe and be present.'}"
                        )

                return UnifiedEngineResult(
                    engine=KiaanEngineMode.GUIDANCE,
                    response=response_text,
                    mood=detection.mood.value if hasattr(detection.mood, 'value') else str(detection.mood),
                    mood_intensity=detection.mood_intensity,
                    guidance_data=guidance_data,
                    follow_up="Want to explore this wisdom deeper, or does that give you enough to sit with?",
                )
            except Exception as e:
                logger.warning("Guidance engine error: %s", e)

        return UnifiedEngineResult(
            engine=KiaanEngineMode.GUIDANCE,
            response="Let me share some wisdom with you. Every challenge is an opportunity for growth. The Gita teaches us that we have the right to our actions, but not to the fruits of those actions. Stay present, stay focused.",
            mood=user_mood,
        )

    async def _process_friend(
        self,
        transcript: str,
        user_mood: Optional[str],
        history: Optional[List[Dict]],
        user_name: Optional[str],
        voice_result: VoiceGuideResult,
    ) -> UnifiedEngineResult:
        """Process through the Friend engine (best friend conversation)."""
        engine = self._get_friendship_engine()
        if engine:
            try:
                detection = engine.detect_mode(transcript, history)
                response_text = engine.get_mood_response(detection.mood)

                return UnifiedEngineResult(
                    engine=KiaanEngineMode.FRIEND,
                    response=response_text,
                    mood=detection.mood.value if hasattr(detection.mood, 'value') else str(detection.mood),
                    mood_intensity=detection.mood_intensity,
                    voice_guide_result=voice_result if voice_result.confidence > 0.5 else None,
                    friend_data={
                        "conversation_type": detection.conversation_type.value
                        if hasattr(detection.conversation_type, 'value')
                        else str(detection.conversation_type),
                    },
                    follow_up=voice_result.follow_up,
                )
            except Exception as e:
                logger.warning("Friend engine error: %s", e)

        return UnifiedEngineResult(
            engine=KiaanEngineMode.FRIEND,
            response="I'm here for you, friend. Tell me what's on your mind, and we'll figure it out together.",
            mood=user_mood,
        )

    async def _get_daily_wisdom(
        self,
        topic: Optional[str],
        mood: Optional[str],
    ) -> str:
        """Fetch daily wisdom from the guidance engine."""
        engine = self._get_friendship_engine()
        if engine:
            try:
                from datetime import datetime
                day = datetime.now().timetuple().tm_yday
                wisdom = engine.get_daily_wisdom(day, mood)
                if wisdom:
                    chapter = wisdom.get("chapter", "")
                    title = wisdom.get("modern_title", "")
                    lesson = wisdom.get("modern_lesson", "")
                    practice = wisdom.get("daily_practice", "")
                    return (
                        f"Here's today's wisdom: {title}\n\n"
                        f"{lesson}\n\n"
                        f"Today's practice: {practice}"
                    )
            except Exception as e:
                logger.warning("Daily wisdom fetch error: %s", e)

        return (
            "Today's wisdom: Focus on what you can control. "
            "The Gita reminds us that peace comes not from controlling outcomes, "
            "but from mastering our response to them. "
            "Practice: Take three deep breaths before reacting to anything stressful today."
        )

    # ─── Helper Methods ───────────────────────────────────────────────

    def _resolve_tool(self, spoken_name: str) -> Optional[EcosystemTool]:
        """Resolve a spoken tool name to an EcosystemTool enum."""
        normalized = spoken_name.lower().strip()

        # Direct enum value match
        for tool in EcosystemTool:
            if normalized == tool.value.replace("-", " "):
                return tool

        # Alias match
        for alias, tool in TOOL_ALIASES.items():
            if alias in normalized or normalized in alias:
                return tool

        return None

    def _detect_emotion(self, text: str) -> Optional[str]:
        """Detect emotion from text using keyword matching."""
        best_match = None
        best_count = 0

        for emotion, keywords in EMOTION_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in text)
            if count > best_count:
                best_match = emotion
                best_count = count

        return best_match

    def _suggest_tool_for_mood(self, mood: str) -> Optional[EcosystemTool]:
        """Suggest the best tool based on detected mood."""
        mood_tool_map: Dict[str, EcosystemTool] = {
            "anxiety": EcosystemTool.EMOTIONAL_RESET,
            "sadness": EcosystemTool.COMPANION,
            "anger": EcosystemTool.EMOTIONAL_RESET,
            "guilt": EcosystemTool.KARMA_RESET,
            "confusion": EcosystemTool.ARDHA,
            "loneliness": EcosystemTool.COMPANION,
            "overwhelm": EcosystemTool.EMOTIONAL_RESET,
            "hope": EcosystemTool.SADHANA,
            "peace": EcosystemTool.KIAAN_VIBE,
            "excitement": EcosystemTool.SACRED_REFLECTIONS,
        }
        return mood_tool_map.get(mood)

    def _get_control_response(self, command: str) -> str:
        """Get a friendly response for a control command."""
        responses = {
            "stop": "Of course. I'll be quiet now. Just say my name when you need me.",
            "pause": "I'll pause right here. Take your time.",
            "resume": "I'm right here. Let's continue where we left off.",
            "volume_up": "I'll speak a bit louder for you.",
            "volume_down": "I'll speak more softly.",
            "repeat": "Let me say that again for you.",
        }
        return responses.get(command, "Got it.")

    def _get_mood_check_response(
        self,
        feeling: Optional[str],
        current_mood: Optional[str],
    ) -> str:
        """Generate a mood check response."""
        if feeling:
            return (
                f"I sense you're feeling {feeling}. That's completely valid. "
                f"Would you like to talk about it, or should I suggest something that might help?"
            )
        if current_mood and current_mood != "neutral":
            return (
                f"Based on our conversation, it seems like you might be feeling {current_mood}. "
                f"Am I reading that right?"
            )
        return (
            "How are you feeling right now? You can just say a word - "
            "happy, anxious, sad, confused, peaceful - and I'll be right here."
        )

    def get_available_tools(self) -> List[Dict[str, str]]:
        """Return list of all available ecosystem tools for voice commands."""
        return [
            {
                "id": tool.value,
                "name": TOOL_DESCRIPTIONS.get(tool, tool.value).split(" - ")[0],
                "description": TOOL_DESCRIPTIONS.get(tool, ""),
                "route": TOOL_ROUTES.get(tool, "/companion"),
            }
            for tool in EcosystemTool
        ]

    def get_engine_status(self) -> Dict[str, Any]:
        """Return health status of all three engines."""
        return {
            "unified_engine": "active",
            "engines": {
                "guidance": {
                    "status": "active" if self._get_friendship_engine() else "unavailable",
                    "description": "Bhagavad Gita wisdom + behavioral science",
                },
                "friend": {
                    "status": "active" if self._get_companion_engine() or self._get_friendship_engine() else "unavailable",
                    "description": "Best friend personality + cross-session memory",
                },
                "voice_guide": {
                    "status": "active",
                    "description": "Always-awake voice navigation + ecosystem input + tool routing",
                },
            },
            "total_tools": len(EcosystemTool),
            "always_awake": True,
        }


# ─── Singleton ────────────────────────────────────────────────────────────────

_unified_engine: Optional[KiaanUnifiedVoiceEngine] = None


def get_unified_voice_engine() -> KiaanUnifiedVoiceEngine:
    """Get or create the singleton unified voice engine instance."""
    global _unified_engine
    if _unified_engine is None:
        _unified_engine = KiaanUnifiedVoiceEngine()
    return _unified_engine
