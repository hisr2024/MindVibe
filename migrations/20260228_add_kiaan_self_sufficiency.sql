-- =============================================================================
-- KIAAN Self-Sufficiency System — 4 Core Modules Database Migration
-- =============================================================================
-- Date: 2026-02-28
-- Description: Creates tables for the KIAAN self-sufficiency system:
--   1. wisdom_atoms        — Atomic reusable wisdom units distilled from LLM responses
--   2. verse_application_edges — Weighted verse-to-situation mapping graph
--   3. conversation_flow_snapshots — Multi-turn conversation state persistence
--   4. composition_templates — Pre-assembled proven response patterns
-- =============================================================================

-- =============================================================================
-- TABLE 1: wisdom_atoms — Distilled atomic wisdom units
-- =============================================================================
CREATE TABLE IF NOT EXISTS wisdom_atoms (
    id              VARCHAR(64) PRIMARY KEY,

    -- Content
    content         TEXT NOT NULL,
    content_hash    VARCHAR(64) NOT NULL UNIQUE,

    -- Classification
    category        VARCHAR(32) NOT NULL,  -- validation, reframe, action, wisdom, encouragement, grounding, reflection
    sub_category    VARCHAR(64),

    -- Context tags (JSONB for flexible matching)
    mood_tags       JSONB NOT NULL DEFAULT '[]',
    topic_tags      JSONB NOT NULL DEFAULT '[]',
    intent_tags     JSONB NOT NULL DEFAULT '[]',
    phase_tags      JSONB NOT NULL DEFAULT '[]',

    -- Verse association
    verse_ref       VARCHAR(16),          -- e.g. "2.47"
    psychology_frame VARCHAR(128),         -- e.g. "cognitive_defusion"

    -- Quality metrics
    effectiveness_score FLOAT NOT NULL DEFAULT 0.5,
    times_used      INTEGER NOT NULL DEFAULT 0,
    positive_feedback INTEGER NOT NULL DEFAULT 0,
    negative_feedback INTEGER NOT NULL DEFAULT 0,

    -- Source tracking
    source_llm_response_id VARCHAR(64),   -- FK to kiaan_chat_messages.id
    source_type     VARCHAR(32) NOT NULL DEFAULT 'llm_distillation',

    -- Soft delete
    deleted_at      TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
);

-- Indices for wisdom_atoms
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_category ON wisdom_atoms(category);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_content_hash ON wisdom_atoms(content_hash);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_verse_ref ON wisdom_atoms(verse_ref);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_effectiveness ON wisdom_atoms(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_deleted_at ON wisdom_atoms(deleted_at);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_mood_tags ON wisdom_atoms USING GIN(mood_tags);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_topic_tags ON wisdom_atoms USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_intent_tags ON wisdom_atoms USING GIN(intent_tags);
CREATE INDEX IF NOT EXISTS idx_wisdom_atoms_phase_tags ON wisdom_atoms USING GIN(phase_tags);


-- =============================================================================
-- TABLE 2: verse_application_edges — Verse-to-situation graph
-- =============================================================================
CREATE TABLE IF NOT EXISTS verse_application_edges (
    id              SERIAL PRIMARY KEY,

    -- Source: the verse
    verse_ref       VARCHAR(16) NOT NULL,  -- e.g. "2.47"

    -- Target: the situation
    mood            VARCHAR(32) NOT NULL,
    topic           VARCHAR(32) NOT NULL,

    -- Edge weight (0.0 - 1.0)
    weight          FLOAT NOT NULL DEFAULT 0.5,

    -- Evidence counters
    times_shown     INTEGER NOT NULL DEFAULT 0,
    positive_signals INTEGER NOT NULL DEFAULT 0,
    negative_signals INTEGER NOT NULL DEFAULT 0,

    -- Bayesian confidence
    confidence      FLOAT NOT NULL DEFAULT 0.1,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,

    -- Unique constraint: one edge per verse+mood+topic
    CONSTRAINT uq_verse_mood_topic UNIQUE (verse_ref, mood, topic)
);

-- Indices for verse_application_edges
CREATE INDEX IF NOT EXISTS idx_vae_verse_ref ON verse_application_edges(verse_ref);
CREATE INDEX IF NOT EXISTS idx_vae_mood ON verse_application_edges(mood);
CREATE INDEX IF NOT EXISTS idx_vae_topic ON verse_application_edges(topic);
CREATE INDEX IF NOT EXISTS idx_vae_mood_topic ON verse_application_edges(mood, topic);
CREATE INDEX IF NOT EXISTS idx_vae_weight ON verse_application_edges(weight DESC);
CREATE INDEX IF NOT EXISTS idx_vae_confidence ON verse_application_edges(confidence DESC);


-- =============================================================================
-- TABLE 3: conversation_flow_snapshots — State machine persistence
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversation_flow_snapshots (
    id              VARCHAR(64) PRIMARY KEY,
    session_id      VARCHAR(64) NOT NULL,
    user_id         VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,

    -- State machine
    current_phase   VARCHAR(32) NOT NULL DEFAULT 'connect',
    turn_count      INTEGER NOT NULL DEFAULT 0,

    -- Accumulated context
    mood_history    JSONB NOT NULL DEFAULT '[]',
    topic_history   JSONB NOT NULL DEFAULT '[]',
    intent_history  JSONB NOT NULL DEFAULT '[]',
    entities_seen   JSONB NOT NULL DEFAULT '[]',
    verse_refs_used JSONB NOT NULL DEFAULT '[]',
    atom_ids_used   JSONB NOT NULL DEFAULT '[]',

    -- Transition log
    transition_log  JSONB NOT NULL DEFAULT '[]',

    -- Dominant signals
    dominant_mood   VARCHAR(32),
    dominant_topic  VARCHAR(32),

    -- Quality tracking
    used_llm        BOOLEAN NOT NULL DEFAULT FALSE,
    self_sufficient_turns INTEGER NOT NULL DEFAULT 0,

    -- Soft delete
    deleted_at      TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

-- Indices for conversation_flow_snapshots
CREATE INDEX IF NOT EXISTS idx_cfs_session_id ON conversation_flow_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_cfs_user_id ON conversation_flow_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_cfs_current_phase ON conversation_flow_snapshots(current_phase);
CREATE INDEX IF NOT EXISTS idx_cfs_deleted_at ON conversation_flow_snapshots(deleted_at);


-- =============================================================================
-- TABLE 4: composition_templates — Pre-assembled response patterns
-- =============================================================================
CREATE TABLE IF NOT EXISTS composition_templates (
    id              VARCHAR(64) PRIMARY KEY,

    -- Target situation
    mood            VARCHAR(32) NOT NULL,
    topic           VARCHAR(32) NOT NULL,
    phase           VARCHAR(32) NOT NULL,
    intent          VARCHAR(32),

    -- Component atom references
    opener_atom_id  VARCHAR(64),
    body_atom_id    VARCHAR(64),
    action_atom_id  VARCHAR(64),
    wisdom_atom_id  VARCHAR(64),
    closer_atom_id  VARCHAR(64),

    -- Pre-rendered response
    rendered_response TEXT,

    -- Quality metrics
    effectiveness_score FLOAT NOT NULL DEFAULT 0.5,
    times_used      INTEGER NOT NULL DEFAULT 0,
    positive_feedback INTEGER NOT NULL DEFAULT 0,
    negative_feedback INTEGER NOT NULL DEFAULT 0,

    -- Flags
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Soft delete
    deleted_at      TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
);

-- Indices for composition_templates
CREATE INDEX IF NOT EXISTS idx_ct_mood ON composition_templates(mood);
CREATE INDEX IF NOT EXISTS idx_ct_topic ON composition_templates(topic);
CREATE INDEX IF NOT EXISTS idx_ct_phase ON composition_templates(phase);
CREATE INDEX IF NOT EXISTS idx_ct_intent ON composition_templates(intent);
CREATE INDEX IF NOT EXISTS idx_ct_mood_topic_phase ON composition_templates(mood, topic, phase);
CREATE INDEX IF NOT EXISTS idx_ct_effectiveness ON composition_templates(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_ct_is_active ON composition_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_ct_deleted_at ON composition_templates(deleted_at);


-- =============================================================================
-- COMMENTS for documentation
-- =============================================================================
COMMENT ON TABLE wisdom_atoms IS 'Atomic reusable wisdom units distilled from LLM responses. Each atom is a self-contained insight (1-3 sentences) that can be recombined without an LLM.';
COMMENT ON TABLE verse_application_edges IS 'Weighted graph edges mapping Gita verses to mood+topic situations. Weights evolve through user feedback.';
COMMENT ON TABLE conversation_flow_snapshots IS 'Persisted state for multi-turn conversation flow state machine. Enables conversation resumption and analytics.';
COMMENT ON TABLE composition_templates IS 'Pre-assembled response templates from proven atom combinations. Enable LLM-free responses for common situations.';
