-- Enhanced Wisdom Journeys System for Ṣaḍ-Ripu (Six Inner Enemies)
-- Migration: 20260125_add_wisdom_journeys_enhanced.sql
--
-- This migration adds support for:
-- 1. Journey templates (predefined journeys for each inner enemy)
-- 2. Journey steps (template steps with verse selectors)
-- 3. User journeys (instances of templates with personalization)
-- 4. User journey step state (AI-generated step content with provider tracking)

-- Add enemy_tags enum values for verse tagging
DO $$ BEGIN
    CREATE TYPE enemy_tag AS ENUM (
        'kama', 'krodha', 'lobha', 'moha', 'mada', 'matsarya',
        'mixed', 'general'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Journey templates table (admin-defined journey blueprints)
CREATE TABLE IF NOT EXISTS journey_templates (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug VARCHAR(128) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Primary focus area (which inner enemy this journey addresses)
    primary_enemy_tags JSONB NOT NULL DEFAULT '[]',

    -- Journey configuration
    duration_days INTEGER NOT NULL DEFAULT 14 CHECK (duration_days > 0 AND duration_days <= 90),
    difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    icon_name VARCHAR(64),
    color_theme VARCHAR(32),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for quick lookups
CREATE INDEX IF NOT EXISTS idx_journey_templates_slug ON journey_templates(slug);
CREATE INDEX IF NOT EXISTS idx_journey_templates_active ON journey_templates(is_active) WHERE is_active = true;

-- Journey template steps table (skeleton steps for each day)
CREATE TABLE IF NOT EXISTS journey_template_steps (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    journey_template_id VARCHAR(64) NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index > 0),

    -- Step content hints (for AI generation)
    step_title VARCHAR(255),
    teaching_hint TEXT,
    reflection_prompt TEXT,
    practice_prompt TEXT,

    -- Verse selection configuration
    verse_selector JSONB DEFAULT '{"tags": [], "max_verses": 3, "avoid_recent": 20}',
    static_verse_refs JSONB, -- Optional: fixed verses like [{"chapter": 2, "verse": 63}]

    -- Safety notes for sensitive content
    safety_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (journey_template_id, day_index)
);

CREATE INDEX IF NOT EXISTS idx_journey_template_steps_template ON journey_template_steps(journey_template_id);

-- User journey instances (user's active journeys)
CREATE TABLE IF NOT EXISTS user_journeys (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_template_id VARCHAR(64) REFERENCES journey_templates(id) ON DELETE SET NULL,

    -- Can also reference existing wisdom_journeys for backward compatibility
    legacy_journey_id VARCHAR(64) REFERENCES wisdom_journeys(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),

    -- Progress tracking
    current_day_index INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Personalization settings
    personalization JSONB DEFAULT '{}',
    -- Schema: {
    --   "pace": "daily" | "every_other_day" | "weekly",
    --   "time_budget_minutes": 10,
    --   "focus_tags": ["krodha", "moha"],
    --   "preferred_tone": "gentle" | "direct" | "inspiring",
    --   "provider_preference": "auto" | "openai" | "sarvam" | "oai_compat"
    -- }

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_status ON user_journeys(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_journeys_template ON user_journeys(journey_template_id);

-- User journey step state (generated content for each day)
CREATE TABLE IF NOT EXISTS user_journey_step_state (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_journey_id VARCHAR(64) NOT NULL REFERENCES user_journeys(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index > 0),

    -- Delivery tracking
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Verse references (from corpus, not full text)
    verse_refs JSONB NOT NULL DEFAULT '[]',
    -- Schema: [{"chapter": 2, "verse": 47}, {"chapter": 2, "verse": 48}]

    -- AI-generated step content (strict JSON from KIAAN)
    kiaan_step_json JSONB,
    -- Schema: {
    --   "step_title": "...",
    --   "today_focus": "kama|krodha|...",
    --   "verse_refs": [...],
    --   "teaching": "...",
    --   "guided_reflection": ["...", "...", "..."],
    --   "practice": {"name": "...", "instructions": [...], "duration_minutes": 5},
    --   "micro_commitment": "...",
    --   "check_in_prompt": {"scale": "0-10", "label": "..."},
    --   "safety_note": "..." (optional)
    -- }

    -- User reflection (encrypted reference or FK to journal)
    reflection_reference VARCHAR(64), -- FK to journal_entries.id
    reflection_encrypted JSONB, -- Or encrypted blob if not linked

    -- Check-in data
    check_in JSONB,
    -- Schema: {"intensity": 7, "label": "...", "timestamp": "..."}

    -- Provider tracking
    provider_used VARCHAR(64),
    model_used VARCHAR(128),

    -- Additional step metadata (named step_metadata to avoid ORM conflicts)
    step_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_journey_id, day_index)
);

CREATE INDEX IF NOT EXISTS idx_user_journey_step_state_journey ON user_journey_step_state(user_journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_step_state_delivered ON user_journey_step_state(delivered_at) WHERE delivered_at IS NOT NULL;

-- Add enemy tags to existing wisdom verses for filtering
ALTER TABLE wisdom_verses ADD COLUMN IF NOT EXISTS enemy_tags JSONB DEFAULT '[]';
ALTER TABLE wisdom_verses ADD COLUMN IF NOT EXISTS virtue_tags JSONB DEFAULT '[]';

-- Add spiritual wellness tags if not present
ALTER TABLE gita_verses ADD COLUMN IF NOT EXISTS enemy_tags JSONB DEFAULT '[]';
ALTER TABLE gita_verses ADD COLUMN IF NOT EXISTS virtue_tags JSONB DEFAULT '[]';
ALTER TABLE gita_verses ADD COLUMN IF NOT EXISTS journey_relevance_score NUMERIC(3, 2) DEFAULT 0.5;

-- Index for tag-based queries
CREATE INDEX IF NOT EXISTS idx_wisdom_verses_enemy_tags ON wisdom_verses USING GIN (enemy_tags);
CREATE INDEX IF NOT EXISTS idx_gita_verses_enemy_tags ON gita_verses USING GIN (enemy_tags);

-- AI Provider configuration table (for admin management)
CREATE TABLE IF NOT EXISTS ai_provider_configs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    provider_name VARCHAR(64) NOT NULL UNIQUE,
    display_name VARCHAR(128) NOT NULL,

    -- Configuration
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 100,

    -- Health status
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(32) DEFAULT 'unknown',
    avg_latency_ms INTEGER,

    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default providers
INSERT INTO ai_provider_configs (provider_name, display_name, is_enabled, is_default, priority)
VALUES
    ('openai', 'OpenAI (GPT-4o-mini)', true, true, 1),
    ('sarvam', 'Sarvam AI', true, false, 2),
    ('oai_compat', 'OpenAI Compatible', false, false, 3)
ON CONFLICT (provider_name) DO UPDATE SET
    updated_at = NOW();

-- Add comments for documentation
COMMENT ON TABLE journey_templates IS 'Admin-defined journey blueprints for the six inner enemies (Ṣaḍ-Ripu)';
COMMENT ON TABLE journey_template_steps IS 'Day-by-day skeleton for journey templates with verse selectors';
COMMENT ON TABLE user_journeys IS 'User instances of journeys with personalization settings';
COMMENT ON TABLE user_journey_step_state IS 'AI-generated step content and user progress for each day';
COMMENT ON TABLE ai_provider_configs IS 'Configuration for multi-provider LLM support';
