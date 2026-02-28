"""
KIAAN Self-Sufficiency Models — Database tables for the 4 core modules.

Module 1: WisdomAtom — Atomic reusable wisdom units distilled from LLM responses
Module 2: VerseApplicationEdge — Weighted verse-to-situation graph edges
Module 3: ConversationFlowSnapshot — Persisted conversation state machine snapshots
Module 4: CompositionTemplate — Pre-assembled response templates from proven patterns
"""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


# =============================================================================
# MODULE 1: Wisdom Atoms — Distilled from LLM responses
# =============================================================================


class WisdomAtom(SoftDeleteMixin, Base):
    """
    Atomic unit of reusable wisdom distilled from LLM responses.

    Each atom is a self-contained insight (1-3 sentences) that can be
    recombined without an LLM to form complete responses. The distillation
    pipeline extracts these from every successful LLM interaction.

    Example atom:
        category: "reframe"
        content: "Anger is a boundary signal — it activates when something
                  you value has been violated."
        mood_tags: ["angry", "frustrated"]
        topic_tags: ["relationship", "work"]
        effectiveness_score: 0.87
    """

    __tablename__ = "wisdom_atoms"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )

    # Classification
    category: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )  # validation, reframe, action, wisdom, encouragement, grounding
    sub_category: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Context tags (JSON arrays for flexible matching)
    mood_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    topic_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    intent_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    phase_tags: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )  # connect, listen, guide, empower

    # Verse association (if this atom references Gita wisdom)
    verse_ref: Mapped[str | None] = mapped_column(
        String(16), nullable=True, index=True
    )  # e.g. "2.47"
    psychology_frame: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )  # e.g. "cognitive_defusion"

    # Quality metrics (updated by feedback loop)
    effectiveness_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.5
    )  # 0.0 - 1.0
    times_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    positive_feedback: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    negative_feedback: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Source tracking
    source_llm_response_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # KiaanChatMessage.id that generated this
    source_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="llm_distillation"
    )  # llm_distillation, manual, corpus

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


# =============================================================================
# MODULE 2: Verse Application Graph — Weighted edges from user feedback
# =============================================================================


class VerseApplicationEdge(Base):
    """
    Weighted edge in the verse-to-situation application graph.

    Each edge represents "verse X was effective for mood Y + topic Z".
    Weights increase when users give positive feedback (thumbs up, journal save)
    and decay when feedback is negative. This creates a dynamic, self-improving
    verse recommendation system.

    The graph structure:
        Verse (2.47) --[weight: 0.92]--> Situation (anxious + academic)
        Verse (2.47) --[weight: 0.65]--> Situation (stressed + work)
        Verse (6.5)  --[weight: 0.88]--> Situation (sad + relationship)
    """

    __tablename__ = "verse_application_edges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Source: the verse
    verse_ref: Mapped[str] = mapped_column(
        String(16), nullable=False, index=True
    )  # "chapter.verse" e.g. "2.47"

    # Target: the situation (mood + topic combination)
    mood: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    # Edge weight (0.0 - 1.0, higher = more effective)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)

    # Evidence counters
    times_shown: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    positive_signals: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # thumbs up, saved, shared
    negative_signals: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # thumbs down, skipped

    # Confidence (Bayesian: higher with more data)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.1)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("verse_ref", "mood", "topic", name="uq_verse_mood_topic"),
    )


# =============================================================================
# MODULE 3: Conversation Flow Snapshots — State machine persistence
# =============================================================================


class ConversationFlowSnapshot(SoftDeleteMixin, Base):
    """
    Persisted state for the multi-turn conversation flow state machine.

    Stores the current phase, accumulated context, and transition history
    for a user's conversation session. Enables resumption of conversations
    and provides data for improving the state machine over time.
    """

    __tablename__ = "conversation_flow_snapshots"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )

    # State machine state
    current_phase: Mapped[str] = mapped_column(
        String(32), nullable=False, default="connect"
    )  # connect, listen, understand, guide, empower
    turn_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Accumulated context (JSON for flexibility)
    mood_history: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    topic_history: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    intent_history: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    entities_seen: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    verse_refs_used: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    atom_ids_used: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )

    # Transition log (array of {from, to, trigger, turn})
    transition_log: Mapped[list[dict]] = mapped_column(
        JSON, nullable=False, default=list
    )

    # Dominant signals
    dominant_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    dominant_topic: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Quality tracking
    used_llm: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    self_sufficient_turns: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )


# =============================================================================
# MODULE 4: Composition Templates — Pre-assembled proven response patterns
# =============================================================================


class CompositionTemplate(SoftDeleteMixin, Base):
    """
    Pre-assembled response template built from proven atom combinations.

    When a particular combination of atoms consistently receives positive
    feedback, the Composition Engine crystallizes it into a template.
    These templates enable high-quality responses without any LLM call.

    Structure:
        opener_atom_id  → WisdomAtom (validation/empathy)
        body_atom_id    → WisdomAtom (reframe/insight)
        action_atom_id  → WisdomAtom (practical step)
        wisdom_atom_id  → WisdomAtom (Gita verse + psychology)
        closer_atom_id  → WisdomAtom (encouragement/follow-up)
    """

    __tablename__ = "composition_templates"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Target situation
    mood: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    phase: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    intent: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)

    # Component atom references (each slot references a WisdomAtom.id)
    opener_atom_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    body_atom_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    action_atom_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    wisdom_atom_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    closer_atom_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Pre-rendered response (cached assembly of atoms)
    rendered_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Quality metrics
    effectiveness_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.5
    )
    times_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    positive_feedback: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    negative_feedback: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Flags
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )  # Human-reviewed

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )
