-- ============================================================================
-- Migration: Add Karma Reset Sessions for Deep Karmic Transformation Tracking
-- Date: 2026-02-27
-- Description: Creates tables to persist karma reset sessions, enabling:
--   - History tracking of karmic transformation journeys
--   - Pattern analysis over time
--   - Follow-up and reflection tracking
--   - Integration with achievements and progress systems
-- ============================================================================

-- Karma Reset Sessions: Persists each karma reset for history and tracking
CREATE TABLE IF NOT EXISTS karma_reset_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,

    -- Karmic path selection
    karmic_path_key VARCHAR(64) NOT NULL DEFAULT 'kshama',
    karmic_path_name VARCHAR(256) NOT NULL DEFAULT '',

    -- User input
    situation TEXT NOT NULL DEFAULT '',
    feeling VARCHAR(500) NOT NULL DEFAULT '',

    -- AI-generated guidance (stored as JSON for flexibility)
    deep_guidance_json JSONB,
    legacy_guidance_json JSONB,

    -- Core verse reference
    core_verse_chapter INTEGER,
    core_verse_number INTEGER,

    -- Validation scores
    validation_score FLOAT DEFAULT 0.0,
    five_pillar_score FLOAT DEFAULT 0.0,
    compliance_level VARCHAR(16) DEFAULT '',
    pillars_met INTEGER DEFAULT 0,

    -- Session state
    status VARCHAR(32) NOT NULL DEFAULT 'started',
    current_phase INTEGER NOT NULL DEFAULT 1,
    completed_at TIMESTAMPTZ,

    -- Processing metadata
    model_used VARCHAR(64) DEFAULT 'fallback',
    processing_time_ms INTEGER DEFAULT 0,
    verses_used INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index for user lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_karma_reset_sessions_user_id
    ON karma_reset_sessions(user_id)
    WHERE deleted_at IS NULL;

-- Index for path analysis (which paths are most used)
CREATE INDEX IF NOT EXISTS idx_karma_reset_sessions_path
    ON karma_reset_sessions(karmic_path_key)
    WHERE deleted_at IS NULL;

-- Index for time-based queries (recent sessions, trends)
CREATE INDEX IF NOT EXISTS idx_karma_reset_sessions_created
    ON karma_reset_sessions(created_at DESC)
    WHERE deleted_at IS NULL;

-- Composite index for user + time (user's recent sessions)
CREATE INDEX IF NOT EXISTS idx_karma_reset_sessions_user_time
    ON karma_reset_sessions(user_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- ============================================================================
-- Karma Reset Reflections: Follow-up reflections after a karma reset
-- Tracks whether the repair was successful and what the user learned
-- ============================================================================

CREATE TABLE IF NOT EXISTS karma_reset_reflections (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES karma_reset_sessions(session_id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,

    -- Reflection content
    reflection_text TEXT NOT NULL DEFAULT '',
    repair_outcome VARCHAR(32) DEFAULT 'pending',
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),

    -- Learning captured
    lesson_learned TEXT DEFAULT '',
    would_do_differently TEXT DEFAULT '',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_karma_reset_reflections_session
    ON karma_reset_reflections(session_id)
    WHERE deleted_at IS NULL;

-- Index for user reflections
CREATE INDEX IF NOT EXISTS idx_karma_reset_reflections_user
    ON karma_reset_reflections(user_id)
    WHERE deleted_at IS NULL;

-- ============================================================================
-- Add karma reset count to user_progress for achievement integration
-- ============================================================================

-- Add karma reset tracking columns to user_progress if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_progress'
        AND column_name = 'total_karma_resets'
    ) THEN
        ALTER TABLE user_progress
            ADD COLUMN total_karma_resets INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_progress'
        AND column_name = 'karma_reset_streak'
    ) THEN
        ALTER TABLE user_progress
            ADD COLUMN karma_reset_streak INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- Seed karma reset achievements
-- ============================================================================

INSERT INTO achievements (key, name, description, category, target_value, rarity, badge_icon, reward_hint)
VALUES
    ('karma_first_reset', 'Karmic Awakening', 'Complete your first deep karma reset to begin your karmic transformation.', 'WELLNESS', 1, 'COMMON', '🕉️', 'A golden lotus badge for your first step on the karmic path'),
    ('karma_5_resets', 'Dharma Seeker', 'Complete 5 karma resets and walk the path of dharmic repair.', 'WELLNESS', 5, 'RARE', '🪷', 'Unlock the Lotus Garden theme'),
    ('karma_all_paths', 'Gita Scholar', 'Experience all 10 karmic paths at least once.', 'WELLNESS', 10, 'EPIC', '📿', 'Unlock the Sacred Mala badge'),
    ('karma_reflection', 'Inner Mirror', 'Write your first karma reset reflection.', 'WELLNESS', 1, 'COMMON', '🪞', 'A reflection badge for self-awareness')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Seed unlockables for karma reset achievements
-- ============================================================================

INSERT INTO unlockables (key, name, description, kind, rarity, required_achievement_id, reward_data)
SELECT
    'karmic_lotus_badge',
    'Karmic Lotus Badge',
    'A golden lotus symbolizing your first step on the path of karmic repair.',
    'BADGE',
    'COMMON',
    a.id,
    '{"icon": "🕉️", "gradient": "from-amber-400 via-yellow-300 to-amber-500"}'::jsonb
FROM achievements a WHERE a.key = 'karma_first_reset'
ON CONFLICT (key) DO NOTHING;

INSERT INTO unlockables (key, name, description, kind, rarity, required_achievement_id, reward_data)
SELECT
    'lotus_garden_theme',
    'Lotus Garden Theme',
    'A serene theme inspired by the lotus that blooms unstained from muddy waters.',
    'THEME',
    'RARE',
    a.id,
    '{"gradient": "from-pink-300 via-rose-200 to-amber-200", "accent": "#d4a44c"}'::jsonb
FROM achievements a WHERE a.key = 'karma_5_resets'
ON CONFLICT (key) DO NOTHING;

INSERT INTO unlockables (key, name, description, kind, rarity, required_achievement_id, reward_data)
SELECT
    'sacred_mala_badge',
    'Sacred Mala Badge',
    'A sacred mala representing mastery of all karmic paths — the mark of a true Gita scholar.',
    'BADGE',
    'EPIC',
    a.id,
    '{"icon": "📿", "gradient": "from-purple-400 via-indigo-300 to-blue-400"}'::jsonb
FROM achievements a WHERE a.key = 'karma_all_paths'
ON CONFLICT (key) DO NOTHING;
