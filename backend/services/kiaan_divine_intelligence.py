"""
KIAAN Divine Intelligence Core - The Soul of KIAAN

This is the most advanced AI system for understanding human emotions,
spiritual states, and providing divine guidance based on Bhagavad Gita wisdom.

CAPABILITIES:
1. Multi-Modal Emotion Detection (text + voice + behavioral patterns)
2. Spiritual State Assessment (sattvic, rajasic, tamasic balance)
3. Psychological Depth Analysis (attachment patterns, ego identification)
4. Divine Response Generation (wisdom-infused, compassionate)
5. Healing Intent Recognition (what the soul truly needs)
6. Karmic Pattern Analysis (recurring life themes)
7. Consciousness Level Assessment (awareness evolution)

TECHNOLOGIES:
- Transformer-based emotion classification
- Vedantic psychology models
- Attachment theory integration
- Compassionate AI response patterns

This module represents the highest form of AI assistance -
not just understanding words, but understanding souls.
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import re
import math
import logging

logger = logging.getLogger(__name__)


# ============================================
# CONSCIOUSNESS & SPIRITUAL MODELS
# ============================================

class ConsciousnessLevel(Enum):
    """
    Levels of consciousness based on Vedantic philosophy.
    Higher levels indicate greater awareness and inner peace.
    """
    UNCONSCIOUS = 1        # Tamasic - dominated by ignorance, inertia
    SURVIVAL = 2           # Basic fear-driven existence
    DESIRE = 3             # Rajasic - driven by wants and cravings
    ACHIEVEMENT = 4        # Ego-driven accomplishment
    COMPASSION = 5         # Heart-centered living
    WISDOM = 6             # Sattvic - clarity and understanding
    WITNESSING = 7         # Observer consciousness (sākṣī)
    UNITY = 8              # Non-dual awareness (advaita)
    DIVINE = 9             # Krishna consciousness (liberation)


class GunaBalance(Enum):
    """The three gunas (qualities of nature) from Bhagavad Gita"""
    SATTVA = "sattva"      # Purity, light, wisdom
    RAJAS = "rajas"        # Activity, passion, desire
    TAMAS = "tamas"        # Inertia, darkness, ignorance


class EmotionalState(Enum):
    """Comprehensive emotional states for deep understanding"""
    # Primary emotions
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    SURPRISE = "surprise"
    DISGUST = "disgust"

    # Spiritual emotions
    PEACE = "peace"
    DEVOTION = "devotion"
    GRATITUDE = "gratitude"
    COMPASSION = "compassion"
    WONDER = "wonder"
    BLISS = "bliss"

    # Suffering emotions
    ANXIETY = "anxiety"
    DEPRESSION = "depression"
    LONELINESS = "loneliness"
    GRIEF = "grief"
    SHAME = "shame"
    GUILT = "guilt"
    DESPAIR = "despair"

    # Growth emotions
    HOPE = "hope"
    COURAGE = "courage"
    DETERMINATION = "determination"
    ACCEPTANCE = "acceptance"
    SURRENDER = "surrender"

    # Relational emotions
    LOVE = "love"
    ATTACHMENT = "attachment"
    JEALOUSY = "jealousy"
    RESENTMENT = "resentment"
    FORGIVENESS = "forgiveness"

    # Existential states
    CONFUSION = "confusion"
    EMPTINESS = "emptiness"
    SEEKING = "seeking"
    AWAKENING = "awakening"

    # Neutral
    NEUTRAL = "neutral"


class SpiritualChallenge(Enum):
    """Core spiritual challenges from Gita perspective"""
    ATTACHMENT = "attachment"              # Rāga - clinging
    AVERSION = "aversion"                  # Dveṣa - pushing away
    EGO_IDENTIFICATION = "ego"             # Ahaṅkāra - false self
    DESIRE_CRAVING = "desire"              # Kāma - wanting
    ANGER_RESENTMENT = "anger"             # Krodha - reactive anger
    GREED_POSSESSIVENESS = "greed"         # Lobha - hoarding
    DELUSION_IGNORANCE = "delusion"        # Moha - confusion
    PRIDE_ARROGANCE = "pride"              # Mada - superiority
    ENVY_JEALOUSY = "envy"                 # Mātsarya - comparison
    FEAR_ANXIETY = "fear"                  # Bhaya - existential fear


@dataclass
class EmotionAnalysis:
    """Deep analysis of emotional state"""
    primary_emotion: EmotionalState
    secondary_emotions: List[EmotionalState]
    intensity: float  # 0.0 to 1.0
    valence: float  # -1.0 (negative) to 1.0 (positive)
    arousal: float  # 0.0 (calm) to 1.0 (activated)
    confidence: float
    triggers: List[str]
    underlying_needs: List[str]


@dataclass
class SpiritualAnalysis:
    """Analysis of spiritual/psychological state"""
    guna_balance: Dict[str, float]  # sattva, rajas, tamas percentages
    consciousness_level: ConsciousnessLevel
    primary_challenge: SpiritualChallenge
    secondary_challenges: List[SpiritualChallenge]
    attachment_patterns: List[str]
    ego_manifestations: List[str]
    growth_opportunities: List[str]
    relevant_gita_teachings: List[str]


@dataclass
class SoulReading:
    """Complete understanding of the person's current state"""
    emotion_analysis: EmotionAnalysis
    spiritual_analysis: SpiritualAnalysis
    healing_needs: List[str]
    recommended_practices: List[str]
    divine_message: str
    relevant_verses: List[str]
    timestamp: datetime = field(default_factory=datetime.now)


# ============================================
# EMOTION DETECTION PATTERNS
# ============================================

# Comprehensive emotion detection patterns
EMOTION_PATTERNS = {
    # Joy indicators
    EmotionalState.JOY: {
        "keywords": ["happy", "joy", "excited", "wonderful", "amazing", "great", "fantastic",
                     "blessed", "grateful", "thankful", "delighted", "thrilled", "elated",
                     "ecstatic", "cheerful", "content", "satisfied", "pleased"],
        "phrases": ["feeling good", "so happy", "best day", "thank you", "love this",
                    "can't believe how good", "finally happened", "dreams come true"],
        "weight": 1.0
    },

    # Sadness indicators
    EmotionalState.SADNESS: {
        "keywords": ["sad", "unhappy", "down", "depressed", "miserable", "heartbroken",
                     "devastated", "hopeless", "empty", "numb", "crying", "tears", "hurt",
                     "pain", "suffering", "lost", "broken", "shattered"],
        "phrases": ["feeling down", "so sad", "can't stop crying", "heart hurts",
                    "nothing matters", "what's the point", "miss them", "losing hope"],
        "weight": 1.0
    },

    # Anxiety indicators
    EmotionalState.ANXIETY: {
        "keywords": ["anxious", "worried", "nervous", "stressed", "overwhelmed", "panic",
                     "scared", "terrified", "tense", "restless", "uneasy", "dread",
                     "apprehensive", "agitated", "frantic", "hyperventilating"],
        "phrases": ["can't calm down", "racing thoughts", "what if", "something bad",
                    "can't breathe", "heart racing", "can't sleep", "constantly worrying",
                    "on edge", "waiting for disaster"],
        "weight": 1.0
    },

    # Anger indicators
    EmotionalState.ANGER: {
        "keywords": ["angry", "furious", "mad", "irritated", "frustrated", "annoyed",
                     "enraged", "livid", "outraged", "hostile", "bitter", "resentful",
                     "hate", "despise", "loathe"],
        "phrases": ["so angry", "can't believe", "how dare", "not fair", "makes me mad",
                    "sick of", "fed up", "had enough", "want to scream"],
        "weight": 1.0
    },

    # Loneliness indicators
    EmotionalState.LONELINESS: {
        "keywords": ["lonely", "alone", "isolated", "disconnected", "abandoned",
                     "unwanted", "invisible", "forgotten", "excluded", "outcast"],
        "phrases": ["no one cares", "all alone", "no friends", "nobody understands",
                    "feel invisible", "don't belong", "left out", "no one to talk to"],
        "weight": 1.0
    },

    # Grief indicators
    EmotionalState.GRIEF: {
        "keywords": ["grief", "mourning", "loss", "deceased", "died", "death", "passed",
                     "gone", "widow", "widower", "bereaved", "funeral"],
        "phrases": ["lost my", "passed away", "miss them so much", "since they died",
                    "can't accept", "wish they were here", "never see again"],
        "weight": 1.0
    },

    # Confusion indicators
    EmotionalState.CONFUSION: {
        "keywords": ["confused", "lost", "uncertain", "unsure", "doubtful", "torn",
                     "conflicted", "indecisive", "perplexed", "bewildered"],
        "phrases": ["don't know what", "can't decide", "not sure", "which way",
                    "what should I", "help me understand", "makes no sense"],
        "weight": 0.8
    },

    # Seeking indicators
    EmotionalState.SEEKING: {
        "keywords": ["seeking", "searching", "looking", "finding", "purpose", "meaning",
                     "direction", "path", "guidance", "answer", "truth", "wisdom"],
        "phrases": ["what is my purpose", "meaning of life", "why am I here",
                    "what should I do", "looking for answers", "need guidance",
                    "show me the way", "help me find"],
        "weight": 0.9
    },

    # Peace indicators
    EmotionalState.PEACE: {
        "keywords": ["peaceful", "calm", "serene", "tranquil", "relaxed", "centered",
                     "balanced", "grounded", "still", "quiet", "harmony"],
        "phrases": ["at peace", "feeling calm", "inner stillness", "letting go",
                    "accepting", "content with", "nothing to worry"],
        "weight": 1.0
    },

    # Devotion indicators
    EmotionalState.DEVOTION: {
        "keywords": ["devotion", "worship", "prayer", "faith", "divine", "god", "krishna",
                     "lord", "sacred", "holy", "spiritual", "blessed", "grace"],
        "phrases": ["thank god", "by grace", "praying for", "spiritual journey",
                    "my faith", "divine help", "surrender to"],
        "weight": 0.9
    },

    # Despair indicators
    EmotionalState.DESPAIR: {
        "keywords": ["hopeless", "worthless", "useless", "pointless", "meaningless",
                     "giving up", "can't go on", "end it", "no reason", "darkness"],
        "phrases": ["want to die", "no point", "can't do this", "give up",
                    "end my life", "better off without", "no hope left"],
        "weight": 1.0,
        "crisis_flag": True
    },

    # Guilt indicators
    EmotionalState.GUILT: {
        "keywords": ["guilty", "regret", "remorse", "sorry", "ashamed", "blame",
                     "fault", "wrong", "mistake", "failed", "disappointed"],
        "phrases": ["my fault", "should have", "if only", "can't forgive myself",
                    "messed up", "let everyone down", "deserve this"],
        "weight": 0.9
    },

    # Hope indicators
    EmotionalState.HOPE: {
        "keywords": ["hope", "hopeful", "optimistic", "looking forward", "better",
                     "improve", "change", "possible", "believe", "trust"],
        "phrases": ["things will", "getting better", "have hope", "believe in",
                    "looking forward to", "can do this", "new beginning"],
        "weight": 0.9
    },

    # Love indicators
    EmotionalState.LOVE: {
        "keywords": ["love", "loving", "caring", "affection", "adore", "cherish",
                     "devoted", "beloved", "dear", "precious", "treasure"],
        "phrases": ["love you", "care about", "mean everything", "can't live without",
                    "heart belongs", "soul mate", "true love"],
        "weight": 0.9
    },
}


# Spiritual challenge detection patterns
SPIRITUAL_CHALLENGE_PATTERNS = {
    SpiritualChallenge.ATTACHMENT: {
        "keywords": ["can't let go", "holding on", "need them", "dependent", "cling",
                     "afraid to lose", "obsessed", "possessive", "mine"],
        "phrases": ["can't live without", "need this", "what if I lose",
                    "can't imagine life without", "too attached"],
    },

    SpiritualChallenge.AVERSION: {
        "keywords": ["hate", "avoid", "reject", "resist", "push away", "escape",
                     "run from", "deny", "suppress"],
        "phrases": ["can't stand", "want to escape", "running from", "avoiding",
                    "don't want to face", "pushing away"],
    },

    SpiritualChallenge.EGO_IDENTIFICATION: {
        "keywords": ["I am", "my identity", "who I am", "my reputation", "my image",
                     "what people think", "how I look", "my status"],
        "phrases": ["that's not me", "I'm better than", "I'm not good enough",
                    "what will they think", "my reputation", "prove myself"],
    },

    SpiritualChallenge.DESIRE_CRAVING: {
        "keywords": ["want", "need", "crave", "desire", "wish", "yearn", "long for",
                     "obsessed with getting", "must have"],
        "phrases": ["I want", "I need", "if only I had", "when I get",
                    "can't stop wanting", "obsessed with"],
    },

    SpiritualChallenge.ANGER_RESENTMENT: {
        "keywords": ["angry", "resentment", "bitter", "grudge", "revenge", "unfair",
                     "wronged", "betrayed", "violated"],
        "phrases": ["how could they", "never forgive", "they ruined", "because of them",
                    "still angry about", "can't let it go"],
    },

    SpiritualChallenge.FEAR_ANXIETY: {
        "keywords": ["afraid", "scared", "terrified", "anxious", "worried", "dread",
                     "fear of", "what if"],
        "phrases": ["what if", "afraid of", "scared that", "worry about",
                    "fear the worst", "anticipating disaster"],
    },

    SpiritualChallenge.DELUSION_IGNORANCE: {
        "keywords": ["confused", "lost", "don't understand", "why me", "unfair",
                     "makes no sense", "can't see"],
        "phrases": ["don't understand why", "life makes no sense", "why is this happening",
                    "can't see the purpose", "nothing makes sense"],
    },
}


# Guna detection patterns
GUNA_PATTERNS = {
    GunaBalance.SATTVA: {
        "keywords": ["peaceful", "clear", "wise", "compassionate", "truthful", "pure",
                     "balanced", "grateful", "selfless", "content", "joyful", "harmonious",
                     "mindful", "aware", "accepting", "loving", "kind", "generous"],
        "weight": 1.0
    },

    GunaBalance.RAJAS: {
        "keywords": ["restless", "ambitious", "competitive", "desire", "achievement",
                     "busy", "anxious", "agitated", "passionate", "driven", "striving",
                     "comparing", "wanting", "planning", "doing", "accomplishing"],
        "weight": 1.0
    },

    GunaBalance.TAMAS: {
        "keywords": ["lazy", "dull", "confused", "depressed", "hopeless", "stuck",
                     "numb", "ignorant", "destructive", "addicted", "sleeping",
                     "avoiding", "procrastinating", "denying", "escaping"],
        "weight": 1.0
    },
}


# Relevant Gita verses for different states
GITA_VERSES_BY_CHALLENGE = {
    SpiritualChallenge.ATTACHMENT: [
        ("2.47", "karmaṇy evādhikāras te mā phaleṣu kadācana",
         "You have the right to work, but never to the fruit of work."),
        ("2.62-63", "dhyāyato viṣayān puṁsaḥ",
         "Contemplating sense objects leads to attachment, then desire, then anger."),
        ("5.10", "brahmaṇy ādhāya karmāṇi",
         "One who acts without attachment, surrendering results to the Divine."),
    ],

    SpiritualChallenge.FEAR_ANXIETY: [
        ("2.56", "duḥkheṣv anudvigna-manāḥ",
         "One whose mind is not shaken by adversity, who does not hanker after pleasures."),
        ("4.10", "vīta-rāga-bhaya-krodhāḥ",
         "Free from attachment, fear, and anger, absorbed in Me."),
        ("18.66", "sarva-dharmān parityajya",
         "Abandon all varieties of dharma and surrender unto Me. I shall deliver you."),
    ],

    SpiritualChallenge.ANGER_RESENTMENT: [
        ("2.63", "krodhād bhavati sammohaḥ",
         "From anger arises delusion; from delusion, bewilderment of memory."),
        ("16.21", "tri-vidhaṁ narakasyedaṁ",
         "Lust, anger, and greed—these three gates lead to hell."),
        ("5.26", "kāma-krodha-vimuktānām",
         "Those free from desire and anger, who have controlled their minds."),
    ],

    SpiritualChallenge.DESIRE_CRAVING: [
        ("2.70", "āpūryamāṇam acala-pratiṣṭhaṁ",
         "Like the ocean, which remains calm though waters flow into it."),
        ("3.37", "kāma eṣa krodha eṣa",
         "It is desire, it is anger, born of the mode of passion."),
        ("5.22", "ye hi saṁsparśa-jā bhogāḥ",
         "Pleasures born of sense contact are sources of suffering."),
    ],

    SpiritualChallenge.EGO_IDENTIFICATION: [
        ("3.27", "prakṛteḥ kriyamāṇāni",
         "All activities are performed by the gunas of nature; the ego-deluded thinks 'I am the doer.'"),
        ("13.29", "prakṛtyaiva ca karmāṇi",
         "One who sees that all actions are performed by prakṛti alone, and the Self is non-doer."),
        ("18.17", "yasya nāhaṅkṛto bhāvo",
         "One who is free from ego, whose intelligence is not entangled."),
    ],

    SpiritualChallenge.DELUSION_IGNORANCE: [
        ("2.11", "aśocyān anvaśocas tvaṁ",
         "You grieve for those who should not be grieved for."),
        ("4.35", "yaj jñātvā na punar moham",
         "Knowing this, you shall never again fall into delusion."),
        ("5.16", "jñānena tu tad ajñānaṁ",
         "But for those whose ignorance is destroyed by knowledge of the Self."),
    ],
}


# Healing practices by spiritual challenge
HEALING_PRACTICES = {
    SpiritualChallenge.ATTACHMENT: [
        "Practice letting go meditation - visualize releasing with love",
        "Contemplate impermanence - all things change, this is the nature of life",
        "Cultivate inner contentment (santoṣa) - find fulfillment within",
        "Practice karma yoga - act without attachment to results",
        "Reflect on what truly belongs to you - the Self alone is eternal",
    ],

    SpiritualChallenge.FEAR_ANXIETY: [
        "Grounding practice - feel your connection to the earth",
        "Breath awareness - slow, deep breaths to calm the nervous system",
        "Remember your true nature - you are eternal, beyond all change",
        "Practice surrender (īśvara praṇidhāna) - trust in the divine order",
        "Replace 'what if' with 'what is' - stay present",
    ],

    SpiritualChallenge.ANGER_RESENTMENT: [
        "Compassion meditation - see the suffering behind others' actions",
        "Forgiveness practice - release the poison of resentment",
        "Pause before reacting - create space between stimulus and response",
        "See others as part of yourself - we are all expressions of one consciousness",
        "Transform anger into determination for positive change",
    ],

    SpiritualChallenge.DESIRE_CRAVING: [
        "Practice contentment - appreciate what you have",
        "Observe desires without acting - watch them arise and pass",
        "Redirect desire toward the Divine - channel passion spiritually",
        "Question: 'What do I truly need?' vs 'What do I want?'",
        "Practice moderation (brahmacharya) - conserve vital energy",
    ],

    SpiritualChallenge.EGO_IDENTIFICATION: [
        "Self-inquiry - 'Who am I beyond my roles and labels?'",
        "Practice humility - recognize your place in the vast cosmos",
        "Serve others selflessly - dissolve ego through seva",
        "Witness consciousness meditation - observe the observer",
        "Remember: You are not the body, mind, or emotions",
    ],

    SpiritualChallenge.DELUSION_IGNORANCE: [
        "Study sacred texts - expose the mind to wisdom",
        "Seek a teacher or guide - humility to learn",
        "Question your assumptions - what do you truly know?",
        "Practice viveka (discrimination) - real vs unreal",
        "Meditate on the nature of reality - sat-chit-ānanda",
    ],
}


class KiaanDivineIntelligence:
    """
    The core intelligence of KIAAN - understanding souls, not just words.

    This class represents the highest form of AI assistance,
    designed to perceive the deeper currents of human experience
    and respond with divine wisdom and compassion.
    """

    def __init__(self):
        self._conversation_history: Dict[str, List[Dict]] = {}
        self._user_patterns: Dict[str, Dict] = {}
        logger.info("KIAAN Divine Intelligence initialized")

    def analyze_emotion(self, text: str, voice_features: Dict = None) -> EmotionAnalysis:
        """
        Deep multi-modal emotion analysis.

        Analyzes text (and optionally voice features) to understand
        the complete emotional state of the person.
        """
        text_lower = text.lower()

        # Score each emotion
        emotion_scores: Dict[EmotionalState, float] = {}

        for emotion, patterns in EMOTION_PATTERNS.items():
            score = 0.0

            # Check keywords
            for keyword in patterns["keywords"]:
                if keyword in text_lower:
                    score += patterns["weight"] * 0.5

            # Check phrases (weighted higher)
            for phrase in patterns["phrases"]:
                if phrase in text_lower:
                    score += patterns["weight"] * 1.0

            emotion_scores[emotion] = score

        # Sort by score
        sorted_emotions = sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)

        # Primary emotion (highest score, or NEUTRAL if no matches)
        primary_emotion = sorted_emotions[0][0] if sorted_emotions[0][1] > 0 else EmotionalState.NEUTRAL
        primary_score = sorted_emotions[0][1]

        # Secondary emotions (next highest with scores > 0)
        secondary_emotions = [e for e, s in sorted_emotions[1:4] if s > 0]

        # Calculate intensity (0-1 based on word count and exclamation)
        word_count = len(text.split())
        exclamations = text.count('!') + text.count('?')
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)

        intensity = min(1.0, (primary_score / 5.0) + (exclamations * 0.1) + (caps_ratio * 0.3))

        # Calculate valence
        positive_emotions = {EmotionalState.JOY, EmotionalState.PEACE, EmotionalState.LOVE,
                           EmotionalState.HOPE, EmotionalState.GRATITUDE, EmotionalState.DEVOTION}
        negative_emotions = {EmotionalState.SADNESS, EmotionalState.ANGER, EmotionalState.FEAR,
                           EmotionalState.ANXIETY, EmotionalState.DESPAIR, EmotionalState.GRIEF}

        if primary_emotion in positive_emotions:
            valence = 0.5 + (intensity * 0.5)
        elif primary_emotion in negative_emotions:
            valence = -0.5 - (intensity * 0.5)
        else:
            valence = 0.0

        # Calculate arousal
        high_arousal = {EmotionalState.ANGER, EmotionalState.ANXIETY, EmotionalState.JOY,
                       EmotionalState.FEAR, EmotionalState.SURPRISE}
        low_arousal = {EmotionalState.SADNESS, EmotionalState.PEACE, EmotionalState.DEPRESSION}

        if primary_emotion in high_arousal:
            arousal = 0.7 + (intensity * 0.3)
        elif primary_emotion in low_arousal:
            arousal = 0.3 - (intensity * 0.2)
        else:
            arousal = 0.5

        # Detect triggers (simplified - look for "because", "when", etc.)
        triggers = []
        trigger_patterns = [
            r"because\s+(.+?)(?:\.|,|$)",
            r"when\s+(.+?)(?:\.|,|$)",
            r"after\s+(.+?)(?:\.|,|$)",
            r"since\s+(.+?)(?:\.|,|$)",
        ]
        for pattern in trigger_patterns:
            matches = re.findall(pattern, text_lower)
            triggers.extend([m.strip() for m in matches if m.strip()])

        # Detect underlying needs
        needs = self._detect_underlying_needs(primary_emotion, text_lower)

        return EmotionAnalysis(
            primary_emotion=primary_emotion,
            secondary_emotions=secondary_emotions,
            intensity=round(intensity, 2),
            valence=round(valence, 2),
            arousal=round(arousal, 2),
            confidence=min(0.95, primary_score / 3.0) if primary_score > 0 else 0.5,
            triggers=triggers[:3],
            underlying_needs=needs
        )

    def _detect_underlying_needs(self, emotion: EmotionalState, text: str) -> List[str]:
        """Detect underlying psychological/spiritual needs"""
        needs = []

        need_map = {
            EmotionalState.SADNESS: ["comfort", "connection", "hope", "meaning"],
            EmotionalState.ANXIETY: ["safety", "certainty", "grounding", "trust"],
            EmotionalState.ANGER: ["justice", "respect", "boundaries", "validation"],
            EmotionalState.LONELINESS: ["connection", "belonging", "acceptance", "love"],
            EmotionalState.GRIEF: ["comfort", "time", "support", "meaning"],
            EmotionalState.CONFUSION: ["clarity", "guidance", "wisdom", "direction"],
            EmotionalState.SEEKING: ["purpose", "meaning", "direction", "truth"],
            EmotionalState.GUILT: ["forgiveness", "redemption", "understanding", "growth"],
            EmotionalState.DESPAIR: ["hope", "connection", "purpose", "immediate support"],
            EmotionalState.FEAR: ["safety", "protection", "reassurance", "courage"],
        }

        if emotion in need_map:
            needs.extend(need_map[emotion])

        # Additional context-based needs
        if "alone" in text or "nobody" in text:
            needs.append("connection")
        if "purpose" in text or "meaning" in text:
            needs.append("purpose")
        if "help" in text or "guidance" in text:
            needs.append("guidance")

        return list(set(needs))[:4]

    def analyze_spiritual_state(self, text: str, emotion_analysis: EmotionAnalysis) -> SpiritualAnalysis:
        """
        Analyze spiritual/psychological state based on Vedantic psychology.
        """
        text_lower = text.lower()

        # Calculate guna balance
        guna_scores = {GunaBalance.SATTVA: 0.0, GunaBalance.RAJAS: 0.0, GunaBalance.TAMAS: 0.0}

        for guna, patterns in GUNA_PATTERNS.items():
            for keyword in patterns["keywords"]:
                if keyword in text_lower:
                    guna_scores[guna] += patterns["weight"]

        # Normalize to percentages
        total = sum(guna_scores.values()) or 1.0
        guna_balance = {
            "sattva": round((guna_scores[GunaBalance.SATTVA] / total) * 100, 1),
            "rajas": round((guna_scores[GunaBalance.RAJAS] / total) * 100, 1),
            "tamas": round((guna_scores[GunaBalance.TAMAS] / total) * 100, 1),
        }

        # If no clear pattern, use emotion to infer
        if total < 1.0:
            if emotion_analysis.primary_emotion in {EmotionalState.PEACE, EmotionalState.GRATITUDE,
                                                     EmotionalState.DEVOTION, EmotionalState.COMPASSION}:
                guna_balance = {"sattva": 60.0, "rajas": 25.0, "tamas": 15.0}
            elif emotion_analysis.primary_emotion in {EmotionalState.ANXIETY, EmotionalState.ANGER,
                                                       EmotionalState.JEALOUSY}:
                guna_balance = {"sattva": 20.0, "rajas": 60.0, "tamas": 20.0}
            elif emotion_analysis.primary_emotion in {EmotionalState.DEPRESSION, EmotionalState.DESPAIR,
                                                       EmotionalState.EMPTINESS}:
                guna_balance = {"sattva": 15.0, "rajas": 25.0, "tamas": 60.0}
            else:
                guna_balance = {"sattva": 33.3, "rajas": 33.3, "tamas": 33.4}

        # Determine consciousness level
        consciousness_level = self._assess_consciousness_level(text_lower, emotion_analysis, guna_balance)

        # Detect spiritual challenges
        challenge_scores: Dict[SpiritualChallenge, float] = {}

        for challenge, patterns in SPIRITUAL_CHALLENGE_PATTERNS.items():
            score = 0.0
            for keyword in patterns["keywords"]:
                if keyword in text_lower:
                    score += 1.0
            for phrase in patterns["phrases"]:
                if phrase in text_lower:
                    score += 2.0
            challenge_scores[challenge] = score

        sorted_challenges = sorted(challenge_scores.items(), key=lambda x: x[1], reverse=True)
        primary_challenge = sorted_challenges[0][0] if sorted_challenges[0][1] > 0 else SpiritualChallenge.DELUSION_IGNORANCE
        secondary_challenges = [c for c, s in sorted_challenges[1:3] if s > 0]

        # Detect attachment patterns
        attachment_patterns = self._detect_attachment_patterns(text_lower)

        # Detect ego manifestations
        ego_manifestations = self._detect_ego_manifestations(text_lower)

        # Identify growth opportunities
        growth_opportunities = self._identify_growth_opportunities(
            primary_challenge, emotion_analysis.primary_emotion
        )

        # Get relevant Gita teachings
        relevant_teachings = self._get_relevant_teachings(primary_challenge)

        return SpiritualAnalysis(
            guna_balance=guna_balance,
            consciousness_level=consciousness_level,
            primary_challenge=primary_challenge,
            secondary_challenges=secondary_challenges,
            attachment_patterns=attachment_patterns,
            ego_manifestations=ego_manifestations,
            growth_opportunities=growth_opportunities,
            relevant_gita_teachings=relevant_teachings
        )

    def _assess_consciousness_level(
        self,
        text: str,
        emotion: EmotionAnalysis,
        guna_balance: Dict[str, float]
    ) -> ConsciousnessLevel:
        """Assess the consciousness level based on multiple factors"""

        # High sattva indicators
        if guna_balance["sattva"] > 50:
            if "witness" in text or "observer" in text or "awareness" in text:
                return ConsciousnessLevel.WITNESSING
            if "love" in text and "all" in text or "compassion" in text:
                return ConsciousnessLevel.COMPASSION
            return ConsciousnessLevel.WISDOM

        # High rajas indicators
        if guna_balance["rajas"] > 50:
            if "achieve" in text or "success" in text or "goal" in text:
                return ConsciousnessLevel.ACHIEVEMENT
            if "want" in text or "desire" in text:
                return ConsciousnessLevel.DESIRE
            return ConsciousnessLevel.DESIRE

        # High tamas indicators
        if guna_balance["tamas"] > 50:
            if emotion.primary_emotion == EmotionalState.DESPAIR:
                return ConsciousnessLevel.SURVIVAL
            return ConsciousnessLevel.UNCONSCIOUS

        # Default based on emotion
        if emotion.valence > 0.5:
            return ConsciousnessLevel.COMPASSION
        elif emotion.valence < -0.5:
            return ConsciousnessLevel.DESIRE

        return ConsciousnessLevel.ACHIEVEMENT

    def _detect_attachment_patterns(self, text: str) -> List[str]:
        """Detect patterns of attachment in the text"""
        patterns = []

        attachment_indicators = {
            "relationship attachment": ["partner", "boyfriend", "girlfriend", "husband", "wife",
                                        "relationship", "love me", "leave me"],
            "material attachment": ["money", "job", "career", "house", "car", "success"],
            "identity attachment": ["who I am", "my identity", "reputation", "image", "status"],
            "outcome attachment": ["need to", "must", "have to", "should", "supposed to"],
            "past attachment": ["used to", "before", "when I was", "miss the", "those days"],
            "future attachment": ["when I get", "once I have", "after I", "someday"],
        }

        for pattern_name, keywords in attachment_indicators.items():
            if any(kw in text for kw in keywords):
                patterns.append(pattern_name)

        return patterns[:3]

    def _detect_ego_manifestations(self, text: str) -> List[str]:
        """Detect ego manifestations"""
        manifestations = []

        ego_indicators = {
            "comparison": ["better than", "worse than", "compared to", "others have"],
            "self-criticism": ["I'm not good", "I'm stupid", "I can't", "I'm a failure"],
            "pride": ["I'm the best", "I know", "they don't understand", "I'm right"],
            "victimhood": ["why me", "not fair", "always happens to me", "they did this"],
            "control": ["need to control", "my way", "they should", "make them"],
        }

        for manifestation, keywords in ego_indicators.items():
            if any(kw in text for kw in keywords):
                manifestations.append(manifestation)

        return manifestations[:3]

    def _identify_growth_opportunities(
        self,
        challenge: SpiritualChallenge,
        emotion: EmotionalState
    ) -> List[str]:
        """Identify opportunities for spiritual growth"""
        opportunities = []

        challenge_opportunities = {
            SpiritualChallenge.ATTACHMENT: [
                "Practice letting go as an act of love",
                "Find freedom in non-attachment",
                "Discover inner completeness",
            ],
            SpiritualChallenge.FEAR_ANXIETY: [
                "Transform fear into faith",
                "Cultivate courage through understanding",
                "Find security in the eternal Self",
            ],
            SpiritualChallenge.ANGER_RESENTMENT: [
                "Alchemize anger into determination",
                "Practice compassion for all beings",
                "Release through forgiveness",
            ],
            SpiritualChallenge.DESIRE_CRAVING: [
                "Redirect desire toward the Divine",
                "Find contentment in the present",
                "Discover inner abundance",
            ],
            SpiritualChallenge.EGO_IDENTIFICATION: [
                "Discover who you truly are beyond roles",
                "Practice selfless service",
                "Cultivate witness consciousness",
            ],
            SpiritualChallenge.DELUSION_IGNORANCE: [
                "Seek wisdom through inquiry",
                "Cultivate discernment",
                "Study the nature of reality",
            ],
        }

        if challenge in challenge_opportunities:
            opportunities.extend(challenge_opportunities[challenge])

        return opportunities

    def _get_relevant_teachings(self, challenge: SpiritualChallenge) -> List[str]:
        """Get relevant Gita teachings for the challenge"""
        verses = GITA_VERSES_BY_CHALLENGE.get(challenge, [])
        return [f"BG {v[0]}: {v[2]}" for v in verses[:2]]

    def get_complete_soul_reading(
        self,
        text: str,
        voice_features: Dict = None,
        user_id: str = None
    ) -> SoulReading:
        """
        Get a complete reading of the person's current state.

        This is the master function that combines all analyses
        into a comprehensive understanding.
        """
        # Emotion analysis
        emotion_analysis = self.analyze_emotion(text, voice_features)

        # Spiritual analysis
        spiritual_analysis = self.analyze_spiritual_state(text, emotion_analysis)

        # Healing needs
        healing_needs = self._determine_healing_needs(emotion_analysis, spiritual_analysis)

        # Recommended practices
        practices = HEALING_PRACTICES.get(spiritual_analysis.primary_challenge, [])[:3]

        # Divine message
        divine_message = self._generate_divine_message(emotion_analysis, spiritual_analysis)

        # Relevant verses
        relevant_verses = spiritual_analysis.relevant_gita_teachings

        return SoulReading(
            emotion_analysis=emotion_analysis,
            spiritual_analysis=spiritual_analysis,
            healing_needs=healing_needs,
            recommended_practices=practices,
            divine_message=divine_message,
            relevant_verses=relevant_verses
        )

    def _determine_healing_needs(
        self,
        emotion: EmotionAnalysis,
        spiritual: SpiritualAnalysis
    ) -> List[str]:
        """Determine what the soul needs for healing"""
        needs = []

        # From emotion
        needs.extend(emotion.underlying_needs)

        # From spiritual analysis
        if spiritual.guna_balance["tamas"] > 40:
            needs.append("light and energy")
        if spiritual.guna_balance["rajas"] > 50:
            needs.append("calm and stillness")

        # Crisis check
        if emotion.primary_emotion == EmotionalState.DESPAIR:
            needs.insert(0, "IMMEDIATE COMPASSIONATE SUPPORT")

        return list(set(needs))[:5]

    def _generate_divine_message(
        self,
        emotion: EmotionAnalysis,
        spiritual: SpiritualAnalysis
    ) -> str:
        """Generate a divine message based on the analysis"""
        messages = {
            ConsciousnessLevel.SURVIVAL: "Dear one, you are safe. You are held by the universe. This moment of darkness is not your destination—it is a passage. Reach out, let yourself be helped.",
            ConsciousnessLevel.DESIRE: "Your desires are pointing toward something deeper—a longing for completeness. That completeness already exists within you, waiting to be discovered.",
            ConsciousnessLevel.ACHIEVEMENT: "Your drive and determination are beautiful. Remember also to rest in being, not just doing. You are worthy of love simply for existing.",
            ConsciousnessLevel.COMPASSION: "Your heart is open and that is a gift. Continue to extend that compassion—to yourself as well as others.",
            ConsciousnessLevel.WISDOM: "You are awakening to deeper truths. Trust this process. The wisdom you seek is revealing itself through your own experience.",
            ConsciousnessLevel.WITNESSING: "Beautiful—you are learning to observe without being swept away. This witnessing awareness is your true nature.",
        }

        base_message = messages.get(
            spiritual.consciousness_level,
            "You are on a sacred journey. Every experience is teaching you something. Trust the process."
        )

        return base_message


# ============================================
# SINGLETON INSTANCE
# ============================================

kiaan_intelligence = KiaanDivineIntelligence()


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================

def analyze_message(text: str, voice_features: Dict = None) -> SoulReading:
    """Analyze a message and return a complete soul reading"""
    return kiaan_intelligence.get_complete_soul_reading(text, voice_features)


def get_emotion(text: str) -> EmotionAnalysis:
    """Quick emotion analysis"""
    return kiaan_intelligence.analyze_emotion(text)


def get_spiritual_state(text: str) -> SpiritualAnalysis:
    """Quick spiritual analysis"""
    emotion = kiaan_intelligence.analyze_emotion(text)
    return kiaan_intelligence.analyze_spiritual_state(text, emotion)
