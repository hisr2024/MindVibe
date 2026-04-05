-- KarmaLytix: Sacred Reflections Analysis Engine
-- Analyzes journal metadata only (mood_labels, tag_labels, timestamps, frequency,
-- verse bookmarks, assessment responses, emotional logs) — never decrypted content.

CREATE TABLE IF NOT EXISTS karmalytix_reports (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    report_type VARCHAR(20) NOT NULL DEFAULT 'weekly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    karma_dimensions JSONB NOT NULL DEFAULT '{}',
    overall_karma_score INTEGER NOT NULL DEFAULT 0
        CHECK (overall_karma_score BETWEEN 0 AND 100),
    journal_metadata_summary JSONB NOT NULL DEFAULT '{}',
    kiaan_insight TEXT,
    recommended_verses JSONB NOT NULL DEFAULT '[]',
    patterns_detected JSONB NOT NULL DEFAULT '{}',
    comparison_to_previous JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_karmalytix_report
    ON karmalytix_reports(user_id, report_date, report_type);
CREATE INDEX IF NOT EXISTS idx_karmalytix_user_date
    ON karmalytix_reports(user_id, report_date DESC);

CREATE TABLE IF NOT EXISTS karma_patterns (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(30) NOT NULL,
    pattern_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    confidence_score FLOAT NOT NULL DEFAULT 0.0
        CHECK (confidence_score BETWEEN 0 AND 1),
    supporting_data JSONB NOT NULL DEFAULT '{}',
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    gita_verse_ref JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_karma_patterns_user_active
    ON karma_patterns(user_id, is_active);

CREATE TABLE IF NOT EXISTS karma_scores (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score_date DATE NOT NULL,
    emotional_balance INTEGER NOT NULL DEFAULT 0
        CHECK (emotional_balance BETWEEN 0 AND 100),
    spiritual_growth INTEGER NOT NULL DEFAULT 0
        CHECK (spiritual_growth BETWEEN 0 AND 100),
    consistency INTEGER NOT NULL DEFAULT 0
        CHECK (consistency BETWEEN 0 AND 100),
    self_awareness INTEGER NOT NULL DEFAULT 0
        CHECK (self_awareness BETWEEN 0 AND 100),
    wisdom_integration INTEGER NOT NULL DEFAULT 0
        CHECK (wisdom_integration BETWEEN 0 AND 100),
    overall_score INTEGER NOT NULL DEFAULT 0
        CHECK (overall_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_karma_score
    ON karma_scores(user_id, score_date);
CREATE INDEX IF NOT EXISTS idx_karma_scores_user_date
    ON karma_scores(user_id, score_date DESC);
