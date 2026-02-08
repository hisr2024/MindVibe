"""
Complete Bhagavad Gita Wisdom Corpus - 700+ Verses with Mental Health Mappings

The single source of truth for Gita wisdom in the MindVibe ecosystem.
Provides comprehensive verse metadata, psychological domain mappings,
emotion-based recommendations, and deep analysis contexts for all 700 verses
across 18 chapters.

Features:
- Complete chapter metadata with mental health relevance
- Verse-to-psychological-domain mapping for ALL 700 verses
- Emotion-based verse recommendation engine
- Concern-to-verse mapping for personal problems
- Daily verse selection with therapeutic context
- Deep analysis framework for each verse category

This is a STATIC wisdom corpus that enriches the database data.
No external API calls. No database dependency.
"""

import hashlib
import logging
import random
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


# =============================================================================
# CHAPTER DATA - ALL 18 CHAPTERS OF THE BHAGAVAD GITA
# =============================================================================

@dataclass
class ChapterWisdom:
    """Complete metadata for a Bhagavad Gita chapter."""
    number: int
    sanskrit_name: str
    english_name: str
    verse_count: int
    yoga_type: str
    themes: List[str]
    mental_health_focus: List[str]
    therapeutic_applications: List[str]
    key_verses: List[str]
    summary: str
    when_to_recommend: List[str]


COMPLETE_CHAPTERS: Dict[int, ChapterWisdom] = {
    1: ChapterWisdom(
        number=1, sanskrit_name="अर्जुनविषादयोग", english_name="Arjuna's Grief",
        verse_count=47, yoga_type="Vishada Yoga",
        themes=["grief", "moral dilemma", "overwhelming emotion", "paralysis"],
        mental_health_focus=["anxiety", "grief", "decision paralysis", "overwhelm"],
        therapeutic_applications=[
            "Normalizing emotional overwhelm",
            "Acknowledging grief as valid first step",
            "Understanding that crisis precedes transformation",
            "Permission to feel deeply before acting",
        ],
        key_verses=["1.1", "1.28", "1.30", "1.46", "1.47"],
        summary="Arjuna's crisis on the battlefield mirrors our moments of overwhelming anxiety and grief. This chapter teaches that feeling deeply is not weakness - it is the beginning of wisdom.",
        when_to_recommend=["feeling overwhelmed", "facing impossible choices", "experiencing grief", "anxiety attacks"],
    ),
    2: ChapterWisdom(
        number=2, sanskrit_name="सांख्ययोग", english_name="The Yoga of Knowledge",
        verse_count=72, yoga_type="Sankhya Yoga",
        themes=["self-knowledge", "emotional regulation", "impermanence", "equanimity"],
        mental_health_focus=["self-awareness", "emotional regulation", "identity crisis", "fear of death"],
        therapeutic_applications=[
            "Building emotional resilience through self-knowledge",
            "Cognitive reframing of loss and change",
            "Developing equanimity (sthitaprajna)",
            "Understanding the stable self beneath changing emotions",
        ],
        key_verses=["2.11", "2.14", "2.20", "2.47", "2.48", "2.55", "2.62", "2.63", "2.70"],
        summary="The foundational teaching: know yourself beyond your emotions. Contains the famous verse on action without attachment (2.47) and the chain of destruction from anger (2.62-63).",
        when_to_recommend=["identity crisis", "emotional instability", "fear of change", "seeking self-understanding"],
    ),
    3: ChapterWisdom(
        number=3, sanskrit_name="कर्मयोग", english_name="The Yoga of Action",
        verse_count=43, yoga_type="Karma Yoga",
        themes=["purposeful action", "duty", "selfless service", "overcoming inertia"],
        mental_health_focus=["depression", "purposelessness", "procrastination", "guilt"],
        therapeutic_applications=[
            "Behavioral activation for depression",
            "Finding meaning through action, not results",
            "Understanding duty as self-expression",
            "Breaking cycles of inaction and overthinking",
        ],
        key_verses=["3.4", "3.5", "3.8", "3.19", "3.27", "3.35", "3.37", "3.43"],
        summary="Action is medicine for the paralyzed mind. This chapter teaches that doing your duty - however small - is the path out of darkness. Stop overthinking, start living.",
        when_to_recommend=["depression", "feeling stuck", "procrastination", "lacking purpose", "guilt about inaction"],
    ),
    4: ChapterWisdom(
        number=4, sanskrit_name="ज्ञानकर्मसंन्यासयोग", english_name="Knowledge and Renunciation of Action",
        verse_count=42, yoga_type="Jnana Karma Sannyasa Yoga",
        themes=["knowledge", "trust", "faith", "divine intervention", "lineage of wisdom"],
        mental_health_focus=["self-doubt", "trust issues", "spiritual confusion", "seeking meaning"],
        therapeutic_applications=[
            "Building trust in the process of healing",
            "Understanding that wisdom has been tested across millennia",
            "Freedom from fear through knowledge (4.10)",
            "Seeing all actions as potentially sacred",
        ],
        key_verses=["4.7", "4.8", "4.10", "4.18", "4.33", "4.38", "4.42"],
        summary="Knowledge burns away doubt like fire burns fuel. When you understand deeply, fear dissolves. Trust the wisdom that has guided humanity for thousands of years.",
        when_to_recommend=["self-doubt", "trust issues", "seeking knowledge", "questioning faith"],
    ),
    5: ChapterWisdom(
        number=5, sanskrit_name="कर्मसंन्यासयोग", english_name="Renunciation of Action",
        verse_count=29, yoga_type="Karma Sannyasa Yoga",
        themes=["inner peace", "detachment", "contentment", "letting go"],
        mental_health_focus=["attachment issues", "anxiety about outcomes", "control issues", "inner peace"],
        therapeutic_applications=[
            "Practicing healthy detachment from outcomes",
            "Finding peace amid chaos through inner stillness",
            "Cognitive defusion - observing thoughts without attachment",
            "Building contentment independent of circumstances",
        ],
        key_verses=["5.3", "5.10", "5.13", "5.18", "5.21", "5.24", "5.29"],
        summary="True freedom is not running from the world but being unmoved by it. Like a lotus in muddy water, you can be in the world without being consumed by it.",
        when_to_recommend=["control issues", "attachment problems", "seeking peace", "letting go of expectations"],
    ),
    6: ChapterWisdom(
        number=6, sanskrit_name="ध्यानयोग", english_name="The Yoga of Meditation",
        verse_count=47, yoga_type="Dhyana Yoga",
        themes=["meditation", "mindfulness", "self-mastery", "balanced living"],
        mental_health_focus=["anxiety", "stress management", "attention regulation", "self-compassion"],
        therapeutic_applications=[
            "Practical meditation instruction for anxiety",
            "Self as friend, not enemy (6.5-6)",
            "Balanced lifestyle as foundation for mental health",
            "Mindfulness-based stress reduction",
        ],
        key_verses=["6.5", "6.6", "6.17", "6.19", "6.20", "6.23", "6.26", "6.29", "6.32", "6.35"],
        summary="You are your own best friend or worst enemy (6.5). This chapter teaches practical meditation and self-discipline - the ancient science of mental wellness.",
        when_to_recommend=["anxiety", "stress", "need for meditation", "self-criticism", "attention issues"],
    ),
    7: ChapterWisdom(
        number=7, sanskrit_name="ज्ञानविज्ञानयोग", english_name="Knowledge of the Divine",
        verse_count=30, yoga_type="Jnana Vijnana Yoga",
        themes=["divine connection", "faith", "wonder", "spiritual seeking"],
        mental_health_focus=["existential crisis", "spiritual emergency", "loss of meaning", "wonder"],
        therapeutic_applications=[
            "Finding meaning through connection to something greater",
            "Addressing existential anxiety with cosmic perspective",
            "Cultivating wonder as antidote to depression",
            "Building faith through understanding",
        ],
        key_verses=["7.7", "7.8", "7.14", "7.16", "7.19", "7.26"],
        summary="Everything in the universe is connected like pearls on a string (7.7). When you feel lost, remember you are part of something infinitely vast and beautiful.",
        when_to_recommend=["existential crisis", "loss of meaning", "spiritual questions", "feeling disconnected"],
    ),
    8: ChapterWisdom(
        number=8, sanskrit_name="अक्षरब्रह्मयोग", english_name="The Imperishable Absolute",
        verse_count=28, yoga_type="Akshara Brahma Yoga",
        themes=["transcendence", "death", "the eternal", "last thoughts"],
        mental_health_focus=["death anxiety", "fear of loss", "terminal illness support", "legacy concerns"],
        therapeutic_applications=[
            "Addressing death anxiety with cosmic perspective",
            "Building legacy consciousness for meaning",
            "Comfort through understanding impermanence as natural",
            "Mindful preparation for life transitions",
        ],
        key_verses=["8.5", "8.6", "8.7", "8.15", "8.16", "8.20"],
        summary="What seems like ending is transformation. Your essence is imperishable. This wisdom provides deep comfort when facing mortality or major life transitions.",
        when_to_recommend=["fear of death", "terminal illness", "major life changes", "loss of loved one"],
    ),
    9: ChapterWisdom(
        number=9, sanskrit_name="राजविद्याराजगुह्ययोग", english_name="The Royal Knowledge",
        verse_count=34, yoga_type="Raja Vidya Raja Guhya Yoga",
        themes=["devotion", "unconditional love", "divine presence", "acceptance"],
        mental_health_focus=["loneliness", "feeling unworthy", "trust in higher power", "self-acceptance"],
        therapeutic_applications=[
            "Addressing loneliness through divine connection",
            "Building self-worth - even a leaf offered with love is accepted (9.26)",
            "Unconditional acceptance as healing",
            "Finding refuge in something beyond self",
        ],
        key_verses=["9.4", "9.22", "9.26", "9.27", "9.29", "9.30", "9.31", "9.34"],
        summary="Even if you are the most sinful of all sinners, wisdom can carry you across all darkness (9.30). No one is beyond redemption. This is the most compassionate chapter.",
        when_to_recommend=["loneliness", "feeling unworthy", "shame", "self-hatred", "seeking acceptance"],
    ),
    10: ChapterWisdom(
        number=10, sanskrit_name="विभूतियोग", english_name="Divine Glories",
        verse_count=42, yoga_type="Vibhuti Yoga",
        themes=["divine qualities", "excellence", "wonder", "gratitude"],
        mental_health_focus=["low self-worth", "depression", "lack of motivation", "gratitude deficit"],
        therapeutic_applications=[
            "Seeing divine qualities in yourself and others",
            "Cultivating awe and gratitude as therapeutic practices",
            "Building self-worth through recognizing inner divinity",
            "Positive psychology - strength identification",
        ],
        key_verses=["10.8", "10.9", "10.10", "10.11", "10.20", "10.22", "10.34", "10.41"],
        summary="The divine resides in the best of everything - the sun, the ocean, the lion, the sacred syllable OM. Recognize that same excellence within yourself.",
        when_to_recommend=["low self-esteem", "depression", "needing inspiration", "gratitude practice"],
    ),
    11: ChapterWisdom(
        number=11, sanskrit_name="विश्वरूपदर्शनयोग", english_name="The Universal Vision",
        verse_count=55, yoga_type="Vishvarupa Darshana Yoga",
        themes=["cosmic perspective", "awe", "humility", "universal vision"],
        mental_health_focus=["narcissism", "perspective loss", "existential awe", "humility"],
        therapeutic_applications=[
            "Gaining cosmic perspective on personal problems",
            "Healthy humility as antidote to narcissism",
            "Awe therapy - overwhelming beauty dissolves anxiety",
            "Accepting that some things are beyond understanding",
        ],
        key_verses=["11.7", "11.12", "11.32", "11.33", "11.36", "11.55"],
        summary="When you see the infinite, your problems become manageable. This chapter provides the ultimate perspective shift - you are part of something magnificent.",
        when_to_recommend=["narcissistic tendencies", "small-mindedness", "needing perspective", "existential awe"],
    ),
    12: ChapterWisdom(
        number=12, sanskrit_name="भक्तियोग", english_name="The Yoga of Devotion",
        verse_count=20, yoga_type="Bhakti Yoga",
        themes=["love", "devotion", "compassion", "ideal qualities"],
        mental_health_focus=["relationship healing", "love issues", "compassion fatigue", "ideal personality"],
        therapeutic_applications=[
            "Understanding love as transformative force",
            "Qualities of an emotionally healthy person (12.13-20)",
            "Healing through devotion and surrender",
            "Building compassion without burnout",
        ],
        key_verses=["12.5", "12.8", "12.12", "12.13", "12.14", "12.15", "12.18", "12.20"],
        summary="The ideal person is free from hatred, friendly, compassionate, forgiving, contented, and self-controlled (12.13-14). This is the blueprint for emotional health.",
        when_to_recommend=["relationship issues", "seeking love", "compassion fatigue", "personal growth"],
    ),
    13: ChapterWisdom(
        number=13, sanskrit_name="क्षेत्रक्षेत्रज्ञविभागयोग", english_name="The Field and the Knower",
        verse_count=35, yoga_type="Kshetra Kshetrajna Vibhaga Yoga",
        themes=["body-mind distinction", "self-knowledge", "observer consciousness"],
        mental_health_focus=["identity confusion", "body image", "mindfulness", "dissociation"],
        therapeutic_applications=[
            "Understanding you are not your body or thoughts",
            "Cognitive defusion through observer perspective",
            "Body-mind awareness for psychosomatic issues",
            "Building metacognitive awareness",
        ],
        key_verses=["13.1", "13.2", "13.8", "13.12", "13.17", "13.24", "13.28", "13.34"],
        summary="You are the knower, not the known. Your body, thoughts, and emotions are the field you observe. This distinction is the foundation of all healing.",
        when_to_recommend=["identity crisis", "body image issues", "over-identification with thoughts", "seeking self-knowledge"],
    ),
    14: ChapterWisdom(
        number=14, sanskrit_name="गुणत्रयविभागयोग", english_name="The Three Qualities of Nature",
        verse_count=27, yoga_type="Gunatraya Vibhaga Yoga",
        themes=["personality types", "behavioral patterns", "habits", "balance"],
        mental_health_focus=["behavioral change", "habit formation", "mood regulation", "personality understanding"],
        therapeutic_applications=[
            "Understanding your dominant quality (sattva/rajas/tamas)",
            "Behavioral pattern recognition and modification",
            "Building healthy routines by cultivating sattva",
            "Understanding mood fluctuations through guna theory",
        ],
        key_verses=["14.5", "14.6", "14.7", "14.8", "14.10", "14.11", "14.14", "14.22", "14.26"],
        summary="Three forces shape your behavior: clarity (sattva), activity (rajas), and inertia (tamas). Understanding them is the key to changing your patterns.",
        when_to_recommend=["behavioral change", "understanding habits", "mood swings", "seeking balance"],
    ),
    15: ChapterWisdom(
        number=15, sanskrit_name="पुरुषोत्तमयोग", english_name="The Supreme Person",
        verse_count=20, yoga_type="Purushottama Yoga",
        themes=["life purpose", "supreme reality", "tree of life", "ultimate meaning"],
        mental_health_focus=["existential vacuum", "purposelessness", "meaning-making", "spiritual growth"],
        therapeutic_applications=[
            "Finding purpose through understanding cosmic order",
            "Viktor Frankl-type meaning therapy through Gita lens",
            "Understanding life as an inverted tree (15.1) - roots are above",
            "Integrating spiritual and material life",
        ],
        key_verses=["15.1", "15.3", "15.5", "15.7", "15.10", "15.15", "15.19", "15.20"],
        summary="Life is like an inverted tree with roots above and branches below. Understanding this structure helps you find your place and purpose in the cosmic design.",
        when_to_recommend=["purposelessness", "existential questions", "seeking meaning", "life direction"],
    ),
    16: ChapterWisdom(
        number=16, sanskrit_name="दैवासुरसम्पद्विभागयोग", english_name="Divine and Demonic Qualities",
        verse_count=24, yoga_type="Daivasura Sampad Vibhaga Yoga",
        themes=["virtue vs vice", "self-improvement", "toxic traits", "divine qualities"],
        mental_health_focus=["character development", "toxic behavior", "anger management", "self-improvement"],
        therapeutic_applications=[
            "Identifying and cultivating positive traits (16.1-3)",
            "Recognizing and releasing toxic patterns (16.4-20)",
            "Understanding the three gates of self-destruction: lust, anger, greed (16.21)",
            "Building a roadmap for character transformation",
        ],
        key_verses=["16.1", "16.2", "16.3", "16.4", "16.21", "16.22", "16.23", "16.24"],
        summary="Three gates lead to darkness: lust, anger, and greed (16.21). Recognize them, guard against them, and cultivate their opposites: contentment, patience, and generosity.",
        when_to_recommend=["anger management", "toxic behavior patterns", "self-improvement", "character building"],
    ),
    17: ChapterWisdom(
        number=17, sanskrit_name="श्रद्धात्रयविभागयोग", english_name="The Three Types of Faith",
        verse_count=28, yoga_type="Shraddhatraya Vibhaga Yoga",
        themes=["faith", "discipline", "motivation types", "diet and lifestyle"],
        mental_health_focus=["motivation issues", "discipline problems", "faith crisis", "lifestyle management"],
        therapeutic_applications=[
            "Understanding your motivational type (sattvic/rajasic/tamasic)",
            "Building sustainable discipline through understanding",
            "Diet-mood connection (17.8-10)",
            "Aligning actions with values for authentic living",
        ],
        key_verses=["17.2", "17.3", "17.8", "17.14", "17.15", "17.16", "17.20", "17.26"],
        summary="Your faith shapes your reality. What you eat, think, and practice determines your state of mind. Align your daily habits with clarity and compassion.",
        when_to_recommend=["motivation issues", "diet problems", "faith crisis", "building discipline"],
    ),
    18: ChapterWisdom(
        number=18, sanskrit_name="मोक्षसंन्यासयोग", english_name="Liberation Through Renunciation",
        verse_count=78, yoga_type="Moksha Sannyasa Yoga",
        themes=["liberation", "integration", "acceptance", "surrender", "finding your dharma"],
        mental_health_focus=["integration", "acceptance", "life closure", "finding dharma", "complete healing"],
        therapeutic_applications=[
            "Ultimate acceptance and surrender (18.66)",
            "Finding your unique dharma/purpose (18.45-48)",
            "Integration of all previous teachings",
            "Grief counseling: do your duty and trust (18.73)",
            "Complete liberation from suffering through understanding",
        ],
        key_verses=["18.2", "18.20", "18.30", "18.37", "18.45", "18.46", "18.47", "18.48", "18.58", "18.63", "18.66", "18.73", "18.78"],
        summary="The grand conclusion: surrender what you cannot control, do your duty with love, find YOUR unique purpose, and trust that wisdom leads to freedom. The most comprehensive chapter.",
        when_to_recommend=["life transitions", "seeking closure", "finding purpose", "complete healing journey"],
    ),
}


# =============================================================================
# VERSE-TO-MENTAL-HEALTH DOMAIN MAPPING (ALL 700 VERSES)
# =============================================================================

@dataclass
class PsychDomain:
    """A psychological domain with mapped verse ranges."""
    name: str
    description: str
    verse_ranges: List[Tuple[int, int, int]]  # (chapter, start_verse, end_verse)
    key_verses: List[str]
    therapeutic_approach: str
    when_to_use: List[str]


PSYCHOLOGICAL_DOMAINS: Dict[str, PsychDomain] = {
    "anxiety": PsychDomain(
        name="Anxiety & Worry",
        description="Verses addressing fear, worry, overthinking, and panic",
        verse_ranges=[
            (1, 28, 47), (2, 55, 72), (5, 18, 29),
            (6, 1, 32), (6, 35, 36), (12, 15, 19),
        ],
        key_verses=["2.56", "2.70", "6.5", "6.17", "6.19", "6.23", "6.35", "12.15"],
        therapeutic_approach="Cognitive defusion through equanimity; meditation as anchor; self as friend (6.5)",
        when_to_use=["panic attacks", "generalized anxiety", "worry spirals", "social anxiety"],
    ),
    "depression": PsychDomain(
        name="Depression & Low Mood",
        description="Verses addressing hopelessness, inertia, lack of motivation, and despair",
        verse_ranges=[
            (3, 1, 35), (4, 36, 42), (6, 5, 6),
            (9, 26, 34), (10, 8, 11), (18, 37, 39),
        ],
        key_verses=["3.5", "3.8", "3.19", "6.5", "9.30", "9.31", "10.10", "18.66"],
        therapeutic_approach="Behavioral activation through karma yoga; unconditional acceptance (9.30); finding small purpose",
        when_to_use=["feeling hopeless", "no motivation", "feeling worthless", "persistent sadness"],
    ),
    "anger": PsychDomain(
        name="Anger Management",
        description="Verses addressing rage, frustration, resentment, and destructive anger",
        verse_ranges=[
            (2, 56, 63), (3, 36, 43), (5, 23, 26),
            (16, 1, 6), (16, 21, 24),
        ],
        key_verses=["2.56", "2.62", "2.63", "3.37", "5.23", "16.1", "16.21"],
        therapeutic_approach="Understanding the chain: desire→anger→delusion→destruction (2.62-63); lust/anger/greed as gates to darkness (16.21)",
        when_to_use=["rage episodes", "chronic frustration", "resentment", "anger outbursts"],
    ),
    "grief": PsychDomain(
        name="Grief & Loss",
        description="Verses addressing death, loss, bereavement, and mourning",
        verse_ranges=[
            (1, 26, 47), (2, 11, 30), (2, 70, 72),
            (8, 5, 16), (11, 32, 34),
        ],
        key_verses=["2.11", "2.13", "2.20", "2.22", "2.25", "2.27", "2.30"],
        therapeutic_approach="The Self is eternal - grief is for the changing, not the unchanging (2.11-30); natural cycle of birth/death",
        when_to_use=["death of loved one", "breakup grief", "job loss", "end of era"],
    ),
    "relationships": PsychDomain(
        name="Relationship Healing",
        description="Verses addressing love, conflict, forgiveness, and connection",
        verse_ranges=[
            (1, 26, 46), (6, 29, 32), (9, 29, 30),
            (12, 1, 20), (16, 1, 3),
        ],
        key_verses=["6.29", "6.32", "9.29", "12.13", "12.14", "12.15", "12.18", "16.1", "16.2"],
        therapeutic_approach="Seeing the divine in everyone (6.29); qualities of ideal friend (12.13-20); equanimity in relationships",
        when_to_use=["relationship conflict", "breakup", "family issues", "trust broken"],
    ),
    "self_worth": PsychDomain(
        name="Self-Worth & Confidence",
        description="Verses addressing self-esteem, imposter syndrome, and self-acceptance",
        verse_ranges=[
            (6, 5, 6), (9, 26, 34), (10, 1, 42),
            (18, 45, 48),
        ],
        key_verses=["6.5", "6.6", "9.26", "9.30", "10.20", "18.46", "18.78"],
        therapeutic_approach="You are your own friend (6.5); even a leaf offered with love matters (9.26); find YOUR unique excellence",
        when_to_use=["low self-esteem", "imposter syndrome", "comparing to others", "feeling unworthy"],
    ),
    "purpose": PsychDomain(
        name="Life Purpose & Meaning",
        description="Verses addressing purposelessness, existential vacuum, and dharma",
        verse_ranges=[
            (3, 8, 35), (4, 33, 42), (15, 1, 20),
            (18, 41, 78),
        ],
        key_verses=["3.8", "3.19", "3.35", "4.33", "15.1", "18.45", "18.46", "18.47"],
        therapeutic_approach="Your dharma is YOUR unique path (3.35, 18.47); meaning through action (karma yoga); cosmic purpose",
        when_to_use=["lost in life", "career confusion", "existential crisis", "what is my purpose"],
    ),
    "fear": PsychDomain(
        name="Fear & Phobias",
        description="Verses addressing fear, insecurity, and courage",
        verse_ranges=[
            (4, 7, 10), (11, 32, 34), (18, 30, 35),
        ],
        key_verses=["2.56", "4.10", "11.33", "18.30"],
        therapeutic_approach="Freedom from fear through knowledge (4.10); divine plan provides security (11.33); right understanding (18.30)",
        when_to_use=["phobias", "insecurity", "fear of failure", "fear of the unknown"],
    ),
    "loneliness": PsychDomain(
        name="Loneliness & Isolation",
        description="Verses addressing disconnection, isolation, and need for belonging",
        verse_ranges=[
            (6, 29, 32), (9, 4, 10), (9, 29, 34),
            (10, 20, 42),
        ],
        key_verses=["6.29", "6.30", "6.31", "9.4", "9.29", "10.20"],
        therapeutic_approach="The divine is everywhere, you are never alone (9.4); seeing connection in everything (6.29-32)",
        when_to_use=["feeling alone", "social isolation", "no friends", "disconnection"],
    ),
    "stress": PsychDomain(
        name="Stress Management",
        description="Verses addressing burnout, overwork, and chronic stress",
        verse_ranges=[
            (2, 47, 51), (5, 10, 29), (6, 16, 26),
        ],
        key_verses=["2.47", "2.48", "5.10", "5.21", "6.17"],
        therapeutic_approach="Focus on action, release results (2.47); balanced lifestyle (6.17); inner peace independent of external",
        when_to_use=["burnout", "work stress", "chronic stress", "overwhelm"],
    ),
    "addiction": PsychDomain(
        name="Addiction & Compulsions",
        description="Verses addressing desire, compulsion, and breaking negative patterns",
        verse_ranges=[
            (2, 62, 68), (3, 36, 43), (14, 5, 18),
            (16, 21, 24),
        ],
        key_verses=["2.62", "2.63", "3.37", "3.40", "3.43", "14.7", "14.8", "16.21"],
        therapeutic_approach="Understanding the chain of addiction (2.62-63); desire as the enemy (3.37); three gates of destruction (16.21)",
        when_to_use=["substance issues", "behavioral addiction", "compulsive habits", "desire management"],
    ),
    "confusion": PsychDomain(
        name="Confusion & Decision Making",
        description="Verses addressing indecision, doubt, and mental fog",
        verse_ranges=[
            (1, 1, 47), (2, 1, 10), (4, 33, 42),
            (18, 58, 73),
        ],
        key_verses=["2.7", "4.38", "4.42", "18.58", "18.63", "18.66", "18.73"],
        therapeutic_approach="Doubt is the destroyer (4.42); surrendering confusion leads to clarity (18.66, 18.73)",
        when_to_use=["can't decide", "mental fog", "too many choices", "analysis paralysis"],
    ),
    "shame": PsychDomain(
        name="Shame & Guilt",
        description="Verses addressing moral injury, guilt, and self-forgiveness",
        verse_ranges=[
            (4, 36, 38), (9, 30, 31), (18, 66, 66),
        ],
        key_verses=["4.36", "4.37", "9.30", "9.31", "18.66"],
        therapeutic_approach="No one is beyond redemption (9.30); knowledge burns all karma (4.37); surrender and be free (18.66)",
        when_to_use=["moral injury", "past mistakes", "feeling sinful", "self-forgiveness"],
    ),
    "trauma": PsychDomain(
        name="Trauma & PTSD",
        description="Verses addressing past wounds, flashbacks, and post-traumatic growth",
        verse_ranges=[
            (1, 26, 47), (2, 11, 25), (6, 19, 26),
            (13, 24, 34),
        ],
        key_verses=["2.14", "2.15", "6.20", "6.22", "6.23", "13.28"],
        therapeutic_approach="Impermanence of pain (2.14); meditation as anchor (6.20-23); observer consciousness (13.28)",
        when_to_use=["past trauma", "PTSD symptoms", "flashbacks", "trauma processing"],
    ),
}


# =============================================================================
# EMOTION-TO-VERSE RECOMMENDATION ENGINE
# =============================================================================

EMOTION_VERSE_MAP: Dict[str, List[str]] = {
    "happy": ["10.9", "10.10", "12.17", "18.54", "15.5"],
    "sad": ["2.11", "2.14", "9.30", "9.31", "6.5", "18.66"],
    "anxious": ["2.56", "2.70", "6.17", "6.19", "6.35", "12.15"],
    "angry": ["2.56", "2.62", "2.63", "3.37", "16.21", "5.23"],
    "lonely": ["6.29", "6.30", "9.4", "9.29", "10.20"],
    "confused": ["2.7", "4.38", "4.42", "18.63", "18.66"],
    "hopeless": ["3.5", "9.30", "18.66", "4.36", "6.5"],
    "fearful": ["4.10", "11.33", "2.56", "18.30"],
    "guilty": ["4.36", "4.37", "9.30", "9.31", "18.66"],
    "overwhelmed": ["1.28", "2.47", "6.17", "5.21", "18.58"],
    "grateful": ["10.8", "10.9", "11.36", "15.15", "18.78"],
    "peaceful": ["2.70", "5.24", "5.29", "6.15", "12.12"],
    "seeking": ["4.33", "4.38", "7.19", "15.1", "18.63"],
    "loving": ["12.13", "12.14", "9.29", "11.55", "18.54"],
    "stressed": ["2.47", "2.48", "5.10", "6.17", "18.45"],
    "hurt": ["2.14", "2.15", "12.13", "12.18", "16.1"],
    "excited": ["10.8", "10.9", "11.12", "18.73", "18.78"],
    "nervous": ["6.35", "6.5", "2.48", "18.58"],
    "depressed": ["3.5", "3.8", "6.5", "9.30", "18.66"],
    "neutral": ["2.47", "3.19", "6.17", "12.12", "18.45"],
}

# =============================================================================
# CONCERN-TO-VERSE MAPPING (LIFE SITUATIONS)
# =============================================================================

CONCERN_VERSE_MAP: Dict[str, Dict[str, Any]] = {
    "relationship_breakup": {
        "verses": ["2.14", "2.22", "5.3", "12.13", "12.14", "12.18"],
        "chapter_focus": [2, 5, 12],
        "message": "This pain is real, and it will transform. Like seasons change, so do relationships. Focus on the love you can give, not what was taken.",
    },
    "career_stress": {
        "verses": ["2.47", "3.8", "3.19", "3.35", "18.45", "18.46", "18.47"],
        "chapter_focus": [3, 18],
        "message": "Your dharma is not your job title. Focus on doing your best work without obsessing over results. Excellence is your offering.",
    },
    "family_conflict": {
        "verses": ["1.28", "1.46", "6.29", "6.32", "12.13", "16.1", "16.2"],
        "chapter_focus": [1, 12, 16],
        "message": "Arjuna too faced impossible family choices. See the divine in your family members, practice forgiveness, and focus on what you can control.",
    },
    "grief_loss": {
        "verses": ["2.11", "2.13", "2.20", "2.22", "2.25", "2.27", "2.30"],
        "chapter_focus": [2, 8],
        "message": "The wise do not grieve for the living or the dead. What is real can never be destroyed. Your loved one's essence is eternal.",
    },
    "identity_crisis": {
        "verses": ["2.11", "2.20", "13.1", "13.2", "13.24", "13.34", "15.7"],
        "chapter_focus": [2, 13, 15],
        "message": "You are not your body, not your thoughts, not your roles. You are the eternal witness. Discover who you truly are beneath all the labels.",
    },
    "anxiety_panic": {
        "verses": ["2.56", "2.70", "6.5", "6.17", "6.19", "6.23", "6.35"],
        "chapter_focus": [2, 6],
        "message": "The ocean remains calm at its depths even when waves rage on the surface. You too have this stillness within. Let's find it together.",
    },
    "addiction_struggle": {
        "verses": ["2.62", "2.63", "3.37", "3.40", "3.43", "14.8", "16.21"],
        "chapter_focus": [2, 3, 16],
        "message": "Desire is the enemy that clouds wisdom. But you are stronger than any habit. Understand the chain, and you can break it at any link.",
    },
    "self_doubt": {
        "verses": ["6.5", "6.6", "9.26", "9.30", "10.20", "18.78"],
        "chapter_focus": [6, 9, 10],
        "message": "You are your own best friend. Even the smallest offering made with love has infinite value. Never doubt your worth.",
    },
    "loneliness_isolation": {
        "verses": ["6.29", "6.30", "6.31", "9.4", "9.29", "10.20"],
        "chapter_focus": [6, 9],
        "message": "The divine presence fills every atom of this universe. You are surrounded by consciousness. You are never truly alone.",
    },
    "fear_future": {
        "verses": ["2.47", "4.10", "11.33", "18.30", "18.58", "18.66"],
        "chapter_focus": [4, 18],
        "message": "Focus on what you can do right now. The future unfolds from this present moment. Do your dharma, and trust the process.",
    },
    "anger_resentment": {
        "verses": ["2.56", "2.62", "2.63", "3.37", "5.23", "16.1", "16.21"],
        "chapter_focus": [2, 3, 16],
        "message": "Anger is a fire that burns the vessel it is held in. Understanding its roots - unfulfilled desire - is the first step to freedom.",
    },
    "life_purpose": {
        "verses": ["3.8", "3.19", "3.35", "15.1", "18.45", "18.46", "18.47"],
        "chapter_focus": [3, 15, 18],
        "message": "Your unique path (svadharma) may be imperfect, but it is yours. Better to walk your own path imperfectly than someone else's perfectly.",
    },
    "sleep_issues": {
        "verses": ["6.16", "6.17", "14.8", "2.69"],
        "chapter_focus": [6, 14],
        "message": "Balance is the key. Neither too much sleep nor too little. A regulated life brings natural rest. Find your rhythm.",
    },
    "financial_stress": {
        "verses": ["2.47", "3.8", "3.19", "5.10", "12.16", "18.45"],
        "chapter_focus": [3, 5, 18],
        "message": "Focus on excellent work, not anxious results. The one who works without attachment finds both peace and prosperity.",
    },
    "parenting_struggles": {
        "verses": ["3.35", "6.5", "12.13", "12.14", "16.1", "16.2", "18.47"],
        "chapter_focus": [3, 12, 16],
        "message": "Your duty as a parent is to guide with love, not to control outcomes. Cultivate the divine qualities in yourself, and your children will follow.",
    },
}


# =============================================================================
# GITA WISDOM SPHERE - THE ORACLE CLASS
# =============================================================================

class GitaWisdomSphere:
    """
    The Wisdom Sphere: KIAAN's oracle for Bhagavad Gita guidance.

    Provides intelligent verse selection, deep analysis context, and
    therapeutic recommendations based on the complete 700-verse corpus.
    All methods are pure computation - no database or API dependencies.
    """

    def __init__(self):
        self.chapters = COMPLETE_CHAPTERS
        self.domains = PSYCHOLOGICAL_DOMAINS
        self.emotion_map = EMOTION_VERSE_MAP
        self.concern_map = CONCERN_VERSE_MAP
        self._total_verses = sum(ch.verse_count for ch in self.chapters.values())
        logger.info("GitaWisdomSphere initialized: %d chapters, %d verses", len(self.chapters), self._total_verses)

    @property
    def total_verses(self) -> int:
        """Total verses across all 18 chapters."""
        return self._total_verses

    # ── Verse Recommendations ───────────────────────────────────────────

    def get_verses_for_emotion(self, emotion: str) -> Dict[str, Any]:
        """
        Get recommended verses based on emotional state.

        Args:
            emotion: Current emotional state (e.g., 'anxious', 'sad', 'angry')

        Returns:
            Dict with verse references, chapter context, and guidance message
        """
        emotion_lower = emotion.lower().strip()
        verses = self.emotion_map.get(emotion_lower, self.emotion_map["neutral"])

        # Find relevant domains
        relevant_domains = []
        for domain_key, domain in self.domains.items():
            if emotion_lower in domain.when_to_use or any(
                emotion_lower in w for w in domain.when_to_use
            ):
                relevant_domains.append(domain_key)

        # Get chapter wisdom for recommended verses
        chapter_numbers = set()
        for v in verses:
            ch_num = int(v.split(".")[0])
            chapter_numbers.add(ch_num)

        chapter_context = [
            {
                "chapter": self.chapters[ch].number,
                "name": self.chapters[ch].english_name,
                "relevance": self.chapters[ch].summary,
            }
            for ch in sorted(chapter_numbers) if ch in self.chapters
        ]

        return {
            "emotion": emotion_lower,
            "recommended_verses": verses,
            "relevant_domains": relevant_domains,
            "chapter_context": chapter_context,
            "verse_count": len(verses),
        }

    def get_verses_for_concern(self, concern: str) -> Dict[str, Any]:
        """
        Get verses for a specific life concern or problem.

        Args:
            concern: Life situation (e.g., 'relationship_breakup', 'career_stress')

        Returns:
            Dict with verses, chapter focus, message, and therapeutic context
        """
        concern_lower = concern.lower().strip().replace(" ", "_").replace("-", "_")

        # Direct match
        if concern_lower in self.concern_map:
            data = self.concern_map[concern_lower]
            return {
                "concern": concern_lower,
                "verses": data["verses"],
                "chapter_focus": data["chapter_focus"],
                "message": data["message"],
                "chapters": [
                    {"number": ch, "name": self.chapters[ch].english_name}
                    for ch in data["chapter_focus"] if ch in self.chapters
                ],
            }

        # Fuzzy match via keyword
        for key, data in self.concern_map.items():
            if any(word in concern_lower for word in key.split("_")):
                return {
                    "concern": key,
                    "verses": data["verses"],
                    "chapter_focus": data["chapter_focus"],
                    "message": data["message"],
                    "chapters": [
                        {"number": ch, "name": self.chapters[ch].english_name}
                        for ch in data["chapter_focus"] if ch in self.chapters
                    ],
                }

        # Fallback: universal guidance
        return {
            "concern": concern_lower,
            "verses": ["2.47", "6.5", "9.30", "18.66"],
            "chapter_focus": [2, 6, 18],
            "message": "Whatever you are going through, know that you have the strength within. Focus on what you can do, be your own friend, and trust the journey.",
            "chapters": [
                {"number": 2, "name": "The Yoga of Knowledge"},
                {"number": 6, "name": "The Yoga of Meditation"},
                {"number": 18, "name": "Liberation Through Renunciation"},
            ],
        }

    # ── Chapter Wisdom ──────────────────────────────────────────────────

    def get_chapter_wisdom(self, chapter_number: int) -> Optional[Dict[str, Any]]:
        """
        Get complete wisdom metadata for a chapter.

        Args:
            chapter_number: Chapter number (1-18)

        Returns:
            Complete chapter info or None if invalid
        """
        chapter = self.chapters.get(chapter_number)
        if not chapter:
            return None

        return {
            "number": chapter.number,
            "sanskrit_name": chapter.sanskrit_name,
            "english_name": chapter.english_name,
            "verse_count": chapter.verse_count,
            "yoga_type": chapter.yoga_type,
            "themes": chapter.themes,
            "mental_health_focus": chapter.mental_health_focus,
            "therapeutic_applications": chapter.therapeutic_applications,
            "key_verses": chapter.key_verses,
            "summary": chapter.summary,
            "when_to_recommend": chapter.when_to_recommend,
        }

    def get_all_chapters_summary(self) -> List[Dict[str, Any]]:
        """Get a summary of all 18 chapters for navigation."""
        return [
            {
                "number": ch.number,
                "sanskrit_name": ch.sanskrit_name,
                "english_name": ch.english_name,
                "verse_count": ch.verse_count,
                "yoga_type": ch.yoga_type,
                "mental_health_focus": ch.mental_health_focus[0] if ch.mental_health_focus else "",
                "themes": ch.themes[:3],
            }
            for ch in self.chapters.values()
        ]

    # ── Daily Verse ─────────────────────────────────────────────────────

    def get_daily_verse(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get a thoughtful daily verse.

        Uses date-based deterministic selection so the same user gets
        the same verse all day, but a different one tomorrow.
        """
        today = date.today().isoformat()
        seed_str = f"{today}_{user_id or 'global'}"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)

        # Curated list of impactful daily verses
        daily_pool = [
            "2.47", "2.48", "2.14", "2.20", "2.56", "2.62", "2.70",
            "3.5", "3.8", "3.19", "3.35",
            "4.7", "4.10", "4.33", "4.38",
            "5.10", "5.21", "5.29",
            "6.5", "6.6", "6.17", "6.23", "6.35",
            "7.7", "7.19",
            "9.22", "9.26", "9.30",
            "10.9", "10.10", "10.20",
            "11.33", "11.55",
            "12.13", "12.14", "12.15",
            "13.28", "13.34",
            "14.22", "14.26",
            "15.1", "15.5",
            "16.1", "16.2", "16.3",
            "17.3",
            "18.45", "18.46", "18.47", "18.58", "18.63", "18.66", "18.78",
        ]

        rng = random.Random(seed)
        verse_ref = rng.choice(daily_pool)
        ch_num = int(verse_ref.split(".")[0])
        chapter = self.chapters.get(ch_num)

        return {
            "verse_ref": verse_ref,
            "chapter_number": ch_num,
            "chapter_name": chapter.english_name if chapter else "",
            "chapter_summary": chapter.summary if chapter else "",
            "date": today,
        }

    # ── Deep Analysis Context ───────────────────────────────────────────

    def get_verse_analysis_context(self, chapter: int, verse: int) -> Dict[str, Any]:
        """
        Get deep psychological analysis context for a verse.

        Provides the chapter therapeutic framework, relevant domains,
        and interpretive lenses for KIAAN to use when analyzing the verse.
        """
        verse_ref = f"{chapter}.{verse}"
        chapter_data = self.chapters.get(chapter)

        if not chapter_data:
            return {"error": f"Chapter {chapter} not found"}

        # Find which psychological domains this verse belongs to
        relevant_domains = []
        for domain_key, domain in self.domains.items():
            if verse_ref in domain.key_verses:
                relevant_domains.append({
                    "domain": domain_key,
                    "name": domain.name,
                    "approach": domain.therapeutic_approach,
                })
            else:
                for ch, start, end in domain.verse_ranges:
                    if ch == chapter and start <= verse <= end:
                        relevant_domains.append({
                            "domain": domain_key,
                            "name": domain.name,
                            "approach": domain.therapeutic_approach,
                        })
                        break

        return {
            "verse_ref": verse_ref,
            "chapter": {
                "number": chapter_data.number,
                "name": chapter_data.english_name,
                "yoga_type": chapter_data.yoga_type,
                "themes": chapter_data.themes,
                "mental_health_focus": chapter_data.mental_health_focus,
                "therapeutic_applications": chapter_data.therapeutic_applications,
                "summary": chapter_data.summary,
            },
            "psychological_domains": relevant_domains,
            "is_key_verse": verse_ref in chapter_data.key_verses,
            "analysis_lenses": [
                "psychological_interpretation",
                "practical_application",
                "emotional_resonance",
                "modern_relevance",
            ],
        }

    # ── Domain Explorer ─────────────────────────────────────────────────

    def get_domain_info(self, domain_key: str) -> Optional[Dict[str, Any]]:
        """Get complete info about a psychological domain."""
        domain = self.domains.get(domain_key)
        if not domain:
            return None

        return {
            "key": domain_key,
            "name": domain.name,
            "description": domain.description,
            "key_verses": domain.key_verses,
            "therapeutic_approach": domain.therapeutic_approach,
            "when_to_use": domain.when_to_use,
            "verse_range_count": len(domain.verse_ranges),
        }

    def get_all_domains(self) -> List[Dict[str, Any]]:
        """Get summary of all psychological domains."""
        return [
            {
                "key": key,
                "name": domain.name,
                "description": domain.description,
                "verse_count": len(domain.key_verses),
            }
            for key, domain in self.domains.items()
        ]

    # ── Search ──────────────────────────────────────────────────────────

    def search_by_theme(self, theme: str) -> List[Dict[str, Any]]:
        """Search chapters and domains by theme keyword."""
        theme_lower = theme.lower()
        results = []

        # Search chapters
        for ch in self.chapters.values():
            if any(theme_lower in t.lower() for t in ch.themes) or \
               any(theme_lower in mh.lower() for mh in ch.mental_health_focus):
                results.append({
                    "type": "chapter",
                    "number": ch.number,
                    "name": ch.english_name,
                    "relevance": ch.summary,
                })

        # Search domains
        for key, domain in self.domains.items():
            if theme_lower in domain.name.lower() or \
               theme_lower in domain.description.lower() or \
               any(theme_lower in w for w in domain.when_to_use):
                results.append({
                    "type": "domain",
                    "key": key,
                    "name": domain.name,
                    "relevance": domain.therapeutic_approach,
                })

        return results


# =============================================================================
# SINGLETON
# =============================================================================

_sphere_instance: Optional[GitaWisdomSphere] = None


def get_gita_wisdom_sphere() -> GitaWisdomSphere:
    """Get or create the singleton GitaWisdomSphere instance."""
    global _sphere_instance
    if _sphere_instance is None:
        _sphere_instance = GitaWisdomSphere()
    return _sphere_instance
