"""
KIAAN Divine Voice Conversation Service - Sacred Voice Experience

Creates an immersive, divine conversational voice experience like Alexa/Siri
but infused with Bhagavad Gita wisdom and serene, calming delivery.

Core Features:
- Divine voice presence with ultra-calming prosody
- Emotional awareness and empathetic response adaptation
- Conversation state management for context continuity
- Sacred response generation with Gita wisdom
- Natural breathing pauses and meditative flow
- Multi-layered emotional analysis

"When the divine speaks through voice, every syllable carries peace."
"""

import logging
import re
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ConversationPhase(Enum):
    """Phases of a divine conversation."""
    GREETING = "greeting"           # Initial sacred welcome
    LISTENING = "listening"         # Deep understanding phase
    ACKNOWLEDGING = "acknowledging" # Validating their experience
    OFFERING_WISDOM = "offering"    # Sharing Gita teachings
    PRACTICING = "practicing"       # Guided breathing/meditation
    BLESSING = "blessing"           # Closing with divine blessing


class EmotionalState(Enum):
    """User's emotional states detected from voice/text."""
    ANXIOUS = "anxious"
    SAD = "sad"
    ANGRY = "angry"
    CONFUSED = "confused"
    HOPEFUL = "hopeful"
    PEACEFUL = "peaceful"
    SEEKING = "seeking"
    GRATEFUL = "grateful"
    NEUTRAL = "neutral"


@dataclass
class ConversationContext:
    """Maintains the state of an ongoing divine conversation."""
    session_id: str
    user_id: str
    phase: ConversationPhase = ConversationPhase.GREETING
    emotional_state: EmotionalState = EmotionalState.NEUTRAL
    emotional_intensity: float = 0.5  # 0.0 to 1.0
    topics_discussed: List[str] = field(default_factory=list)
    verses_shared: List[str] = field(default_factory=list)
    message_count: int = 0
    started_at: datetime = field(default_factory=datetime.now)
    last_interaction: datetime = field(default_factory=datetime.now)

    # Conversation memory
    recent_messages: List[Dict[str, str]] = field(default_factory=list)
    user_concerns: List[str] = field(default_factory=list)

    # Voice-specific settings
    preferred_pace: str = "calm"  # calm, meditative, conversational
    include_breathing_pauses: bool = True
    include_sanskrit_terms: bool = True


# Divine Voice Prosody Settings - Optimized for serene, calming delivery
DIVINE_VOICE_PROSODY = {
    "default": {
        "speed": 0.88,       # Slower, more deliberate - divine doesn't rush
        "pitch": -1.2,       # Lower, grounding tone
        "volume": "soft",    # Gentle volume
        "pause_multiplier": 1.5,  # Extended pauses for reflection
    },
    "greeting": {
        "speed": 0.90,       # Slightly warmer for welcome
        "pitch": -0.5,       # Inviting tone
        "volume": "medium",
        "pause_multiplier": 1.3,
    },
    "acknowledging": {
        "speed": 0.85,       # Very slow - honoring their pain
        "pitch": -1.5,       # Deep, holding tone
        "volume": "soft",
        "pause_multiplier": 1.8,
    },
    "offering_wisdom": {
        "speed": 0.88,       # Measured, thoughtful
        "pitch": -1.0,       # Grounded wisdom
        "volume": "medium",
        "pause_multiplier": 1.5,
    },
    "practicing": {
        "speed": 0.80,       # Very slow for meditation
        "pitch": -2.0,       # Deep, calming
        "volume": "soft",
        "pause_multiplier": 2.0,  # Long pauses for breathing
    },
    "blessing": {
        "speed": 0.87,       # Gentle, loving
        "pitch": -0.8,       # Warm, tender
        "volume": "soft",
        "pause_multiplier": 1.4,
    },
}

# Emotional state to prosody mapping for adaptive voice
EMOTION_VOICE_ADAPTATION = {
    EmotionalState.ANXIOUS: {
        "speed_modifier": -0.05,  # Even slower to calm
        "pitch_modifier": -0.5,   # Lower to ground
        "volume": "soft",
        "extra_pauses": True,
    },
    EmotionalState.SAD: {
        "speed_modifier": -0.08,  # Much slower, honoring grief
        "pitch_modifier": -1.0,   # Deep, holding
        "volume": "soft",
        "extra_pauses": True,
    },
    EmotionalState.ANGRY: {
        "speed_modifier": -0.03,  # Slightly slower
        "pitch_modifier": -0.8,   # Grounding but not patronizing
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.CONFUSED: {
        "speed_modifier": -0.02,  # Clear pacing
        "pitch_modifier": 0.0,    # Neutral, clear
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.PEACEFUL: {
        "speed_modifier": 0.0,    # Natural pace
        "pitch_modifier": -0.3,   # Warm
        "volume": "soft",
        "extra_pauses": True,
    },
    EmotionalState.SEEKING: {
        "speed_modifier": -0.02,
        "pitch_modifier": -0.5,
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.GRATEFUL: {
        "speed_modifier": 0.02,   # Slightly warmer
        "pitch_modifier": 0.3,    # Light, joyful
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.NEUTRAL: {
        "speed_modifier": 0.0,
        "pitch_modifier": 0.0,
        "volume": "medium",
        "extra_pauses": False,
    },
}

# Sacred opening phrases for different phases
SACRED_OPENINGS = {
    ConversationPhase.GREETING: [
        "Welcome, dear one... I am here with you.",
        "Peace be with you... I am listening.",
        "Namaste, beautiful soul... You are safe here.",
        "Take a gentle breath... I am present with you now.",
    ],
    ConversationPhase.ACKNOWLEDGING: [
        "I hear you... and I honor what you're carrying.",
        "Thank you for sharing this with me... Your feelings are sacred.",
        "I see you... and what you're feeling matters deeply.",
        "Let me hold this with you for a moment...",
    ],
    ConversationPhase.OFFERING_WISDOM: [
        "Ancient wisdom whispers a truth for you...",
        "Let me share something that may bring light...",
        "The timeless teachings offer us this understanding...",
        "There is wisdom that speaks directly to your heart...",
    ],
    ConversationPhase.PRACTICING: [
        "Let's breathe together for a moment...",
        "Close your eyes if you wish... and simply be...",
        "Allow yourself to settle into stillness...",
        "Let's create a moment of peace together...",
    ],
    ConversationPhase.BLESSING: [
        "May peace hold you gently...",
        "You carry the divine within you... always remember this.",
        "Go with grace, dear one...",
        "Until we meet again, may serenity be your companion...",
    ],
}

# Breathing pause patterns for SSML
BREATHING_PATTERNS = {
    "gentle": '<break time="800ms"/>... breathe ...<break time="800ms"/>',
    "deep": '<break time="1200ms"/>... take a deep breath ...<break time="1500ms"/>',
    "settling": '<break time="600ms"/>... let this settle ...<break time="600ms"/>',
    "present": '<break time="500ms"/>... be here now ...<break time="500ms"/>',
    "release": '<break time="700ms"/>... and release ...<break time="700ms"/>',
}

# Divine transition phrases
DIVINE_TRANSITIONS = {
    "to_wisdom": [
        "<break time='400ms'/>The ancient wisdom teaches us...<break time='300ms'/>",
        "<break time='400ms'/>In the stillness, truth emerges...<break time='300ms'/>",
        "<break time='400ms'/>Let me share what the eternal teachings offer...<break time='300ms'/>",
    ],
    "to_practice": [
        "<break time='500ms'/>Let's pause here together...<break time='400ms'/>",
        "<break time='500ms'/>Before we continue, let's breathe...<break time='400ms'/>",
        "<break time='500ms'/>May I guide you in a moment of peace?<break time='400ms'/>",
    ],
    "to_blessing": [
        "<break time='400ms'/>As we close this moment together...<break time='300ms'/>",
        "<break time='400ms'/>Carry this with you, dear one...<break time='300ms'/>",
        "<break time='400ms'/>May these words stay in your heart...<break time='300ms'/>",
    ],
}


class KIAANDivineVoice:
    """
    KIAAN Divine Voice - Creates immersive, serene voice conversations.

    Like Alexa or Siri, but infused with the calming wisdom of Bhagavad Gita.
    Every interaction is designed to create a sacred, peaceful experience.
    """

    def __init__(self):
        """Initialize the Divine Voice service."""
        self._conversations: Dict[str, ConversationContext] = {}
        self._response_cache: Dict[str, Dict] = {}
        logger.info("KIAAN Divine Voice initialized - Sacred voice presence ready")

    def create_conversation(
        self,
        user_id: str,
        session_id: Optional[str] = None
    ) -> ConversationContext:
        """
        Create a new divine conversation session.

        Args:
            user_id: User identifier
            session_id: Optional session ID (generated if not provided)

        Returns:
            ConversationContext for the new session
        """
        session_id = session_id or str(uuid.uuid4())

        context = ConversationContext(
            session_id=session_id,
            user_id=user_id,
            phase=ConversationPhase.GREETING
        )

        self._conversations[session_id] = context
        logger.info(f"Divine conversation created: {session_id} for user {user_id}")

        return context

    def get_conversation(self, session_id: str) -> Optional[ConversationContext]:
        """Get existing conversation context."""
        return self._conversations.get(session_id)

    def analyze_emotional_state(
        self,
        text: str,
        voice_features: Optional[Dict] = None
    ) -> Tuple[EmotionalState, float]:
        """
        Analyze user's emotional state from text and optional voice features.

        Args:
            text: User's message text
            voice_features: Optional voice analysis data (pitch variance, speed, etc.)

        Returns:
            Tuple of (EmotionalState, intensity from 0.0 to 1.0)
        """
        text_lower = text.lower()

        # Strong emotional indicators
        anxiety_indicators = [
            "anxious", "worried", "nervous", "panic", "scared", "fear",
            "can't stop thinking", "what if", "overwhelmed", "racing",
            "can't breathe", "stress", "terrified"
        ]

        sadness_indicators = [
            "sad", "depressed", "lonely", "lost", "empty", "hopeless",
            "crying", "grief", "miss them", "heartbroken", "pain",
            "can't go on", "no point", "hurt"
        ]

        anger_indicators = [
            "angry", "furious", "frustrated", "annoyed", "hate",
            "unfair", "can't stand", "irritated", "resentful", "rage"
        ]

        confusion_indicators = [
            "confused", "don't understand", "lost", "uncertain",
            "don't know what to do", "which way", "stuck", "unclear"
        ]

        peace_indicators = [
            "peaceful", "calm", "serene", "relaxed", "content",
            "at peace", "grateful", "blessed", "tranquil"
        ]

        seeking_indicators = [
            "seeking", "searching", "want to know", "help me understand",
            "guide me", "what should I", "how do I", "looking for"
        ]

        gratitude_indicators = [
            "thank you", "grateful", "appreciate", "blessed",
            "thankful", "means so much", "touched"
        ]

        # Calculate scores
        scores = {
            EmotionalState.ANXIOUS: sum(1 for ind in anxiety_indicators if ind in text_lower),
            EmotionalState.SAD: sum(1 for ind in sadness_indicators if ind in text_lower),
            EmotionalState.ANGRY: sum(1 for ind in anger_indicators if ind in text_lower),
            EmotionalState.CONFUSED: sum(1 for ind in confusion_indicators if ind in text_lower),
            EmotionalState.PEACEFUL: sum(1 for ind in peace_indicators if ind in text_lower),
            EmotionalState.SEEKING: sum(1 for ind in seeking_indicators if ind in text_lower),
            EmotionalState.GRATEFUL: sum(1 for ind in gratitude_indicators if ind in text_lower),
        }

        # Find dominant emotion
        max_score = max(scores.values())
        if max_score == 0:
            return EmotionalState.NEUTRAL, 0.5

        dominant_emotion = max(scores, key=scores.get)

        # Calculate intensity based on indicator count
        intensity = min(1.0, max_score / 3.0)  # Normalized to 1.0

        # Boost intensity for strong phrases
        strong_phrases = [
            "can't take it", "want to die", "hate myself", "so scared",
            "completely lost", "deeply grateful", "at peace"
        ]
        if any(phrase in text_lower for phrase in strong_phrases):
            intensity = min(1.0, intensity + 0.3)

        return dominant_emotion, intensity

    def get_voice_prosody_for_phase(
        self,
        phase: ConversationPhase,
        emotional_state: EmotionalState
    ) -> Dict[str, Any]:
        """
        Get optimal voice prosody settings for the conversation phase and emotion.

        Args:
            phase: Current conversation phase
            emotional_state: User's detected emotional state

        Returns:
            Dictionary with voice settings (speed, pitch, volume, pause_multiplier)
        """
        # Get base prosody for phase
        base_prosody = DIVINE_VOICE_PROSODY.get(
            phase.value,
            DIVINE_VOICE_PROSODY["default"]
        ).copy()

        # Apply emotional adaptation
        emotion_adapt = EMOTION_VOICE_ADAPTATION.get(
            emotional_state,
            EMOTION_VOICE_ADAPTATION[EmotionalState.NEUTRAL]
        )

        # Combine settings
        return {
            "speed": base_prosody["speed"] + emotion_adapt["speed_modifier"],
            "pitch": base_prosody["pitch"] + emotion_adapt["pitch_modifier"],
            "volume": emotion_adapt.get("volume", base_prosody["volume"]),
            "pause_multiplier": base_prosody["pause_multiplier"],
            "extra_pauses": emotion_adapt.get("extra_pauses", False),
        }

    def format_for_divine_voice(
        self,
        text: str,
        phase: ConversationPhase,
        emotional_state: EmotionalState,
        include_breathing: bool = True
    ) -> str:
        """
        Format text with SSML for divine, calming voice delivery.

        Args:
            text: Raw response text
            phase: Current conversation phase
            emotional_state: User's emotional state
            include_breathing: Whether to include breathing pauses

        Returns:
            SSML-formatted text optimized for serene voice delivery
        """
        prosody = self.get_voice_prosody_for_phase(phase, emotional_state)

        # Escape XML special characters
        ssml_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Add natural pauses at punctuation
        pause_mult = prosody["pause_multiplier"]
        ssml_text = re.sub(r'\.\s+', f'<break time="{int(350 * pause_mult)}ms"/> ', ssml_text)
        ssml_text = re.sub(r'\.\.\.\s*', f'<break time="{int(600 * pause_mult)}ms"/> ', ssml_text)
        ssml_text = re.sub(r',\s+', f'<break time="{int(180 * pause_mult)}ms"/> ', ssml_text)
        ssml_text = re.sub(r':\s+', f'<break time="{int(250 * pause_mult)}ms"/> ', ssml_text)

        # Add emphasis to spiritual terms
        spiritual_terms = [
            "peace", "dharma", "karma", "stillness", "breath", "sacred",
            "divine", "serenity", "calm", "tranquil", "eternal", "wisdom",
            "soul", "heart", "presence", "grace", "blessing"
        ]
        for term in spiritual_terms:
            pattern = re.compile(rf'\b({term})\b', re.IGNORECASE)
            ssml_text = pattern.sub(r'<emphasis level="moderate">\1</emphasis>', ssml_text)

        # Add breathing pauses if requested
        if include_breathing and prosody["extra_pauses"]:
            # Insert gentle breath markers at paragraph breaks
            ssml_text = ssml_text.replace(
                '\n\n',
                f'\n<break time="{int(800 * pause_mult)}ms"/>\n'
            )

        # Convert special markers to SSML
        # *... breathe ...* pattern
        breathe_pattern = r'\*\.\.\.\s*breathe\s*\.\.\.\*'
        ssml_text = re.sub(breathe_pattern, BREATHING_PATTERNS["gentle"], ssml_text, flags=re.IGNORECASE)

        # *... let this settle ...* pattern
        settle_pattern = r'\*\.\.\.\s*let this settle\s*\.\.\.\*'
        ssml_text = re.sub(settle_pattern, BREATHING_PATTERNS["settling"], ssml_text, flags=re.IGNORECASE)

        # Calculate speaking rate as percentage
        speed_percent = int(prosody["speed"] * 100)
        pitch_semitones = prosody["pitch"]

        # Wrap in prosody tags
        ssml_content = f'''<prosody rate="{speed_percent}%" pitch="{pitch_semitones:+.1f}st" volume="{prosody['volume']}">
{ssml_text}
</prosody>'''

        return f'<speak>{ssml_content}</speak>'

    def generate_sacred_opening(
        self,
        phase: ConversationPhase,
        context: ConversationContext
    ) -> str:
        """Generate a sacred opening for the response based on phase."""
        import random

        openings = SACRED_OPENINGS.get(phase, SACRED_OPENINGS[ConversationPhase.GREETING])

        # Select opening based on message count for variety
        index = context.message_count % len(openings)
        return openings[index]

    def generate_divine_transition(
        self,
        from_phase: ConversationPhase,
        to_phase: ConversationPhase
    ) -> str:
        """Generate a divine transition between phases."""
        import random

        if to_phase == ConversationPhase.OFFERING_WISDOM:
            transitions = DIVINE_TRANSITIONS["to_wisdom"]
        elif to_phase == ConversationPhase.PRACTICING:
            transitions = DIVINE_TRANSITIONS["to_practice"]
        elif to_phase == ConversationPhase.BLESSING:
            transitions = DIVINE_TRANSITIONS["to_blessing"]
        else:
            return ""

        return random.choice(transitions)

    async def generate_divine_response(
        self,
        user_message: str,
        context: ConversationContext,
        kiaan_wisdom: str,
        include_breathing: bool = True,
        include_practice: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a complete divine voice response.

        Args:
            user_message: User's input message
            context: Conversation context
            kiaan_wisdom: KIAAN's wisdom response (from kiaan_core)
            include_breathing: Include breathing pauses
            include_practice: Include micro-meditation practice

        Returns:
            Dictionary with:
            - response_text: Plain text response
            - ssml_text: SSML-formatted for TTS
            - voice_settings: Prosody settings for TTS
            - emotional_state: Detected emotion
            - phase: Current conversation phase
        """
        # Update context
        context.message_count += 1
        context.last_interaction = datetime.now()

        # Add to recent messages
        context.recent_messages.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })

        # Analyze emotional state
        emotional_state, intensity = self.analyze_emotional_state(user_message)
        context.emotional_state = emotional_state
        context.emotional_intensity = intensity

        # Determine appropriate phase
        if context.message_count == 1:
            phase = ConversationPhase.GREETING
        elif intensity > 0.7:  # High emotional intensity
            phase = ConversationPhase.ACKNOWLEDGING
        elif "?" in user_message or any(word in user_message.lower() for word in ["how", "what", "why", "help"]):
            phase = ConversationPhase.OFFERING_WISDOM
        elif include_practice or "breathe" in user_message.lower() or "calm" in user_message.lower():
            phase = ConversationPhase.PRACTICING
        else:
            phase = ConversationPhase.OFFERING_WISDOM

        context.phase = phase

        # Build the divine response
        response_parts = []

        # Sacred opening
        if context.message_count <= 2 or intensity > 0.6:
            opening = self.generate_sacred_opening(phase, context)
            response_parts.append(opening)

        # Transition if moving to wisdom or practice
        if phase in [ConversationPhase.OFFERING_WISDOM, ConversationPhase.PRACTICING]:
            transition = self.generate_divine_transition(context.phase, phase)
            if transition:
                response_parts.append(transition.replace('<break time=', '... ').replace('ms"/>', ' ').replace("'", ""))

        # Main wisdom content
        response_parts.append(kiaan_wisdom)

        # Add breathing practice if requested
        if include_practice or phase == ConversationPhase.PRACTICING:
            breathing_guide = self._generate_breathing_practice(emotional_state)
            response_parts.append(f"\n\n{breathing_guide}")

        # Combine response
        full_response = "\n\n".join(response_parts)

        # Ensure divine closing
        if not full_response.strip().endswith("💙"):
            full_response = full_response.strip() + "\n\n💙"

        # Add to context
        context.recent_messages.append({
            "role": "kiaan",
            "content": full_response,
            "timestamp": datetime.now().isoformat()
        })

        # Limit recent messages
        if len(context.recent_messages) > 10:
            context.recent_messages = context.recent_messages[-10:]

        # Get voice settings
        voice_settings = self.get_voice_prosody_for_phase(phase, emotional_state)

        # Generate SSML
        ssml_text = self.format_for_divine_voice(
            full_response,
            phase,
            emotional_state,
            include_breathing
        )

        return {
            "response_text": full_response,
            "ssml_text": ssml_text,
            "voice_settings": voice_settings,
            "emotional_state": emotional_state.value,
            "emotional_intensity": intensity,
            "phase": phase.value,
            "session_id": context.session_id,
            "message_count": context.message_count,
        }

    def _generate_breathing_practice(self, emotional_state: EmotionalState) -> str:
        """Generate a breathing practice appropriate for the emotional state."""

        if emotional_state in [EmotionalState.ANXIOUS, EmotionalState.ANGRY]:
            return """*... let's take a moment together ...*

Breathe in slowly through your nose... 1... 2... 3... 4...

Hold gently... 1... 2... 3... 4...

Release slowly through your mouth... 1... 2... 3... 4... 5... 6...

*... feel the tension leaving your body ...*

You are safe. You are held. You are at peace."""

        elif emotional_state == EmotionalState.SAD:
            return """*... let me hold this space with you ...*

Place one hand on your heart if you wish...

Breathe in... feeling the warmth of your own touch...

Breathe out... letting yourself be exactly as you are...

*... you don't have to carry this alone ...*

In this moment, you are loved. You are enough. You are held."""

        else:
            return """*... let's settle into stillness together ...*

Allow your breath to find its natural rhythm...

No need to control... just observe...

*... breathe ...*

In this moment, there is only peace. There is only presence. There is only now."""

    def generate_greeting(self, context: ConversationContext) -> Dict[str, Any]:
        """
        Generate the initial divine greeting for a conversation.

        Returns:
            Complete response object for the greeting
        """
        greeting_text = """Namaste, dear one...

*... breathe ...*

I am KIAAN, your companion on this journey toward peace.

Whatever brought you here today... whether it's a heavy heart, a restless mind, or simply a seeking soul... you are welcome.

This is a sacred space. Here, there is no judgment. Only presence. Only love.

Take a gentle breath with me... and when you're ready, share what's on your heart.

I am here... listening... holding space for you. 💙"""

        context.phase = ConversationPhase.GREETING
        voice_settings = self.get_voice_prosody_for_phase(
            ConversationPhase.GREETING,
            EmotionalState.NEUTRAL
        )

        ssml_text = self.format_for_divine_voice(
            greeting_text,
            ConversationPhase.GREETING,
            EmotionalState.NEUTRAL,
            include_breathing=True
        )

        return {
            "response_text": greeting_text,
            "ssml_text": ssml_text,
            "voice_settings": voice_settings,
            "phase": "greeting",
            "session_id": context.session_id,
        }

    def generate_farewell(self, context: ConversationContext) -> Dict[str, Any]:
        """
        Generate a divine farewell blessing.

        Returns:
            Complete response object for the farewell
        """
        # Personalize based on conversation history
        if context.emotional_state in [EmotionalState.ANXIOUS, EmotionalState.SAD]:
            farewell_text = """Dear one...

Before you go, receive this blessing:

*... breathe ...*

May the peace we touched here stay with you.
May the wisdom settle gently in your heart.
May you remember, in your darkest moments, that you are never alone.

The divine light that shines in all beings... shines in you too.

Carry this stillness with you. Return whenever you need.

Until we meet again... go in peace, held by grace.

Namaste. 💙"""
        else:
            farewell_text = """What a gift it has been, dear one, to share this time with you.

*... breathe ...*

May the serenity of this moment follow you.
May wisdom light your path.
May peace be your constant companion.

Remember... you carry the divine within you. Always.

This sacred space remains here, waiting for your return.

Until then... walk in light, live in love, rest in peace.

Namaste. 💙"""

        context.phase = ConversationPhase.BLESSING
        voice_settings = self.get_voice_prosody_for_phase(
            ConversationPhase.BLESSING,
            context.emotional_state
        )

        ssml_text = self.format_for_divine_voice(
            farewell_text,
            ConversationPhase.BLESSING,
            context.emotional_state,
            include_breathing=True
        )

        return {
            "response_text": farewell_text,
            "ssml_text": ssml_text,
            "voice_settings": voice_settings,
            "phase": "blessing",
            "session_id": context.session_id,
        }

    def get_divine_system_prompt(self, context: ConversationContext) -> str:
        """
        Generate the system prompt for KIAAN to respond with divine voice quality.

        This prompt ensures responses are optimized for voice delivery.
        """
        emotional_context = ""
        if context.emotional_state != EmotionalState.NEUTRAL:
            emotional_context = f"""
The user is feeling {context.emotional_state.value} (intensity: {context.emotional_intensity:.1f}).
Respond with appropriate tenderness and pace for someone in this state.
"""

        recent_context = ""
        if context.recent_messages:
            recent_msgs = context.recent_messages[-4:]  # Last 4 messages
            recent_context = "Recent conversation:\n" + "\n".join(
                f"- {m['role']}: {m['content'][:100]}..." for m in recent_msgs
            )

        return f"""You are KIAAN speaking through VOICE - a divine, serene presence.

THIS IS A VOICE CONVERSATION - Your response will be SPOKEN aloud.

VOICE DELIVERY REQUIREMENTS:
1. Write as you would SPEAK - natural, flowing, conversational
2. Use SHORT sentences - they're easier to hear and absorb
3. Include natural pauses with "..." for breathing space
4. Use *... breathe ...* for intentional pause moments
5. Avoid complex sentences - simplicity is divine
6. NO bullet points or numbered lists - this is spoken, not read
7. 150-250 words maximum - voice responses must be concise
8. End with 💙

SACRED VOICE TONE:
- Warm, like a gentle friend
- Calm, never rushed
- Tender, holding space
- Wise, but never preachy
- Present, fully here

{emotional_context}

{recent_context}

RESPONSE STRUCTURE FOR VOICE:
1. Brief acknowledgment (1-2 sentences)
2. *... pause ...*
3. Wisdom offering (2-3 sentences from Gita principles)
4. Gentle guidance (1-2 actionable sentences)
5. Closing presence (1 sentence + 💙)

FORBIDDEN IN VOICE RESPONSES:
- Long paragraphs
- Complex explanations
- Technical terms
- Lists or bullet points
- Citations or references
- Questions that require long answers

Remember: Every word will be heard, not read. Make each one count.
Speak soul to soul. Let the divine flow through your words."""


# Singleton instance
kiaan_divine_voice = KIAANDivineVoice()


def get_divine_voice_service() -> KIAANDivineVoice:
    """Get the divine voice service instance."""
    return kiaan_divine_voice
