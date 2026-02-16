"""Relationship Wisdom Core - Static + Dynamic wisdom for Relationship Compass.

This module is the relationship-specific wisdom layer that sits on top of
the general WisdomCore. It provides curated relationship wisdom from the
Bhagavad Gita mapped to universal human relationship principles, plus
dynamic wisdom generation via OpenAI.

Architecture:
    RelationshipWisdomCore
    ├── Static Wisdom Layer
    │   ├── 50 curated relationship principles (Gita-derived, secular framing)
    │   ├── Emotion-to-principle mapping
    │   ├── Mode-to-wisdom routing (conflict, boundary, repair, etc.)
    │   └── Relationship-type specific guidance
    ├── Dynamic Wisdom Layer (WisdomCore integration)
    │   ├── Gita verse search by emotion/theme
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

import logging
from dataclasses import dataclass, field
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

    Combines static principles, dynamic Gita verses, and learned wisdom
    into a single context block that the OpenAI synthesizer can use.
    """

    # Static curated principles
    principles: list[RelationshipPrinciple] = field(default_factory=list)

    # Dynamic Gita verses (from WisdomCore)
    gita_verses: list[dict[str, Any]] = field(default_factory=list)

    # Learned wisdom (from 24/7 daemon)
    learned_wisdom: list[dict[str, Any]] = field(default_factory=list)

    # Analysis context
    mode: str = "conflict"
    primary_emotion: str = ""
    relationship_type: str = "romantic"
    mechanism: str = ""

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
        lines.append("")

        # Static principles
        if self.principles:
            lines.append("--- RELATIONSHIP PRINCIPLES (curated, secular) ---")
            for p in self.principles[:8]:
                lines.append(f"- [{p.id}] {p.principle}")
                lines.append(f"  Insight: {p.explanation}")
                lines.append(f"  Source wisdom: {p.gita_essence} ({p.gita_source})")
                lines.append("")

        # Dynamic Gita verses
        if self.gita_verses:
            lines.append("--- SUPPORTING WISDOM (from 700+ verse corpus) ---")
            for v in self.gita_verses[:6]:
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

# Build lookup indices for fast retrieval
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
    """Relationship-specific wisdom layer on top of WisdomCore.

    Provides curated static principles and integrates with the dynamic
    WisdomCore for verse retrieval and learned wisdom.
    """

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

    def get_principles(
        self,
        mode: str = "",
        emotion: str = "",
        relationship_type: str = "",
        limit: int = 6,
    ) -> list[RelationshipPrinciple]:
        """Retrieve relevant static principles by mode, emotion, and type.

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

        # Score by mode (highest weight)
        for p in _PRINCIPLES_BY_MODE.get(mode, []):
            scored[p.id] = scored.get(p.id, 0) + 3.0

        # Score by emotion
        for p in _PRINCIPLES_BY_EMOTION.get(emotion, []):
            scored[p.id] = scored.get(p.id, 0) + 2.0

        # Score by relationship type
        for p in _PRINCIPLES_BY_TYPE.get(relationship_type, []):
            scored[p.id] = scored.get(p.id, 0) + 1.5

        if not scored:
            # Return general principles if no specific match
            return RELATIONSHIP_PRINCIPLES[:limit]

        # Sort by score descending
        sorted_ids = sorted(scored, key=lambda x: scored[x], reverse=True)
        id_lookup = {p.id: p for p in RELATIONSHIP_PRINCIPLES}

        return [id_lookup[pid] for pid in sorted_ids[:limit] if pid in id_lookup]

    async def gather_wisdom(
        self,
        db: AsyncSession,
        situation: str,
        mode: str = "conflict",
        emotion: str = "",
        mechanism: str = "",
        relationship_type: str = "romantic",
        limit: int = 6,
    ) -> WisdomContext:
        """Gather all wisdom sources for the synthesizer.

        Combines:
        1. Static curated principles (matched by mode/emotion/type)
        2. Dynamic Gita verses (from WisdomCore search)
        3. Learned wisdom (validated, from 24/7 daemon)

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
        )

        # 1. Static principles
        context.principles = self.get_principles(
            mode=mode,
            emotion=emotion,
            relationship_type=relationship_type,
            limit=limit,
        )

        # 2. Dynamic wisdom from WisdomCore
        wisdom_core = self._get_wisdom_core()
        if wisdom_core and db:
            try:
                # Search by situation text
                search_query = f"{situation} {emotion} {mode} {relationship_type}"
                results = await wisdom_core.search(
                    db=db,
                    query=search_query,
                    limit=limit,
                    include_learned=True,
                    validated_only=True,
                )

                for r in results:
                    if r.source.value == "gita_verse":
                        context.gita_verses.append({
                            "verse_ref": r.verse_ref or f"BG {r.chapter}.{r.verse}",
                            "content": r.content,
                            "sanskrit": r.sanskrit,
                            "theme": r.theme,
                            "principle": r.principle,
                            "primary_domain": r.primary_domain,
                            "score": r.score,
                        })
                    elif r.source.value == "learned":
                        context.learned_wisdom.append({
                            "content": r.content,
                            "source_name": r.source_name or "Verified commentary",
                            "themes": r.themes,
                            "shad_ripu_tags": r.shad_ripu_tags,
                            "quality_score": r.quality_score,
                        })

                # Also search by emotion domain if we have few results
                if emotion and len(context.gita_verses) < 3:
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
                            db=db, domain=domain, limit=3, include_learned=True,
                        )
                        existing_ids = {v.get("verse_ref") for v in context.gita_verses}
                        for r in domain_results:
                            vref = r.verse_ref or f"BG {r.chapter}.{r.verse}"
                            if vref not in existing_ids and r.source.value == "gita_verse":
                                context.gita_verses.append({
                                    "verse_ref": vref,
                                    "content": r.content,
                                    "theme": r.theme,
                                    "score": r.score,
                                })

            except Exception as e:
                logger.warning(f"Dynamic wisdom retrieval failed (non-critical): {e}")

        context.total_sources = (
            len(context.principles)
            + len(context.gita_verses)
            + len(context.learned_wisdom)
        )
        context.confidence = min(1.0, context.total_sources / 10.0)

        logger.info(
            f"RelationshipWisdomCore gathered: "
            f"{len(context.principles)} principles, "
            f"{len(context.gita_verses)} verses, "
            f"{len(context.learned_wisdom)} learned, "
            f"confidence={context.confidence:.2f}"
        )

        return context


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
