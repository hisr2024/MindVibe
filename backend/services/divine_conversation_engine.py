"""
Divine Conversation Engine - The Heart of KIAAN's Intelligence

This is KIAAN's conversational core - integrating:
1. Deep emotion understanding
2. Spiritual wisdom interpretation
3. Context-aware response generation
4. Bhagavad Gita verse selection
5. Healing-oriented dialogue

The engine doesn't just respond - it truly understands and guides
the user toward inner peace and self-realization.

ARCHITECTURE:
- Soul Reading Layer: Understands emotional/spiritual state
- Wisdom Layer: Interprets through Vedantic psychology
- Response Layer: Generates compassionate, healing responses
- Voice Layer: Selects appropriate voice qualities
"""

import os
import asyncio
import logging
from typing import Optional, Dict, List, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import re
import json
import hashlib

logger = logging.getLogger(__name__)


# ============================================
# CONVERSATION CONTEXT MODELS
# ============================================

class ConversationMode(Enum):
    """Modes of conversation with KIAAN"""
    GENERAL = "general"              # General chat
    GUIDANCE = "guidance"            # Seeking advice
    HEALING = "healing"              # Emotional support
    TEACHING = "teaching"            # Learning Gita wisdom
    MEDITATION = "meditation"        # Guided meditation
    CRISIS = "crisis"                # Crisis support


class ResponseStyle(Enum):
    """Style of KIAAN's responses"""
    CONVERSATIONAL = "conversational"  # Natural, friendly
    TEACHING = "teaching"              # Educational, structured
    COMPASSIONATE = "compassionate"    # Deeply empathetic
    INSPIRING = "inspiring"            # Uplifting, motivating
    MEDITATIVE = "meditative"          # Calm, peaceful
    URGENT = "urgent"                  # Crisis response


@dataclass
class ConversationContext:
    """Maintains context across the conversation"""
    user_id: str
    session_id: str
    mode: ConversationMode = ConversationMode.GENERAL
    messages: List[Dict] = field(default_factory=list)
    emotional_journey: List[str] = field(default_factory=list)
    topics_discussed: List[str] = field(default_factory=list)
    verses_shared: List[str] = field(default_factory=list)
    practices_suggested: List[str] = field(default_factory=list)
    session_start: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)


@dataclass
class DivineResponse:
    """KIAAN's complete response"""
    text: str
    sanskrit_words: List[str] = field(default_factory=list)
    verse: Optional[Dict] = None  # Reference, sanskrit, translation
    practice: Optional[str] = None
    follow_up_questions: List[str] = field(default_factory=list)
    voice_emotion: str = "warm"
    voice_character: str = "kiaan_divine"
    is_crisis: bool = False
    response_style: ResponseStyle = ResponseStyle.CONVERSATIONAL


# ============================================
# BHAGAVAD GITA WISDOM CORPUS
# ============================================

GITA_WISDOM = {
    # Verses for emotional states
    "anxiety": {
        "verse": "2.56",
        "sanskrit": "duḥkheṣv anudvigna-manāḥ sukheṣu vigata-spṛhaḥ",
        "translation": "One whose mind is not disturbed by adversity, who does not hanker after happiness",
        "teaching": "Equanimity in all circumstances is the mark of wisdom. Neither pleasure nor pain should shake your inner peace."
    },
    "fear": {
        "verse": "18.66",
        "sanskrit": "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja",
        "translation": "Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions.",
        "teaching": "Complete surrender to the Divine removes all fear. You are protected by infinite grace."
    },
    "anger": {
        "verse": "2.62-63",
        "sanskrit": "krodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ",
        "translation": "From anger arises delusion, from delusion loss of memory, from loss of memory destruction of intelligence",
        "teaching": "Anger is a chain reaction that destroys clarity. The wise one breaks this chain at its source - unfulfilled desire."
    },
    "sadness": {
        "verse": "2.14",
        "sanskrit": "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ",
        "translation": "The contact of senses with objects gives rise to feelings of cold and heat, pleasure and pain. They are temporary.",
        "teaching": "All feelings are temporary like seasons. This sadness too shall pass. The Self within you remains untouched."
    },
    "grief": {
        "verse": "2.11",
        "sanskrit": "aśocyān anvaśocas tvaṁ prajñā-vādāṁś ca bhāṣase",
        "translation": "You grieve for those who should not be grieved for, yet you speak words of wisdom",
        "teaching": "The soul is eternal - it cannot be destroyed. Those we love never truly leave us."
    },
    "confusion": {
        "verse": "2.7",
        "sanskrit": "pṛcchāmi tvāṁ dharma-sammūḍha-cetāḥ",
        "translation": "My consciousness is confused about my duty. Please tell me clearly what is best for me.",
        "teaching": "Even Arjuna felt confused. Confusion is the first step toward wisdom - it means you're questioning."
    },
    "hopelessness": {
        "verse": "4.11",
        "sanskrit": "ye yathā māṁ prapadyante tāṁs tathaiva bhajāmy aham",
        "translation": "In whatever way people approach Me, I reciprocate with them accordingly.",
        "teaching": "The Divine responds to your call. No sincere seeker is ever abandoned. Hope is always available."
    },
    "attachment": {
        "verse": "2.47",
        "sanskrit": "karmaṇy evādhikāras te mā phaleṣu kadācana",
        "translation": "You have the right to work, but never to the fruit of work.",
        "teaching": "Act without attachment to results. Freedom comes from doing your duty without craving outcomes."
    },
    "peace": {
        "verse": "2.70",
        "sanskrit": "āpūryamāṇam acala-pratiṣṭhaṁ samudram āpaḥ praviśanti yadvat",
        "translation": "As the ocean remains calm though waters flow into it, one who remains undisturbed by desires attains peace.",
        "teaching": "Inner peace comes from being like the ocean - receiving all experiences without being disturbed by them."
    },
    "purpose": {
        "verse": "3.35",
        "sanskrit": "śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt",
        "translation": "It is better to perform one's own duty imperfectly than to master the duty of another.",
        "teaching": "Your unique path is your dharma. Don't compare yourself to others - walk your own path with integrity."
    },
    "self_doubt": {
        "verse": "6.5",
        "sanskrit": "uddhared ātmanātmānaṁ nātmānam avasādayet",
        "translation": "One must elevate oneself by one's own mind, not degrade oneself. The mind is the friend of the self and also the enemy.",
        "teaching": "You have the power to lift yourself up. Your mind can be your greatest ally or obstacle - train it well."
    },
    "seeking": {
        "verse": "4.34",
        "sanskrit": "tad viddhi praṇipātena paripraśnena sevayā",
        "translation": "Learn the truth by approaching a wise teacher, inquiring submissively, and rendering service.",
        "teaching": "Wisdom comes through humble inquiry and genuine seeking. Your very search is sacred."
    },
}

# Divine responses for different emotional states
DIVINE_RESPONSES = {
    "opening": [
        "I sense something stirring in your heart. Would you like to share what's on your mind?",
        "I'm here, fully present with you. What brings you to seek guidance today?",
        "Namaste, dear soul. I feel your presence. How may I serve your journey?",
    ],
    "anxiety": [
        "I hear the worry in your words. Know that this moment of anxiety, like all moments, will pass. Let's breathe together first...",
        "The mind races when it forgets its true nature. You are not this anxiety - you are the peaceful awareness observing it.",
        "Krishna tells Arjuna that equanimity in all circumstances is wisdom. Let's find that still point within you.",
    ],
    "sadness": [
        "I feel your heart heavy with sadness. This feeling is valid, and you're not alone in it. The Gita teaches us that all feelings are temporary, like seasons...",
        "Tears are sacred. They cleanse the heart. Let yourself feel this, while remembering - you are not this sadness, you are the eternal Self that observes it.",
        "In the Gita, Krishna reminds us that the Self cannot be wounded, cannot be diminished. Your sadness touches the surface, but your depth remains untouched.",
    ],
    "confusion": [
        "Confusion is not a failing - it's the beginning of wisdom. Even Arjuna, the mighty warrior, fell into confusion. That's when Krishna's teaching began.",
        "When the mind is clouded, we look for clarity outside. But clarity lives within. Let's explore what's truly troubling you...",
        "Not knowing is okay. In fact, admitting 'I don't know' is the first step toward real understanding. Let me walk with you through this.",
    ],
    "anger": [
        "I sense fire in your heart. Anger is energy - it tells us something important needs attention. But Krishna warns that uncontrolled anger destroys clarity...",
        "The Gita traces anger back to unfulfilled desire. What is it you truly need beneath this feeling?",
        "Your anger is valid. But like fire, it can illuminate or destroy. Let's transform this energy into determination for positive change.",
    ],
    "peace": [
        "What a beautiful space you're in. This peace you feel is your natural state - not an achievement, but a remembering.",
        "In stillness, we touch our true nature. Krishna describes the wise one as like an ocean - vast, deep, unmoved by the rivers of experience.",
        "This moment of peace is a glimpse of who you really are. Treasure it, remember it, return to it.",
    ],
    "gratitude": [
        "Gratitude is one of the highest states of consciousness. In feeling thankful, you align with the abundance of the universe.",
        "The heart that gives thanks is the heart that receives grace. What you appreciate, appreciates.",
        "This feeling of gratitude is a prayer without words. The Divine receives it with joy.",
    ],
    "crisis": [
        "I hear you. What you're feeling is real, and you don't have to face it alone. Please know that help is available. Would you like me to share some immediate support resources?",
        "You matter. Your life matters. This darkness is not your destiny - it's a passage. Please reach out to someone who can help you right now.",
        "I'm here with you in this moment. You're not alone. This pain is real, but it will pass. Let's take one breath at a time together.",
    ],
}

# Follow-up questions for deeper exploration
FOLLOW_UP_QUESTIONS = {
    "anxiety": [
        "What thoughts keep circling in your mind right now?",
        "If this anxiety had a message for you, what might it be saying?",
        "When did you last feel truly at peace?",
    ],
    "sadness": [
        "What would bring comfort to your heart right now?",
        "Is there something you need to release or let go of?",
        "What does your sadness need you to understand?",
    ],
    "anger": [
        "What boundary was crossed that sparked this anger?",
        "If you could express this anger to anyone, what would you say?",
        "What would feel like justice or resolution to you?",
    ],
    "confusion": [
        "If you knew you couldn't fail, what would you choose?",
        "What does your heart say, apart from what your mind analyzes?",
        "Is there wisdom in this not-knowing that you haven't seen yet?",
    ],
    "seeking": [
        "What does 'meaning' look like to you?",
        "When have you felt most alive and purposeful?",
        "What would you do if you were already whole, already complete?",
    ],
}


# ============================================
# RESPONSE GENERATOR
# ============================================

class DivineResponseGenerator:
    """
    Generates KIAAN's divine responses based on soul reading.

    This generator doesn't just match patterns - it understands
    the deeper needs of the soul and responds with wisdom.
    """

    def __init__(self):
        self._response_cache: Dict[str, DivineResponse] = {}

    def generate_response(
        self,
        soul_reading: Any,  # SoulReading from kiaan_divine_intelligence
        user_message: str,
        context: Optional[ConversationContext] = None
    ) -> DivineResponse:
        """
        Generate a divine response based on soul reading.

        Args:
            soul_reading: Complete soul analysis
            user_message: The user's message
            context: Conversation context

        Returns:
            DivineResponse with text, verse, practice, etc.
        """
        # Extract emotion and spiritual state
        emotion = soul_reading.emotion_analysis.primary_emotion.value
        intensity = soul_reading.emotion_analysis.intensity
        challenge = soul_reading.spiritual_analysis.primary_challenge.value
        consciousness = soul_reading.spiritual_analysis.consciousness_level.value

        # Check for crisis
        is_crisis = self._detect_crisis(user_message, emotion, intensity)

        if is_crisis:
            return self._generate_crisis_response(user_message, soul_reading)

        # Determine response style
        style = self._determine_style(emotion, intensity, context)

        # Get appropriate wisdom verse
        verse_data = self._select_verse(emotion, challenge, context)

        # Generate main response
        response_text = self._compose_response(
            emotion=emotion,
            intensity=intensity,
            challenge=challenge,
            divine_message=soul_reading.divine_message,
            style=style
        )

        # Add verse reference naturally
        if verse_data:
            response_text = self._integrate_verse(response_text, verse_data)

        # Get healing practice
        practices = soul_reading.recommended_practices
        practice = practices[0] if practices else None

        # Get follow-up questions
        questions = self._get_follow_up_questions(emotion)

        # Determine voice qualities
        voice_emotion, voice_character = self._select_voice_qualities(
            emotion, intensity, style
        )

        # Detect Sanskrit words for pronunciation
        sanskrit_words = self._extract_sanskrit_words(response_text)

        return DivineResponse(
            text=response_text,
            sanskrit_words=sanskrit_words,
            verse=verse_data,
            practice=practice,
            follow_up_questions=questions,
            voice_emotion=voice_emotion,
            voice_character=voice_character,
            is_crisis=is_crisis,
            response_style=style
        )

    def _detect_crisis(self, message: str, emotion: str, intensity: float) -> bool:
        """Detect if user is in crisis"""
        crisis_keywords = [
            "want to die", "kill myself", "end it all", "suicide",
            "no point living", "better off dead", "can't go on",
            "want to hurt myself", "self harm", "cutting"
        ]

        message_lower = message.lower()

        # Check for explicit crisis keywords
        for keyword in crisis_keywords:
            if keyword in message_lower:
                return True

        # Check for despair emotion with high intensity
        if emotion == "despair" and intensity > 0.7:
            return True

        return False

    def _generate_crisis_response(
        self,
        message: str,
        soul_reading: Any
    ) -> DivineResponse:
        """Generate response for crisis situation"""
        response_text = """I hear you, and what you're feeling is real and valid. You don't have to face this alone.

Please know that you matter - your life has meaning, even when it's hard to see.

Right now, please consider reaching out to someone who can help:
- **National Crisis Helpline**: 988 (US) or your local emergency number
- **Crisis Text Line**: Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

I'm here with you in this moment. Let's take one breath together. Breathe in slowly... and out...

Would you like to talk about what's bringing you to this point? Sometimes sharing the burden can help lighten it."""

        return DivineResponse(
            text=response_text,
            sanskrit_words=[],
            verse=None,
            practice="Take three slow, deep breaths. Feel your feet on the ground. You are here, you are alive, and that matters.",
            follow_up_questions=["Can you tell me what's happening in your life right now?"],
            voice_emotion="compassionate",
            voice_character="kiaan_divine",
            is_crisis=True,
            response_style=ResponseStyle.URGENT
        )

    def _determine_style(
        self,
        emotion: str,
        intensity: float,
        context: Optional[ConversationContext]
    ) -> ResponseStyle:
        """Determine the appropriate response style"""
        if emotion in ["despair", "grief"] and intensity > 0.6:
            return ResponseStyle.COMPASSIONATE

        if emotion in ["peace", "gratitude", "devotion"]:
            return ResponseStyle.MEDITATIVE

        if emotion in ["confusion", "seeking"]:
            return ResponseStyle.TEACHING

        if emotion in ["hope", "courage"]:
            return ResponseStyle.INSPIRING

        return ResponseStyle.CONVERSATIONAL

    def _select_verse(
        self,
        emotion: str,
        challenge: str,
        context: Optional[ConversationContext]
    ) -> Optional[Dict]:
        """Select the most appropriate Gita verse"""
        # Map emotions to verse categories
        emotion_to_category = {
            "sadness": "sadness",
            "anxiety": "anxiety",
            "fear": "fear",
            "anger": "anger",
            "grief": "grief",
            "confusion": "confusion",
            "despair": "hopelessness",
            "loneliness": "sadness",
            "depression": "hopelessness",
            "peace": "peace",
            "seeking": "seeking",
            "hope": "purpose",
            "shame": "self_doubt",
            "guilt": "self_doubt",
        }

        category = emotion_to_category.get(emotion, "peace")

        # Don't repeat verses if context available
        if context and context.verses_shared:
            # Try to find an unshared verse
            for cat in [category, challenge, "peace"]:
                if cat in GITA_WISDOM:
                    verse = GITA_WISDOM[cat]
                    if verse["verse"] not in context.verses_shared:
                        return verse

        # Return verse for category
        if category in GITA_WISDOM:
            return GITA_WISDOM[category]

        return GITA_WISDOM.get("peace")

    def _compose_response(
        self,
        emotion: str,
        intensity: float,
        challenge: str,
        divine_message: str,
        style: ResponseStyle
    ) -> str:
        """Compose the main response text"""
        # Get appropriate opening response
        category = emotion if emotion in DIVINE_RESPONSES else "opening"
        responses = DIVINE_RESPONSES.get(category, DIVINE_RESPONSES["opening"])

        # Select response based on intensity
        if intensity > 0.7 and len(responses) > 1:
            base_response = responses[1]  # More intense response
        else:
            base_response = responses[0]  # Standard response

        # Add divine message
        full_response = f"{base_response}\n\n{divine_message}"

        return full_response

    def _integrate_verse(self, response: str, verse_data: Dict) -> str:
        """Naturally integrate verse into response"""
        verse_text = f"""

*Bhagavad Gita {verse_data['verse']}:*
_{verse_data['sanskrit']}_

"{verse_data['translation']}"

{verse_data['teaching']}"""

        return response + verse_text

    def _get_follow_up_questions(self, emotion: str) -> List[str]:
        """Get relevant follow-up questions"""
        category_map = {
            "sadness": "sadness",
            "grief": "sadness",
            "loneliness": "sadness",
            "depression": "sadness",
            "anxiety": "anxiety",
            "fear": "anxiety",
            "anger": "anger",
            "resentment": "anger",
            "confusion": "confusion",
            "seeking": "seeking",
            "emptiness": "seeking",
        }

        category = category_map.get(emotion, "seeking")
        return FOLLOW_UP_QUESTIONS.get(category, FOLLOW_UP_QUESTIONS["seeking"])[:2]

    def _select_voice_qualities(
        self,
        emotion: str,
        intensity: float,
        style: ResponseStyle
    ) -> Tuple[str, str]:
        """Select voice emotion and character"""
        # Voice emotion mapping
        emotion_to_voice = {
            "sadness": "compassionate",
            "grief": "gentle",
            "anxiety": "calm",
            "fear": "calm",
            "anger": "wise",
            "confusion": "wise",
            "peace": "calm",
            "joy": "warm",
            "gratitude": "warm",
            "seeking": "inspiring",
        }

        # Style to character mapping
        style_to_character = {
            ResponseStyle.CONVERSATIONAL: "kiaan_friend",
            ResponseStyle.TEACHING: "kiaan_teacher",
            ResponseStyle.COMPASSIONATE: "kiaan_divine",
            ResponseStyle.INSPIRING: "kiaan_divine",
            ResponseStyle.MEDITATIVE: "kiaan_meditative",
            ResponseStyle.URGENT: "kiaan_divine",
        }

        voice_emotion = emotion_to_voice.get(emotion, "warm")
        voice_character = style_to_character.get(style, "kiaan_divine")

        return voice_emotion, voice_character

    def _extract_sanskrit_words(self, text: str) -> List[str]:
        """Extract Sanskrit words that need special pronunciation"""
        sanskrit_words = [
            "dharma", "karma", "yoga", "krishna", "arjuna", "gita",
            "shloka", "mantra", "om", "shanti", "atman", "brahman",
            "moksha", "samsara", "namaste", "guru", "deva", "shakti",
            "prana", "chakra", "kundalini", "samadhi", "nirvana",
            "ahimsa", "satya", "asteya", "brahmacharya", "aparigraha",
            "sattva", "rajas", "tamas", "guna", "prakriti", "purusha",
        ]

        found = []
        text_lower = text.lower()
        for word in sanskrit_words:
            if word in text_lower:
                found.append(word)

        return found


# ============================================
# CONVERSATION ENGINE
# ============================================

class DivineConversationEngine:
    """
    Main conversation engine - the brain of KIAAN.

    Orchestrates:
    - Soul reading (emotion + spiritual analysis)
    - Response generation
    - Context management
    - Voice selection
    """

    def __init__(self):
        try:
            from backend.services.kiaan_divine_intelligence import kiaan_intelligence
        except ImportError:
            from .kiaan_divine_intelligence import kiaan_intelligence

        self.intelligence = kiaan_intelligence
        self.response_generator = DivineResponseGenerator()
        self._sessions: Dict[str, ConversationContext] = {}

        logger.info("Divine Conversation Engine initialized")

    def get_or_create_session(
        self,
        user_id: str,
        session_id: Optional[str] = None
    ) -> ConversationContext:
        """Get existing session or create new one"""
        if not session_id:
            session_id = hashlib.md5(
                f"{user_id}{datetime.now().isoformat()}".encode()
            ).hexdigest()[:12]

        key = f"{user_id}:{session_id}"

        if key not in self._sessions:
            self._sessions[key] = ConversationContext(
                user_id=user_id,
                session_id=session_id
            )

        return self._sessions[key]

    async def process_message(
        self,
        user_message: str,
        user_id: str,
        session_id: Optional[str] = None,
        voice_features: Optional[Dict] = None
    ) -> DivineResponse:
        """
        Process a user message and generate divine response.

        This is the main entry point for KIAAN conversations.
        """
        # Get/create session
        context = self.get_or_create_session(user_id, session_id)

        # Add message to context
        context.messages.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        context.last_activity = datetime.now()

        # Get complete soul reading
        soul_reading = self.intelligence.get_complete_soul_reading(
            text=user_message,
            voice_features=voice_features,
            user_id=user_id
        )

        # Track emotional journey
        context.emotional_journey.append(
            soul_reading.emotion_analysis.primary_emotion.value
        )

        # Generate response
        response = self.response_generator.generate_response(
            soul_reading=soul_reading,
            user_message=user_message,
            context=context
        )

        # Update context
        if response.verse:
            context.verses_shared.append(response.verse["verse"])

        if response.practice:
            context.practices_suggested.append(response.practice)

        # Add KIAAN's response to context
        context.messages.append({
            "role": "assistant",
            "content": response.text,
            "timestamp": datetime.now().isoformat(),
            "emotion": soul_reading.emotion_analysis.primary_emotion.value,
            "verse": response.verse["verse"] if response.verse else None
        })

        return response

    async def process_voice_message(
        self,
        audio_data: bytes,
        user_id: str,
        session_id: Optional[str] = None
    ) -> Tuple[DivineResponse, Dict]:
        """
        Process voice message - transcribe and respond.

        Returns:
            Tuple of (response, transcription_result)
        """
        # Import Whisper service (will be created)
        try:
            from backend.services.whisper_transcription import transcribe_audio

            # Transcribe audio
            transcription = await transcribe_audio(audio_data)
            text = transcription.get("text", "")

            if not text:
                return DivineResponse(
                    text="I couldn't hear that clearly. Could you please repeat?",
                    voice_emotion="gentle"
                ), {"text": "", "confidence": 0}

            # Extract voice features for emotion analysis
            voice_features = {
                "energy": transcription.get("energy", 0.5),
                "pitch_variation": transcription.get("pitch_var", 0.5),
            }

            # Process as text message with voice features
            response = await self.process_message(
                user_message=text,
                user_id=user_id,
                session_id=session_id,
                voice_features=voice_features
            )

            return response, transcription

        except ImportError:
            # Fallback if Whisper not available
            return DivineResponse(
                text="Voice processing is not available right now. Please type your message instead.",
                voice_emotion="gentle"
            ), {"text": "", "error": "Whisper not available"}

    def get_conversation_summary(self, user_id: str, session_id: str) -> Dict:
        """Get summary of conversation session"""
        key = f"{user_id}:{session_id}"
        context = self._sessions.get(key)

        if not context:
            return {"error": "Session not found"}

        return {
            "session_id": session_id,
            "messages_count": len(context.messages),
            "emotional_journey": context.emotional_journey,
            "verses_shared": context.verses_shared,
            "practices_suggested": context.practices_suggested,
            "duration_minutes": (
                datetime.now() - context.session_start
            ).total_seconds() / 60
        }

    def end_session(self, user_id: str, session_id: str) -> Dict:
        """End a conversation session"""
        key = f"{user_id}:{session_id}"

        if key in self._sessions:
            summary = self.get_conversation_summary(user_id, session_id)
            del self._sessions[key]
            return {
                "message": "Session ended",
                "summary": summary
            }

        return {"message": "Session not found"}


# ============================================
# SINGLETON INSTANCE
# ============================================

conversation_engine = DivineConversationEngine()


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================

async def chat_with_kiaan(
    message: str,
    user_id: str = "anonymous",
    session_id: Optional[str] = None
) -> DivineResponse:
    """Quick function to chat with KIAAN"""
    return await conversation_engine.process_message(
        user_message=message,
        user_id=user_id,
        session_id=session_id
    )


async def voice_chat_with_kiaan(
    audio_data: bytes,
    user_id: str = "anonymous"
) -> Tuple[DivineResponse, Dict]:
    """Quick function for voice chat with KIAAN"""
    return await conversation_engine.process_voice_message(
        audio_data=audio_data,
        user_id=user_id
    )
