-- KIAAN Learning System Tables Migration
--
-- This migration creates tables for the 24/7 learning daemon to store
-- Gita wisdom content in the database (instead of just JSON files).
--
-- Tables:
--   1. learned_wisdom - Stores wisdom learned from YouTube, Audio, Web sources
--   2. user_query_patterns - Stores query patterns for AI-free responses
--   3. content_source_registry - Tracks content sources and their health
--
-- Architecture:
--   Daemon → learned_wisdom table → WisdomCore → KIAAN
--
-- Strict Compliance: All content is validated against 18 chapters, 700+ verses
-- of the Bhagavad Gita before storage.
--
-- dialect: postgres-only

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Content source type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_source_type') THEN
        CREATE TYPE content_source_type AS ENUM (
            'youtube',
            'audio',
            'web',
            'podcast',
            'book',
            'manual'
        );
    END IF;
END $$;

-- Validation status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_status') THEN
        CREATE TYPE validation_status AS ENUM (
            'pending',
            'validated',
            'rejected'
        );
    END IF;
END $$;

-- =============================================================================
-- TABLE: learned_wisdom
-- =============================================================================
-- Stores wisdom learned by KIAAN's 24/7 daemon from various sources.
-- Connected to the Wisdom Core for use in journey generation.

CREATE TABLE IF NOT EXISTS learned_wisdom (
    -- Primary key
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,

    -- Content
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 for deduplication

    -- Source information
    source_type content_source_type NOT NULL,
    source_url VARCHAR(1024),
    source_name VARCHAR(256) NOT NULL,
    source_author VARCHAR(256),

    -- Language
    language VARCHAR(10) NOT NULL DEFAULT 'en',

    -- Gita references (JSON arrays)
    chapter_refs JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [1, 2, 6]
    verse_refs JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [[2, 47], [6, 5]]

    -- Categorization (JSON arrays)
    themes JSONB NOT NULL DEFAULT '[]'::jsonb,
    shad_ripu_tags JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Inner enemies
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Mental health mapping
    primary_domain VARCHAR(64),
    secondary_domains JSONB,
    mental_health_applications JSONB,

    -- Quality & validation
    quality_score NUMERIC(3, 2) NOT NULL DEFAULT 0.00,  -- 0.00 - 1.00
    validation_status validation_status NOT NULL DEFAULT 'pending',
    validated_by VARCHAR(64),
    validated_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Embeddings for semantic search
    embedding JSONB,

    -- Usage tracking
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    learned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes for learned_wisdom
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_content_hash ON learned_wisdom(content_hash);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_source_type ON learned_wisdom(source_type);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_source_name ON learned_wisdom(source_name);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_language ON learned_wisdom(language);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_validation_status ON learned_wisdom(validation_status);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_primary_domain ON learned_wisdom(primary_domain);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_quality_score ON learned_wisdom(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_learned_at ON learned_wisdom(learned_at DESC);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_deleted_at ON learned_wisdom(deleted_at);

-- GIN indexes for JSON array searching
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_chapter_refs ON learned_wisdom USING GIN (chapter_refs);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_themes ON learned_wisdom USING GIN (themes);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_shad_ripu_tags ON learned_wisdom USING GIN (shad_ripu_tags);
CREATE INDEX IF NOT EXISTS idx_learned_wisdom_keywords ON learned_wisdom USING GIN (keywords);

-- =============================================================================
-- TABLE: user_query_patterns
-- =============================================================================
-- Stores patterns learned from user queries for AI-free response generation.
-- Enables KIAAN to respond without external AI when patterns match.

CREATE TABLE IF NOT EXISTS user_query_patterns (
    -- Primary key
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,

    -- Pattern definition
    query_template TEXT NOT NULL,
    query_hash VARCHAR(64) NOT NULL UNIQUE,  -- For deduplication
    intent VARCHAR(128) NOT NULL,

    -- Gita mappings (JSON arrays)
    related_chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_verses JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_themes JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Response template (for AI-free responses)
    response_template TEXT,

    -- Statistics
    frequency INTEGER NOT NULL DEFAULT 1,
    successful_responses INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes for user_query_patterns
CREATE INDEX IF NOT EXISTS idx_user_query_patterns_query_hash ON user_query_patterns(query_hash);
CREATE INDEX IF NOT EXISTS idx_user_query_patterns_intent ON user_query_patterns(intent);
CREATE INDEX IF NOT EXISTS idx_user_query_patterns_frequency ON user_query_patterns(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_user_query_patterns_deleted_at ON user_query_patterns(deleted_at);

-- GIN indexes for JSON array searching
CREATE INDEX IF NOT EXISTS idx_user_query_patterns_related_chapters ON user_query_patterns USING GIN (related_chapters);
CREATE INDEX IF NOT EXISTS idx_user_query_patterns_related_themes ON user_query_patterns USING GIN (related_themes);

-- =============================================================================
-- TABLE: content_source_registry
-- =============================================================================
-- Registry of content sources used by the KIAAN learning daemon.
-- Tracks source health, fetch history, and configuration.

CREATE TABLE IF NOT EXISTS content_source_registry (
    -- Primary key
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,

    -- Source identification
    name VARCHAR(256) NOT NULL UNIQUE,
    source_type content_source_type NOT NULL,
    url VARCHAR(1024),

    -- Configuration
    fetch_interval_seconds INTEGER NOT NULL DEFAULT 3600,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,

    -- Health tracking
    last_fetch_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    total_items_fetched INTEGER NOT NULL DEFAULT 0,

    -- Credibility (1-10 scale)
    credibility_rating INTEGER NOT NULL DEFAULT 5,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes for content_source_registry
CREATE INDEX IF NOT EXISTS idx_content_source_registry_name ON content_source_registry(name);
CREATE INDEX IF NOT EXISTS idx_content_source_registry_source_type ON content_source_registry(source_type);
CREATE INDEX IF NOT EXISTS idx_content_source_registry_enabled ON content_source_registry(enabled);
CREATE INDEX IF NOT EXISTS idx_content_source_registry_deleted_at ON content_source_registry(deleted_at);

-- =============================================================================
-- INSERT DEFAULT TRUSTED SOURCES
-- =============================================================================
-- Pre-register trusted Gita content sources

INSERT INTO content_source_registry (name, source_type, url, credibility_rating, metadata)
VALUES
    ('ISKCON Official', 'youtube', 'https://www.youtube.com/@iskaboradioTV', 10,
     '{"description": "Official ISKCON channel - highest credibility for Gita teachings"}'),
    ('Swami Mukundananda', 'youtube', 'https://www.youtube.com/@SwamiMukundananda', 9,
     '{"description": "Swami Mukundananda - authentic Gita commentary"}'),
    ('Gaur Gopal Das', 'youtube', 'https://www.youtube.com/@GaurGopalDas', 9,
     '{"description": "Gaur Gopal Das - modern Gita wisdom"}'),
    ('Swami Sarvapriyananda', 'youtube', 'https://www.youtube.com/@VedantaNewYork', 10,
     '{"description": "Vedanta Society - authentic Advaita Vedanta teachings"}'),
    ('IIT Kanpur Gita Supersite', 'web', 'https://www.gitasupersite.iitk.ac.in/', 10,
     '{"description": "IIT Kanpur - academic source for Gita verses"}'),
    ('Holy Bhagavad Gita', 'web', 'https://www.holy-bhagavad-gita.org/', 8,
     '{"description": "Online Gita resource with multiple translations"}'),
    ('Vedabase', 'web', 'https://vedabase.io/', 9,
     '{"description": "ISKCON Vedabase - comprehensive Gita resource"}')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================
-- Add table and column comments for documentation

COMMENT ON TABLE learned_wisdom IS 'Wisdom learned by KIAAN daemon from YouTube, Audio, Web sources. All content validated against 700+ Gita verses.';
COMMENT ON COLUMN learned_wisdom.content_hash IS 'SHA-256 hash for content deduplication';
COMMENT ON COLUMN learned_wisdom.chapter_refs IS 'Gita chapters referenced (1-18)';
COMMENT ON COLUMN learned_wisdom.verse_refs IS 'Specific verse references [[chapter, verse], ...]';
COMMENT ON COLUMN learned_wisdom.shad_ripu_tags IS 'Inner enemy tags: kama, krodha, lobha, moha, mada, matsarya';
COMMENT ON COLUMN learned_wisdom.quality_score IS 'Content quality score from validation (0.00-1.00)';
COMMENT ON COLUMN learned_wisdom.validation_status IS 'Validation state: pending, validated, rejected';

COMMENT ON TABLE user_query_patterns IS 'Query patterns learned from users for AI-free response generation';
COMMENT ON COLUMN user_query_patterns.response_template IS 'Pre-built response template for matching queries (AI-free)';

COMMENT ON TABLE content_source_registry IS 'Registry of content sources for KIAAN learning daemon with health tracking';
COMMENT ON COLUMN content_source_registry.credibility_rating IS 'Source credibility rating 1-10 (10 = most trusted like ISKCON)';
