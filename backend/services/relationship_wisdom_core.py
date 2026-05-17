"""Relationship Wisdom Core - Full 700+ Verse Corpus + Dynamic Wisdom for Relationship Compass.

This module is the relationship-specific wisdom layer that sits on top of
the general WisdomCore. It provides:

1. FULL STATIC CORPUS: All 700+ Bhagavad Gita verses loaded from JSON at startup,
   indexed by theme, mental_health_application, chapter, and keywords for fast
   relationship-relevant retrieval.
2. CURATED PRINCIPLES: 20 hand-crafted relationship principles (Gita-derived,
   secular framing) for the highest-quality targeted guidance.
3. DYNAMIC WISDOM: WisdomCore integration for DB-stored Gita verses + learned
   wisdom from the 24/7 daemon.

Architecture:
    RelationshipWisdomCore
    ├── Full Static Corpus (700+ verses from JSON)
    │   ├── In-memory index by mental_health_application
    │   ├── In-memory index by theme
    │   ├── In-memory index by chapter
    │   ├── Relationship-relevance scoring engine
    │   └── Keyword search across English translations
    ├── Curated Principles Layer (20 relationship principles)
    │   ├── Emotion-to-principle mapping
    │   ├── Mode-to-wisdom routing (conflict, boundary, repair, etc.)
    │   └── Relationship-type specific guidance
    ├── Dynamic Wisdom Layer (WisdomCore integration)
    │   ├── DB Gita verse search by emotion/theme
    │   ├── Learned wisdom retrieval (validated)
    │   └── Shad Ripu enemy-based routing
    └── Synthesis Interface
        └── Combined context builder for OpenAI synthesizer

Usage:
    from backend.services.relationship_wisdom_core import get_relationship_wisdom_core

    rwc = get_relationship_wisdom_core()
    context = await rwc.gather_wisdom(
        db=db,
        situation="My partner shuts down when I share feelings",
        mode="conflict",
        emotion="dismissed",
        relationship_type="romantic",
    )
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# =============================================================================
# DATA CLASSES
# =============================================================================


@dataclass
class RelationshipPrinciple:
    """A secular relationship principle derived from Gita wisdom.

    Each principle traces to a specific Gita teaching but is framed
    in modern, universal language accessible to any audience.
    """

    id: str
    principle: str  # The secular principle statement
    explanation: str  # How it applies to relationships
    gita_source: str  # Original verse reference (e.g., "BG 2.47")
    gita_essence: str  # The core Gita teaching in plain language
    modes: list[str]  # Which modes this applies to
    emotions: list[str]  # Which emotions this addresses
    relationship_types: list[str]  # Which relationship types benefit
    tags: list[str]  # Searchable tags


@dataclass
class WisdomContext:
    """Aggregated wisdom context for the synthesizer.

    Combines curated principles, full-corpus verse matches, dynamic DB
    verses, and learned wisdom into a single context block for synthesis.
    """

    # Curated relationship principles
    principles: list[RelationshipPrinciple] = field(default_factory=list)

    # Static corpus matches (from 700+ JSON verses)
    static_verses: list[dict[str, Any]] = field(default_factory=list)

    # Dynamic Gita verses (from WisdomCore DB)
    gita_verses: list[dict[str, Any]] = field(default_factory=list)

    # Learned wisdom (from 24/7 daemon)
    learned_wisdom: list[dict[str, Any]] = field(default_factory=list)

    # Analysis context
    mode: str = "conflict"
    primary_emotion: str = ""
    relationship_type: str = "romantic"
    mechanism: str = ""

    # Full corpus stats
    total_corpus_verses: int = 0
    corpus_chapters: int = 18

    # Metadata
    total_sources: int = 0
    confidence: float = 0.0

    def to_context_block(self) -> str:
        """Build a rich context block for the AI synthesizer.

        Returns a structured text block combining all wisdom sources
        that the synthesizer uses to generate personalized guidance.
        """
        lines = ["[WISDOM_CORE_CONTEXT]"]
        lines.append(f"Mode: {self.mode} | Emotion: {self.primary_emotion}")
        lines.append(f"Relationship: {self.relationship_type} | Mechanism: {self.mechanism}")
        lines.append(f"Corpus: {self.total_corpus_verses} verses across {self.corpus_chapters} chapters")
        lines.append("")

        # Curated principles
        if self.principles:
            lines.append("--- RELATIONSHIP PRINCIPLES (curated, secular) ---")
            for p in self.principles[:6]:
                lines.append(f"- [{p.id}] {p.principle}")
                lines.append(f"  Insight: {p.explanation}")
                lines.append(f"  Source wisdom: {p.gita_essence} ({p.gita_source})")
                lines.append("")

        # Static corpus matches (full 700+ verse corpus search results)
        if self.static_verses:
            lines.append(f"--- CORE WISDOM (from {self.total_corpus_verses}-verse corpus, ranked by relevance) ---")
            for v in self.static_verses[:8]:
                ref = v.get("verse_ref", "")
                english = v.get("english", "")
                theme = v.get("theme", "")
                principle = v.get("principle", "")
                score = v.get("score", 0)
                lines.append(f"- {ref} [score={score:.1f}]: {english[:250]}")
                if principle:
                    lines.append(f"  Principle: {principle}")
                if theme:
                    lines.append(f"  Theme: {theme.replace('_', ' ').title()}")
                mh_apps = v.get("mental_health_applications", [])
                if mh_apps:
                    lines.append(f"  Applications: {', '.join(mh_apps[:5])}")
                lines.append("")

        # Dynamic DB verses
        if self.gita_verses:
            lines.append("--- DYNAMIC WISDOM (from database search) ---")
            for v in self.gita_verses[:4]:
                ref = v.get("verse_ref", v.get("ref", ""))
                content = v.get("content", v.get("english", ""))
                theme = v.get("theme", "")
                lines.append(f"- {ref}: {content[:200]}")
                if theme:
                    lines.append(f"  Theme: {theme}")
                lines.append("")

        # Learned wisdom
        if self.learned_wisdom:
            lines.append("--- EXTENDED INSIGHTS (validated learned wisdom) ---")
            for lw in self.learned_wisdom[:4]:
                source = lw.get("source_name", "Verified source")
                content = lw.get("content", "")[:250]
                lines.append(f"- [{source}]: {content}")
                lines.append("")

        lines.append("[/WISDOM_CORE_CONTEXT]")
        return "\n".join(lines)


# =============================================================================
# FULL GITA CORPUS LOADING (700+ verses from static JSON)
# =============================================================================

_GITA_CORPUS: list[dict[str, Any]] = []
_CORPUS_PATH = Path(__file__).parent.parent.parent / "data" / "gita" / "gita_verses_complete.json"

# In-memory indices for fast lookup
_INDEX_BY_MH_APP: dict[str, list[int]] = {}  # mental_health_application -> verse indices
_INDEX_BY_THEME: dict[str, list[int]] = {}  # theme -> verse indices
_INDEX_BY_CHAPTER: dict[int, list[int]] = {}  # chapter -> verse indices
_INDEX_BY_KEYWORD: dict[str, list[int]] = {}  # keyword -> verse indices

# Relationship-relevant spiritual wellness applications (mapped to modes/emotions)
_MH_APP_TO_MODE: dict[str, list[str]] = {
    "conflict_resolution": ["conflict", "repair"],
    "emotional_regulation": ["conflict", "pattern", "courage"],
    "self_awareness": ["pattern", "courage", "decision"],
    "anxiety_management": ["conflict", "boundary", "decision"],
    "anger_management": ["conflict", "boundary"],
    "emotional_recognition": ["conflict", "pattern"],
    "forgiveness": ["repair", "pattern"],
    "communication": ["conflict", "repair", "boundary"],
    "trust_building": ["repair", "decision"],
    "self_compassion": ["courage", "pattern"],
    "decision_making": ["decision", "courage"],
    "boundary_setting": ["boundary", "courage"],
    "stress_management": ["conflict", "pattern"],
    "grief_processing": ["decision", "pattern"],
    "acceptance": ["decision", "pattern", "repair"],
    "detachment": ["boundary", "decision", "conflict"],
    "equanimity": ["conflict", "decision", "pattern"],
    "mindfulness": ["conflict", "pattern", "courage"],
    "resilience": ["pattern", "courage", "decision"],
    "self_worth": ["boundary", "courage", "decision"],
    "patience": ["conflict", "repair", "pattern"],
    "compassion": ["repair", "conflict", "pattern"],
    "inner_peace": ["conflict", "decision", "pattern"],
    "duty": ["boundary", "decision", "courage"],
    "beginning": ["decision", "courage"],
}

_MH_APP_TO_EMOTION: dict[str, list[str]] = {
    "conflict_resolution": ["angry", "frustrated", "resentful"],
    "emotional_regulation": ["angry", "anxious", "hurt", "overwhelmed"],
    "self_awareness": ["confused", "lost", "disconnected"],
    "anxiety_management": ["anxious", "powerless", "afraid"],
    "anger_management": ["angry", "furious", "resentful", "frustrated"],
    "emotional_recognition": ["confused", "numb", "disconnected"],
    "forgiveness": ["resentful", "hurt", "betrayed"],
    "communication": ["frustrated", "dismissed", "unheard"],
    "trust_building": ["betrayed", "suspicious", "insecure"],
    "self_compassion": ["guilty", "inadequate", "exhausted"],
    "decision_making": ["confused", "anxious", "powerless"],
    "boundary_setting": ["suffocated", "exhausted", "resentful"],
    "stress_management": ["exhausted", "overwhelmed", "anxious"],
    "grief_processing": ["hurt", "abandoned", "lonely", "disappointed"],
    "acceptance": ["disappointed", "hurt", "confused"],
    "detachment": ["anxious", "powerless", "suffocated"],
    "equanimity": ["angry", "anxious", "hurt", "confused"],
    "mindfulness": ["anxious", "angry", "confused"],
    "resilience": ["hurt", "exhausted", "disappointed"],
    "self_worth": ["inadequate", "dismissed", "humiliated"],
    "patience": ["frustrated", "anxious", "angry"],
    "compassion": ["hurt", "resentful", "lonely"],
    "inner_peace": ["anxious", "overwhelmed", "confused"],
    "duty": ["confused", "guilty", "powerless"],
    "beginning": ["confused", "anxious", "lost"],
}

# Relationship-important chapters with boost factors
_CHAPTER_RELATIONSHIP_BOOST: dict[int, float] = {
    2: 1.6,   # Sankhya Yoga - equanimity, grief, steady wisdom
    3: 1.4,   # Karma Yoga - action, duty, selfless service
    5: 1.2,   # Karma Sannyasa - renunciation, peace
    6: 1.5,   # Dhyana Yoga - mind control, meditation, self-mastery
    12: 1.5,  # Bhakti Yoga - devotion, compassion, divine qualities
    13: 1.2,  # Kshetra Kshetrajna - knowledge, humility
    14: 1.1,  # Gunatraya Vibhaga - three qualities (sattva/rajas/tamas)
    16: 1.4,  # Daivasura Sampad - divine vs demonic qualities
    17: 1.3,  # Shraddhatraya - faith, speech, austerity
    18: 1.3,  # Moksha Sannyasa - liberation, surrender, conclusion
}


def _load_and_index_corpus() -> None:
    """Load the full 700+ verse corpus from JSON and build in-memory indices.

    Called once at module load. Builds fast-lookup indices for:
    - mental_health_applications -> verse indices
    - theme -> verse indices
    - chapter -> verse indices
    - English keywords -> verse indices
    """
    global _GITA_CORPUS
    global _INDEX_BY_MH_APP, _INDEX_BY_THEME, _INDEX_BY_CHAPTER, _INDEX_BY_KEYWORD

    try:
        if not _CORPUS_PATH.exists():
            logger.warning(f"Gita corpus not found at {_CORPUS_PATH}")
            return

        with open(_CORPUS_PATH, "r", encoding="utf-8") as f:
            _GITA_CORPUS = json.load(f)

        logger.info(f"RelationshipWisdomCore: Loaded {len(_GITA_CORPUS)} verses from corpus")

        # Build indices
        for idx, verse in enumerate(_GITA_CORPUS):
            # Index by spiritual wellness applications
            for app in verse.get("mental_health_applications", []):
                app_lower = app.lower().strip()
                _INDEX_BY_MH_APP.setdefault(app_lower, []).append(idx)

            # Index by theme
            theme = verse.get("theme", "").lower().strip()
            if theme:
                _INDEX_BY_THEME.setdefault(theme, []).append(idx)

            # Index by chapter
            chapter = verse.get("chapter", 0)
            if chapter:
                _INDEX_BY_CHAPTER.setdefault(chapter, []).append(idx)

            # Index by significant English keywords (words > 4 chars)
            english = verse.get("english", "").lower()
            for word in english.split():
                cleaned = word.strip(".,;:!?\"'()-—")
                if len(cleaned) > 4 and cleaned.isalpha():
                    _INDEX_BY_KEYWORD.setdefault(cleaned, []).append(idx)

        logger.info(
            f"RelationshipWisdomCore indices built: "
            f"{len(_INDEX_BY_MH_APP)} mh_apps, "
            f"{len(_INDEX_BY_THEME)} themes, "
            f"{len(_INDEX_BY_CHAPTER)} chapters, "
            f"{len(_INDEX_BY_KEYWORD)} keywords"
        )

    except Exception as e:
        logger.error(f"Failed to load Gita corpus: {e}")


# Load corpus at module import time
_load_and_index_corpus()


# =============================================================================
# STATIC RELATIONSHIP PRINCIPLES (Gita-derived, secular framing)
# =============================================================================

RELATIONSHIP_PRINCIPLES: list[RelationshipPrinciple] = [
    # --- CONFLICT PRINCIPLES ---
    RelationshipPrinciple(
        id="P01",
        principle="Focus on your actions, not their response",
        explanation="You control how you show up. You do not control their reaction. Investing energy in managing their response is energy stolen from your own clarity.",
        gita_source="BG 2.47",
        gita_essence="You have the right to action alone, never to its fruits",
        modes=["conflict", "boundary", "repair"],
        emotions=["angry", "frustrated", "powerless", "anxious"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["agency", "control", "detachment", "action"],
    ),
    RelationshipPrinciple(
        id="P02",
        principle="Strong emotions signal what matters, not what to do",
        explanation="Anger, hurt, fear: these flag that something important is at stake. But acting from the emotion itself usually makes things worse. Pause between feeling and action.",
        gita_source="BG 2.62-63",
        gita_essence="From dwelling on objects comes attachment; from attachment, desire; from desire, anger; from anger, confusion",
        modes=["conflict", "pattern", "courage"],
        emotions=["angry", "hurt", "resentful", "jealous"],
        relationship_types=["romantic", "family", "friendship", "workplace"],
        tags=["emotion", "regulation", "pause", "awareness"],
    ),
    RelationshipPrinciple(
        id="P03",
        principle="People act from their own conditioning, not to harm you",
        explanation="Their behavior reflects their inner world: fears, habits, unresolved wounds. Understanding this doesn't excuse harm; it prevents you from taking it personally.",
        gita_source="BG 3.27-28",
        gita_essence="All actions are performed by the qualities of nature. The deluded one thinks 'I am the doer'",
        modes=["conflict", "pattern", "courage"],
        emotions=["betrayed", "dismissed", "hurt", "confused"],
        relationship_types=["romantic", "family", "friendship", "workplace", "community"],
        tags=["perspective", "compassion", "conditioning", "understanding"],
    ),
    RelationshipPrinciple(
        id="P04",
        principle="Your worth is not determined by someone else's treatment of you",
        explanation="No external validation, rejection, or criticism can change your fundamental value. When your sense of worth is internally anchored, others lose the power to destabilize you.",
        gita_source="BG 2.55-56",
        gita_essence="One who is satisfied within, whose peace is not disturbed by adversity or elation, is of steady wisdom",
        modes=["conflict", "boundary", "courage", "decision"],
        emotions=["inadequate", "dismissed", "humiliated", "abandoned"],
        relationship_types=["romantic", "family", "workplace", "self"],
        tags=["self-worth", "stability", "inner-peace", "resilience"],
    ),
    RelationshipPrinciple(
        id="P05",
        principle="Speak what is true, kind, helpful, and timely",
        explanation="Four conditions for healthy communication. If your words fail any of these tests, wait. Truth spoken cruelly is not brave; it is weaponized honesty.",
        gita_source="BG 17.15",
        gita_essence="Speech that is truthful, pleasing, beneficial, and non-agitating is the austerity of speech",
        modes=["conflict", "repair", "boundary", "courage"],
        emotions=["angry", "resentful", "guilty", "hurt"],
        relationship_types=["romantic", "family", "friendship", "workplace"],
        tags=["communication", "speech", "honesty", "kindness"],
    ),
    # --- BOUNDARY PRINCIPLES ---
    RelationshipPrinciple(
        id="P06",
        principle="Protecting your standards is not selfish; it is necessary",
        explanation="Boundaries preserve the relationship by preventing resentment. A relationship without limits eventually collapses under accumulated unspoken grievances.",
        gita_source="BG 3.35",
        gita_essence="It is better to perform one's own duty imperfectly than another's duty perfectly",
        modes=["boundary", "decision", "courage"],
        emotions=["resentful", "exhausted", "powerless", "suffocated"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["boundary", "duty", "integrity", "self-protection"],
    ),
    RelationshipPrinciple(
        id="P07",
        principle="Courage means choosing the right action despite discomfort",
        explanation="Avoiding necessary conversations feels safer but compounds the problem. The discomfort of a boundary conversation is temporary; the cost of avoidance is permanent erosion.",
        gita_source="BG 2.31-33",
        gita_essence="Considering your duty, you should not waver, for there is nothing more beneficial than righteous action",
        modes=["boundary", "courage", "decision"],
        emotions=["anxious", "powerless", "guilty", "confused"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["courage", "action", "duty", "discomfort"],
    ),
    RelationshipPrinciple(
        id="P08",
        principle="You are responsible for your behavior, not their feelings about it",
        explanation="If you act with integrity, their discomfort with your boundary is their work to do. Taking responsibility for their reaction trains you both to avoid truth.",
        gita_source="BG 2.48",
        gita_essence="Perform action established in equanimity, abandoning attachment, being equal in success and failure",
        modes=["boundary", "conflict", "courage"],
        emotions=["guilty", "anxious", "powerless", "confused"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["responsibility", "equanimity", "detachment", "integrity"],
    ),
    # --- REPAIR PRINCIPLES ---
    RelationshipPrinciple(
        id="P09",
        principle="Genuine repair requires specific accountability, not vague apology",
        explanation="'I'm sorry' means nothing without naming what you did, acknowledging impact, and committing to different behavior. Repair is action, not words alone.",
        gita_source="BG 18.66",
        gita_essence="Surrender all forms of pretense; align with what is true, and you shall be freed from consequence",
        modes=["repair", "courage"],
        emotions=["guilty", "resentful", "hurt", "confused"],
        relationship_types=["romantic", "family", "friendship", "workplace"],
        tags=["repair", "accountability", "apology", "change"],
    ),
    RelationshipPrinciple(
        id="P10",
        principle="Forgiveness liberates the forgiver, not the offender",
        explanation="Holding resentment consumes your energy to punish someone who may not even notice. Forgiveness means putting down the weight. It does not mean accepting the behavior.",
        gita_source="BG 16.1-3",
        gita_essence="Fearlessness, purity of heart, forgiveness, non-violence, truthfulness are divine qualities",
        modes=["repair", "pattern", "conflict"],
        emotions=["resentful", "hurt", "betrayed", "angry"],
        relationship_types=["romantic", "family", "friendship"],
        tags=["forgiveness", "freedom", "resentment", "letting-go"],
    ),
    # --- DECISION PRINCIPLES ---
    RelationshipPrinciple(
        id="P11",
        principle="Indecision is a decision to stay in the current situation by default",
        explanation="Waiting for certainty that never comes is itself a choice. Decide based on what you can respect yourself for choosing, not what guarantees the best outcome.",
        gita_source="BG 2.7",
        gita_essence="Tell me clearly what is best for me. I am your student. Instruct me, for I have surrendered to you",
        modes=["decision", "courage"],
        emotions=["confused", "anxious", "powerless", "exhausted"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["decision", "clarity", "action", "uncertainty"],
    ),
    RelationshipPrinciple(
        id="P12",
        principle="Hard times are temporary; your core self persists through all of them",
        explanation="Pain is real and valid. But it is a weather system, not the sky. You have survived every difficult moment so far. This one is no exception.",
        gita_source="BG 2.14",
        gita_essence="Contacts with the material world give rise to cold, heat, pleasure, and pain. They come and go; bear them patiently",
        modes=["decision", "pattern", "conflict"],
        emotions=["hurt", "abandoned", "lonely", "exhausted", "disappointed"],
        relationship_types=["romantic", "family", "friendship", "self"],
        tags=["resilience", "impermanence", "endurance", "perspective"],
    ),
    # --- PATTERN PRINCIPLES ---
    RelationshipPrinciple(
        id="P13",
        principle="The pattern breaks when you do something different, not when they do",
        explanation="Waiting for the other person to change keeps you locked in the cycle. You changing one link in the chain is enough to disrupt the entire dynamic.",
        gita_source="BG 6.5-6",
        gita_essence="One must elevate oneself by one's own mind, not degrade oneself. The mind can be the friend or the enemy of the self",
        modes=["pattern", "courage", "conflict"],
        emotions=["exhausted", "resentful", "powerless", "confused"],
        relationship_types=["romantic", "family", "friendship", "workplace"],
        tags=["pattern", "change", "agency", "self-responsibility"],
    ),
    RelationshipPrinciple(
        id="P14",
        principle="What you tolerate, you teach",
        explanation="Repeatedly accepting behavior that crosses your limits signals that the limit does not exist. Consistency between your words and actions is the only boundary that holds.",
        gita_source="BG 3.21",
        gita_essence="Whatever a great person does, common people follow. Whatever standards they set, the world pursues",
        modes=["pattern", "boundary"],
        emotions=["resentful", "exhausted", "dismissed", "powerless"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["tolerance", "standards", "consistency", "teaching"],
    ),
    # --- SELF-RELATIONSHIP PRINCIPLES ---
    RelationshipPrinciple(
        id="P15",
        principle="Self-compassion is not weakness; it is the foundation of resilience",
        explanation="You cannot pour from an empty vessel. Treating yourself as harshly as your inner critic demands does not make you stronger; it makes you brittle.",
        gita_source="BG 6.5-6",
        gita_essence="For one who has conquered the mind, the mind is the best of friends; for one who has failed to do so, it is the greatest enemy",
        modes=["courage", "pattern", "decision"],
        emotions=["guilty", "inadequate", "exhausted", "lonely"],
        relationship_types=["self", "romantic", "family"],
        tags=["self-compassion", "resilience", "inner-critic", "kindness"],
    ),
    RelationshipPrinciple(
        id="P16",
        principle="See the full picture before responding; both sides are incomplete alone",
        explanation="Every conflict has at least two valid perspectives. Understanding theirs does not invalidate yours. It gives you the clarity to respond instead of react.",
        gita_source="BG 6.32",
        gita_essence="One who sees equality everywhere, in pleasure and pain, is the highest practitioner",
        modes=["conflict", "repair", "pattern"],
        emotions=["angry", "betrayed", "confused", "resentful"],
        relationship_types=["romantic", "family", "friendship", "workplace", "community"],
        tags=["perspective", "equality", "empathy", "clarity"],
    ),
    RelationshipPrinciple(
        id="P17",
        principle="Dignity is more important than approval",
        explanation="Sacrificing your self-respect to keep someone happy is a transaction that always costs more than it pays. People respect those who respect themselves.",
        gita_source="BG 2.37",
        gita_essence="If killed, you gain heaven; if victorious, you enjoy the earth. Therefore arise with determination",
        modes=["boundary", "decision", "courage"],
        emotions=["powerless", "inadequate", "suffocated", "dismissed"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["dignity", "self-respect", "approval", "courage"],
    ),
    RelationshipPrinciple(
        id="P18",
        principle="Observe your reactions before acting on them",
        explanation="The gap between stimulus and response is where your power lives. In that gap, you can choose: react from conditioning, or respond from wisdom.",
        gita_source="BG 6.19",
        gita_essence="As a lamp in a windless place does not flicker, so the disciplined mind remains steady",
        modes=["conflict", "pattern", "courage"],
        emotions=["angry", "anxious", "hurt", "confused"],
        relationship_types=["romantic", "family", "friendship", "workplace", "self"],
        tags=["mindfulness", "awareness", "pause", "response"],
    ),
    RelationshipPrinciple(
        id="P19",
        principle="Let go of the outcome while giving your best effort",
        explanation="You can invest fully in repair, boundary-setting, or honest conversation without needing a specific result. The quality of your effort is yours; the response is theirs.",
        gita_source="BG 2.47",
        gita_essence="You have the right to action alone, never to its fruits. Do not let the fruits of action be your motive",
        modes=["repair", "decision", "conflict", "boundary"],
        emotions=["anxious", "powerless", "confused", "disappointed"],
        relationship_types=["romantic", "family", "workplace", "friendship"],
        tags=["detachment", "effort", "outcome", "surrender"],
    ),
    RelationshipPrinciple(
        id="P20",
        principle="Connection built on pretense collapses; authenticity endures",
        explanation="Relationships maintained by hiding your truth are relationships with a version of you that does not exist. Authenticity risks rejection but enables real intimacy.",
        gita_source="BG 13.7",
        gita_essence="Humility, sincerity, non-violence, patience, uprightness constitute true knowledge",
        modes=["courage", "repair", "decision"],
        emotions=["anxious", "guilty", "lonely", "suffocated"],
        relationship_types=["romantic", "family", "friendship", "self"],
        tags=["authenticity", "honesty", "vulnerability", "connection"],
    ),
]

# Build lookup indices for fast principle retrieval
_PRINCIPLES_BY_MODE: dict[str, list[RelationshipPrinciple]] = {}
_PRINCIPLES_BY_EMOTION: dict[str, list[RelationshipPrinciple]] = {}
_PRINCIPLES_BY_TYPE: dict[str, list[RelationshipPrinciple]] = {}

for _p in RELATIONSHIP_PRINCIPLES:
    for _mode in _p.modes:
        _PRINCIPLES_BY_MODE.setdefault(_mode, []).append(_p)
    for _emo in _p.emotions:
        _PRINCIPLES_BY_EMOTION.setdefault(_emo, []).append(_p)
    for _rt in _p.relationship_types:
        _PRINCIPLES_BY_TYPE.setdefault(_rt, []).append(_p)


# =============================================================================
# RELATIONSHIP WISDOM CORE CLASS
# =============================================================================


class RelationshipWisdomCore:
    """Full-corpus relationship wisdom layer with 700+ verses + WisdomCore.

    Loads the entire Gita corpus at startup, builds in-memory indices,
    and provides fast relationship-relevant verse retrieval alongside
    curated principles and dynamic learned wisdom.
    """

    # Scoring weights for corpus search
    MH_APP_WEIGHT = 4.0    # Spiritual wellness application match
    THEME_WEIGHT = 3.0      # Theme match
    KEYWORD_WEIGHT = 1.5    # Keyword in English translation
    PRINCIPLE_WEIGHT = 2.0  # Principle text match
    CHAPTER_BOOST_MAX = 1.6 # Max chapter relevance boost

    def __init__(self) -> None:
        """Initialize the RelationshipWisdomCore."""
        self._wisdom_core = None

    def _get_wisdom_core(self):
        """Lazy-load the general WisdomCore singleton."""
        if self._wisdom_core is None:
            try:
                from backend.services.wisdom_core import get_wisdom_core
                self._wisdom_core = get_wisdom_core()
            except Exception as e:
                logger.warning(f"WisdomCore unavailable: {e}")
        return self._wisdom_core

    # =========================================================================
    # CURATED PRINCIPLES RETRIEVAL
    # =========================================================================

    def get_principles(
        self,
        mode: str = "",
        emotion: str = "",
        relationship_type: str = "",
        limit: int = 6,
    ) -> list[RelationshipPrinciple]:
        """Retrieve relevant curated principles by mode, emotion, and type.

        Scores principles by relevance across all three dimensions and
        returns the top matches.

        Args:
            mode: Detected mode (conflict, boundary, repair, etc.).
            emotion: Primary emotion detected.
            relationship_type: Type of relationship.
            limit: Maximum principles to return.

        Returns:
            List of RelationshipPrinciple sorted by relevance.
        """
        scored: dict[str, float] = {}

        for p in _PRINCIPLES_BY_MODE.get(mode, []):
            scored[p.id] = scored.get(p.id, 0) + 3.0

        for p in _PRINCIPLES_BY_EMOTION.get(emotion, []):
            scored[p.id] = scored.get(p.id, 0) + 2.0

        for p in _PRINCIPLES_BY_TYPE.get(relationship_type, []):
            scored[p.id] = scored.get(p.id, 0) + 1.5

        if not scored:
            return RELATIONSHIP_PRINCIPLES[:limit]

        sorted_ids = sorted(scored, key=lambda x: scored[x], reverse=True)
        id_lookup = {p.id: p for p in RELATIONSHIP_PRINCIPLES}

        return [id_lookup[pid] for pid in sorted_ids[:limit] if pid in id_lookup]

    # =========================================================================
    # FULL CORPUS SEARCH (700+ verses from static JSON)
    # =========================================================================

    def search_corpus(
        self,
        situation: str,
        mode: str = "conflict",
        emotion: str = "",
        mechanism: str = "",
        relationship_type: str = "romantic",
        limit: int = 8,
    ) -> list[dict[str, Any]]:
        """Search the full 700+ verse corpus for relationship-relevant wisdom.

        Uses multi-signal scoring across mental_health_applications, themes,
        keywords, and chapter relevance to find the most applicable verses.

        Args:
            situation: The user's relationship situation text.
            mode: Detected relationship mode.
            emotion: Primary emotion.
            mechanism: Detected psychological mechanism.
            relationship_type: Type of relationship.
            limit: Maximum verses to return.

        Returns:
            List of verse dicts with scores, sorted by relevance.
        """
        if not _GITA_CORPUS:
            return []

        situation_lower = situation.lower()
        situation_words = {
            w.strip(".,;:!?\"'()-—")
            for w in situation_lower.split()
            if len(w.strip(".,;:!?\"'()-—")) > 3
        }

        # Collect candidate verse indices from indices (avoid scoring all 700+)
        candidate_indices: dict[int, float] = {}

        # 1. Score by spiritual wellness application matches
        relevant_apps = self._get_relevant_mh_apps(mode, emotion, mechanism, situation_words)
        for app in relevant_apps:
            app_lower = app.lower()
            for idx in _INDEX_BY_MH_APP.get(app_lower, []):
                candidate_indices[idx] = candidate_indices.get(idx, 0) + self.MH_APP_WEIGHT

        # 2. Score by theme matches
        relevant_themes = self._get_relevant_themes(mode, emotion, situation_words)
        for theme in relevant_themes:
            theme_lower = theme.lower()
            for idx in _INDEX_BY_THEME.get(theme_lower, []):
                candidate_indices[idx] = candidate_indices.get(idx, 0) + self.THEME_WEIGHT

        # 3. Score by keyword matches in English text
        for word in situation_words:
            if len(word) > 4:
                for idx in _INDEX_BY_KEYWORD.get(word, []):
                    candidate_indices[idx] = candidate_indices.get(idx, 0) + self.KEYWORD_WEIGHT

        # 4. If we have very few candidates, broaden search via chapter relevance
        if len(candidate_indices) < limit * 2:
            for chapter, boost in _CHAPTER_RELATIONSHIP_BOOST.items():
                for idx in _INDEX_BY_CHAPTER.get(chapter, []):
                    if idx not in candidate_indices:
                        candidate_indices[idx] = boost * 0.5  # Lower base score

        # Score and rank candidates
        scored_results: list[tuple[float, int]] = []
        for idx, base_score in candidate_indices.items():
            verse = _GITA_CORPUS[idx]
            final_score = self._score_verse_for_relationship(
                verse, base_score, situation_lower, situation_words,
                mode, emotion, mechanism, relationship_type,
            )
            if final_score > 0:
                scored_results.append((final_score, idx))

        scored_results.sort(key=lambda x: x[0], reverse=True)

        # Build result dicts
        results: list[dict[str, Any]] = []
        seen_refs: set[str] = set()

        for score, idx in scored_results[:limit * 2]:
            verse = _GITA_CORPUS[idx]
            chapter = verse.get("chapter", 0)
            verse_num = verse.get("verse", 0)
            ref = f"BG {chapter}.{verse_num}"

            if ref in seen_refs:
                continue
            seen_refs.add(ref)

            results.append({
                "verse_ref": ref,
                "chapter": chapter,
                "verse": verse_num,
                "english": verse.get("english", "").strip(),
                "sanskrit": verse.get("sanskrit", ""),
                "transliteration": verse.get("transliteration", ""),
                "hindi": verse.get("hindi", ""),
                "theme": verse.get("theme", ""),
                "principle": verse.get("principle", ""),
                "chapter_name": verse.get("chapter_name", ""),
                "mental_health_applications": verse.get("mental_health_applications", []),
                "score": round(score, 2),
            })

            if len(results) >= limit:
                break

        return results

    def _score_verse_for_relationship(
        self,
        verse: dict[str, Any],
        base_score: float,
        situation_lower: str,
        situation_words: set[str],
        mode: str,
        emotion: str,
        mechanism: str,
        relationship_type: str,
    ) -> float:
        """Fine-grained scoring of a verse for relationship relevance.

        Args:
            verse: The verse dict from the corpus.
            base_score: Initial score from index lookups.
            situation_lower: Lowercased user situation text.
            situation_words: Set of significant words from situation.
            mode: Detected relationship mode.
            emotion: Primary emotion.
            mechanism: Psychological mechanism.
            relationship_type: Type of relationship.

        Returns:
            Final relevance score.
        """
        score = base_score

        # Chapter relevance boost
        chapter = verse.get("chapter", 0)
        chapter_boost = _CHAPTER_RELATIONSHIP_BOOST.get(chapter, 1.0)
        score *= chapter_boost

        # Principle text relevance
        principle = verse.get("principle", "").lower()
        if principle:
            for word in situation_words:
                if word in principle:
                    score += self.PRINCIPLE_WEIGHT
                    break

        # Mode-specific spiritual wellness app matching
        mh_apps = verse.get("mental_health_applications", [])
        mode_relevant_apps = set()
        for app, modes in _MH_APP_TO_MODE.items():
            if mode in modes:
                mode_relevant_apps.add(app)

        for app in mh_apps:
            if app.lower() in mode_relevant_apps:
                score += 1.5

        # Emotion-specific spiritual wellness app matching
        emotion_relevant_apps = set()
        for app, emotions in _MH_APP_TO_EMOTION.items():
            if emotion in emotions:
                emotion_relevant_apps.add(app)

        for app in mh_apps:
            if app.lower() in emotion_relevant_apps:
                score += 1.0

        # Mechanism keyword boost
        if mechanism:
            mechanism_keywords = mechanism.lower().replace("_", " ").split()
            english_lower = verse.get("english", "").lower()
            for kw in mechanism_keywords:
                if len(kw) > 3 and kw in english_lower:
                    score += 1.0

        return score

    def _get_relevant_mh_apps(
        self,
        mode: str,
        emotion: str,
        mechanism: str,
        situation_words: set[str],
    ) -> list[str]:
        """Determine which mental_health_applications are relevant for this query.

        Args:
            mode: Detected relationship mode.
            emotion: Primary emotion.
            mechanism: Psychological mechanism.
            situation_words: Significant words from user's situation.

        Returns:
            List of relevant spiritual wellness application keys.
        """
        apps: set[str] = set()

        # Mode-based apps
        for app, modes in _MH_APP_TO_MODE.items():
            if mode in modes:
                apps.add(app)

        # Emotion-based apps
        for app, emotions in _MH_APP_TO_EMOTION.items():
            if emotion in emotions:
                apps.add(app)

        # Mechanism-based apps
        if mechanism:
            mech_lower = mechanism.lower().replace("_", " ")
            mech_words = mech_lower.split()
            # Direct mappings
            mechanism_app_map: dict[str, list[str]] = {
                "attachment": ["emotional_regulation", "detachment", "self_awareness"],
                "ego": ["self_awareness", "self_compassion", "equanimity"],
                "control": ["detachment", "anxiety_management", "boundary_setting"],
                "avoidance": ["courage", "communication", "self_awareness"],
                "projection": ["self_awareness", "mindfulness", "compassion"],
                "codependency": ["boundary_setting", "self_worth", "detachment"],
                "trauma": ["self_compassion", "resilience", "anxiety_management"],
                "unmet": ["communication", "self_awareness", "boundary_setting"],
                "betrayal": ["trust_building", "forgiveness", "grief_processing"],
                "abandonment": ["anxiety_management", "self_worth", "resilience"],
            }
            for word in mech_words:
                for key, mapped_apps in mechanism_app_map.items():
                    if key in word:
                        apps.update(mapped_apps)

        # Situation-word based apps
        situation_app_map: dict[str, str] = {
            "angry": "anger_management", "anger": "anger_management",
            "frustrated": "emotional_regulation", "hurt": "emotional_regulation",
            "forgive": "forgiveness", "sorry": "forgiveness",
            "trust": "trust_building", "boundary": "boundary_setting",
            "anxious": "anxiety_management", "worried": "anxiety_management",
            "confused": "decision_making", "decide": "decision_making",
            "talk": "communication", "communicate": "communication",
            "guilty": "self_compassion", "shame": "self_compassion",
            "grief": "grief_processing", "loss": "grief_processing",
            "stress": "stress_management", "overwhelmed": "stress_management",
            "peace": "inner_peace", "calm": "inner_peace",
            "patience": "patience", "patient": "patience",
            "compassion": "compassion", "empathy": "compassion",
            "worth": "self_worth", "enough": "self_worth",
            "accept": "acceptance", "letting": "acceptance",
            "detach": "detachment", "release": "detachment",
            "aware": "self_awareness", "realize": "self_awareness",
            "mindful": "mindfulness", "present": "mindfulness",
            "strong": "resilience", "resilient": "resilience",
        }
        for word in situation_words:
            if word in situation_app_map:
                apps.add(situation_app_map[word])

        return list(apps)

    def _get_relevant_themes(
        self,
        mode: str,
        emotion: str,
        situation_words: set[str],
    ) -> list[str]:
        """Determine which themes are relevant for this query.

        Args:
            mode: Detected relationship mode.
            emotion: Primary emotion.
            situation_words: Significant words from user's situation.

        Returns:
            List of relevant theme keys.
        """
        themes: set[str] = set()

        mode_theme_map: dict[str, list[str]] = {
            "conflict": [
                "emotional_crisis_moral_conflict", "anger_management_inner_peace",
                "self_mastery_discipline", "equanimity_balanced_living",
                "duty_righteous_action",
            ],
            "boundary": [
                "duty_righteous_action", "self_mastery_discipline",
                "courage_determination", "divine_demonic_qualities",
            ],
            "repair": [
                "forgiveness_compassion", "devotion_love",
                "selfless_action_duty", "knowledge_wisdom",
            ],
            "decision": [
                "wisdom_knowledge_discernment", "duty_righteous_action",
                "renunciation_liberation", "surrender_trust",
            ],
            "pattern": [
                "self_mastery_discipline", "three_gunas_nature",
                "knowledge_wisdom", "liberation_freedom",
            ],
            "courage": [
                "courage_determination", "duty_righteous_action",
                "divine_demonic_qualities", "self_mastery_discipline",
            ],
        }
        themes.update(mode_theme_map.get(mode, []))

        # Add themes based on situation keywords
        keyword_theme_map: dict[str, str] = {
            "anger": "anger_management_inner_peace",
            "peace": "equanimity_balanced_living",
            "forgive": "forgiveness_compassion",
            "love": "devotion_love",
            "duty": "duty_righteous_action",
            "wisdom": "wisdom_knowledge_discernment",
            "knowledge": "knowledge_wisdom",
            "discipline": "self_mastery_discipline",
            "courage": "courage_determination",
            "surrender": "surrender_trust",
            "liberation": "liberation_freedom",
            "nature": "three_gunas_nature",
        }
        for word in situation_words:
            for key, theme in keyword_theme_map.items():
                if key in word:
                    themes.add(theme)

        return list(themes)

    # =========================================================================
    # UNIFIED WISDOM GATHERING
    # =========================================================================

    async def gather_wisdom(
        self,
        db: AsyncSession,
        situation: str,
        mode: str = "conflict",
        emotion: str = "",
        mechanism: str = "",
        relationship_type: str = "romantic",
        limit: int = 8,
    ) -> WisdomContext:
        """Gather all wisdom sources for the synthesizer.

        Combines:
        1. Curated principles (matched by mode/emotion/type)
        2. Full static corpus search (700+ verses, relationship-scored)
        3. Dynamic DB Gita verses (from WisdomCore search)
        4. Learned wisdom (validated, from 24/7 daemon)

        Args:
            db: Database session.
            situation: The user's relationship situation text.
            mode: Detected relationship mode.
            emotion: Primary emotion.
            mechanism: Detected psychological mechanism.
            relationship_type: Type of relationship.
            limit: Max items per source.

        Returns:
            WisdomContext with all aggregated wisdom.
        """
        context = WisdomContext(
            mode=mode,
            primary_emotion=emotion,
            relationship_type=relationship_type,
            mechanism=mechanism,
            total_corpus_verses=len(_GITA_CORPUS),
            corpus_chapters=len(_INDEX_BY_CHAPTER),
        )

        # 1. Curated principles
        context.principles = self.get_principles(
            mode=mode,
            emotion=emotion,
            relationship_type=relationship_type,
            limit=min(limit, 6),
        )

        # 2. Full static corpus search (700+ verses)
        context.static_verses = self.search_corpus(
            situation=situation,
            mode=mode,
            emotion=emotion,
            mechanism=mechanism,
            relationship_type=relationship_type,
            limit=limit,
        )

        # 3. Dynamic wisdom from WisdomCore (DB verses + learned wisdom)
        wisdom_core = self._get_wisdom_core()
        if wisdom_core and db:
            try:
                search_query = f"{situation} {emotion} {mode} {relationship_type}"
                results = await wisdom_core.search(
                    db=db,
                    query=search_query,
                    limit=limit,
                    include_learned=True,
                    validated_only=True,
                )

                # Collect verse refs already found in static search to avoid duplicates
                static_refs = {v.get("verse_ref") for v in context.static_verses}

                for r in results:
                    if r.source.value == "gita_verse":
                        vref = r.verse_ref or f"BG {r.chapter}.{r.verse}"
                        if vref not in static_refs:
                            context.gita_verses.append({
                                "verse_ref": vref,
                                "content": r.content,
                                "sanskrit": r.sanskrit,
                                "theme": r.theme,
                                "principle": r.principle,
                                "primary_domain": r.primary_domain,
                                "score": r.score,
                            })
                            static_refs.add(vref)
                    elif r.source.value == "learned":
                        context.learned_wisdom.append({
                            "content": r.content,
                            "source_name": r.source_name or "Verified commentary",
                            "themes": r.themes,
                            "shad_ripu_tags": r.shad_ripu_tags,
                            "quality_score": r.quality_score,
                        })

                # Supplement with emotion domain search if we have few static results
                if emotion and len(context.static_verses) < 4:
                    emotion_domain_map = {
                        "angry": "anger", "hurt": "grief", "betrayed": "grief",
                        "anxious": "anxiety", "confused": "confusion",
                        "guilty": "stress", "lonely": "loneliness",
                        "jealous": "anger", "exhausted": "stress",
                        "dismissed": "stress", "powerless": "anxiety",
                        "resentful": "anger", "abandoned": "grief",
                        "humiliated": "stress", "inadequate": "self_doubt",
                        "suffocated": "stress", "disappointed": "grief",
                    }
                    domain = emotion_domain_map.get(emotion)
                    if domain:
                        domain_results = await wisdom_core.get_by_domain(
                            db=db, domain=domain, limit=4, include_learned=True,
                        )
                        for r in domain_results:
                            vref = r.verse_ref or f"BG {r.chapter}.{r.verse}"
                            if vref not in static_refs and r.source.value == "gita_verse":
                                context.gita_verses.append({
                                    "verse_ref": vref,
                                    "content": r.content,
                                    "theme": r.theme,
                                    "score": r.score,
                                })
                                static_refs.add(vref)

            except Exception as e:
                logger.warning(f"Dynamic wisdom retrieval failed (non-critical): {e}")

        context.total_sources = (
            len(context.principles)
            + len(context.static_verses)
            + len(context.gita_verses)
            + len(context.learned_wisdom)
        )
        context.confidence = min(1.0, context.total_sources / 12.0)

        logger.info(
            f"RelationshipWisdomCore gathered: "
            f"{len(context.principles)} principles, "
            f"{len(context.static_verses)} static verses (from {len(_GITA_CORPUS)} corpus), "
            f"{len(context.gita_verses)} dynamic verses, "
            f"{len(context.learned_wisdom)} learned, "
            f"confidence={context.confidence:.2f}"
        )

        return context

    # =========================================================================
    # CORPUS STATISTICS
    # =========================================================================

    def get_corpus_stats(self) -> dict[str, Any]:
        """Get statistics about the loaded corpus.

        Returns:
            Dict with corpus size, index sizes, and coverage info.
        """
        return {
            "total_verses": len(_GITA_CORPUS),
            "chapters": len(_INDEX_BY_CHAPTER),
            "mental_health_apps_indexed": len(_INDEX_BY_MH_APP),
            "themes_indexed": len(_INDEX_BY_THEME),
            "keywords_indexed": len(_INDEX_BY_KEYWORD),
            "curated_principles": len(RELATIONSHIP_PRINCIPLES),
            "corpus_loaded": len(_GITA_CORPUS) > 0,
        }


# =============================================================================
# SINGLETON
# =============================================================================

_relationship_wisdom_core: Optional[RelationshipWisdomCore] = None


def get_relationship_wisdom_core() -> RelationshipWisdomCore:
    """Get the singleton RelationshipWisdomCore instance."""
    global _relationship_wisdom_core
    if _relationship_wisdom_core is None:
        _relationship_wisdom_core = RelationshipWisdomCore()
    return _relationship_wisdom_core
