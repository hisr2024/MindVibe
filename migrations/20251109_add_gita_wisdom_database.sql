-- Migration: Add comprehensive Bhagavad Gita wisdom database tables
-- Date: 2025-11-09
-- Description: Creates tables for chapters, verses, sources, modern contexts, and keywords

-- Create gita_chapters table
CREATE TABLE IF NOT EXISTS gita_chapters (
    id SERIAL PRIMARY KEY,
    chapter_number INTEGER UNIQUE NOT NULL,
    sanskrit_name VARCHAR(256) NOT NULL,
    english_name VARCHAR(256) NOT NULL,
    verse_count INTEGER NOT NULL,
    themes JSONB NOT NULL DEFAULT '[]'::jsonb,
    mental_health_relevance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_gita_chapters_number ON gita_chapters(chapter_number);

-- Create gita_sources table
CREATE TABLE IF NOT EXISTS gita_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) UNIQUE NOT NULL,
    description TEXT,
    url VARCHAR(512),
    credibility_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gita_sources_name ON gita_sources(name);

-- Create new gita_verses table with enhanced schema (skip if already present)
CREATE TABLE IF NOT EXISTS gita_verses (
    id SERIAL PRIMARY KEY,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    sanskrit TEXT NOT NULL,
    transliteration TEXT,
    hindi TEXT NOT NULL,
    english TEXT NOT NULL,
    word_meanings JSONB,
    principle VARCHAR(256) NOT NULL,
    theme VARCHAR(256) NOT NULL,
    source_id INTEGER,
    embedding JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (chapter) REFERENCES gita_chapters(chapter_number) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES gita_sources(id) ON DELETE SET NULL
);

-- Ensure legacy tables get the new source_id column and constraint before indexing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'gita_verses'
          AND column_name = 'source_id'
    ) THEN
        ALTER TABLE gita_verses ADD COLUMN source_id INTEGER;
    END IF;

    -- Add the foreign key constraint if it is missing
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'gita_verses'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'source_id'
    ) THEN
        ALTER TABLE gita_verses
        ADD CONSTRAINT fk_gita_verses_source FOREIGN KEY (source_id)
            REFERENCES gita_sources(id) ON DELETE SET NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX IF NOT EXISTS idx_gita_verses_chapter ON gita_verses(chapter);
CREATE INDEX IF NOT EXISTS idx_gita_verses_verse ON gita_verses(verse);
CREATE INDEX IF NOT EXISTS idx_gita_verses_theme ON gita_verses(theme);
CREATE INDEX IF NOT EXISTS idx_gita_verses_source ON gita_verses(source_id);
CREATE INDEX IF NOT EXISTS idx_gita_verses_chapter_verse ON gita_verses(chapter, verse);

-- Create gita_modern_contexts table
CREATE TABLE IF NOT EXISTS gita_modern_contexts (
    id SERIAL PRIMARY KEY,
    verse_id INTEGER NOT NULL,
    application_area VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    examples JSONB,
    mental_health_benefits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (verse_id) REFERENCES gita_verses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gita_modern_contexts_verse ON gita_modern_contexts(verse_id);
CREATE INDEX IF NOT EXISTS idx_gita_modern_contexts_application ON gita_modern_contexts(application_area);

-- Create gita_keywords table
CREATE TABLE IF NOT EXISTS gita_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(128) UNIQUE NOT NULL,
    category VARCHAR(128),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gita_keywords_keyword ON gita_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_gita_keywords_category ON gita_keywords(category);

-- Create gita_verse_keywords junction table
CREATE TABLE IF NOT EXISTS gita_verse_keywords (
    id SERIAL PRIMARY KEY,
    verse_id INTEGER NOT NULL,
    keyword_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verse_id) REFERENCES gita_verses(id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES gita_keywords(id) ON DELETE CASCADE,
    UNIQUE(verse_id, keyword_id)
);

CREATE INDEX IF NOT EXISTS idx_gita_verse_keywords_verse ON gita_verse_keywords(verse_id);
CREATE INDEX IF NOT EXISTS idx_gita_verse_keywords_keyword ON gita_verse_keywords(keyword_id);

-- Add comments to tables for documentation
COMMENT ON TABLE gita_chapters IS 'Bhagavad Gita chapter metadata with Sanskrit and English names';
COMMENT ON TABLE gita_sources IS 'Authentic sources for Gita verses (Gita Press Gorakhpur, ISKCON, etc.)';
COMMENT ON TABLE gita_verses IS 'Complete Bhagavad Gita verses with comprehensive translations';
COMMENT ON TABLE gita_modern_contexts IS 'Modern applications and contemporary relevance of verses';
COMMENT ON TABLE gita_keywords IS 'Keywords and themes for verse categorization and search';
COMMENT ON TABLE gita_verse_keywords IS 'Many-to-many relationship between verses and keywords';
