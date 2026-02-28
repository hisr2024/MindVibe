-- Migration: Add gita_practical_wisdom table
-- Purpose: Stores practical modern-day applications of Bhagavad Gita principles
-- Auto-enriched by the Gita Wisdom Auto-Enricher service with 3-pass validation

CREATE TABLE IF NOT EXISTS gita_practical_wisdom (
    id SERIAL PRIMARY KEY,

    -- Verse reference (chapter.verse format, e.g. "2.47")
    verse_ref VARCHAR(16) NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,

    -- Modern-life domain this wisdom applies to
    life_domain VARCHAR(64) NOT NULL,

    -- The Gita principle distilled into actionable language
    principle_in_action TEXT NOT NULL,

    -- 5-10 minute practical exercise grounded in the verse
    micro_practice TEXT NOT NULL,

    -- 1-3 concrete behavioral steps (JSON array)
    action_steps JSON NOT NULL,

    -- Journaling/self-inquiry question rooted in the verse
    reflection_prompt TEXT NOT NULL,

    -- Real-life scenario showing the principle applied
    modern_scenario TEXT NOT NULL,

    -- What NOT to do — the pattern the verse warns against
    counter_pattern TEXT,

    -- Shad Ripu (six inner enemies) this wisdom addresses (JSON array)
    shad_ripu_tags JSON,

    -- Mental health domains this addresses (JSON array)
    wellness_domains JSON,

    -- Attribution to authentic Gita commentator/source
    source_attribution VARCHAR(512),

    -- Quality and usage tracking
    effectiveness_score FLOAT NOT NULL DEFAULT 0.5,
    times_served INTEGER NOT NULL DEFAULT 0,
    positive_feedback INTEGER NOT NULL DEFAULT 0,
    negative_feedback INTEGER NOT NULL DEFAULT 0,

    -- Source of this entry: "seed", "auto_enriched", "community", "ai_generated"
    enrichment_source VARCHAR(32) NOT NULL DEFAULT 'seed',

    -- Whether this has been validated by the Gita authenticity checker
    is_validated BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_gita_practical_wisdom_verse_ref
    ON gita_practical_wisdom (verse_ref);

CREATE INDEX IF NOT EXISTS idx_gita_practical_wisdom_chapter
    ON gita_practical_wisdom (chapter);

CREATE INDEX IF NOT EXISTS idx_gita_practical_wisdom_life_domain
    ON gita_practical_wisdom (life_domain);

-- Composite index for deduplication checks (verse + domain)
CREATE INDEX IF NOT EXISTS idx_gita_practical_wisdom_verse_domain
    ON gita_practical_wisdom (verse_ref, life_domain);
