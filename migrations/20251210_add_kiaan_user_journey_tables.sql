-- Migration: Add KIAAN user journey tracking tables
-- Date: 2024-12-10
-- Description: Creates tables for daily analysis, weekly assessments, sacred reflections, and user progress tracking

-- Create user_emotional_logs table for daily emotional check-ins
CREATE TABLE IF NOT EXISTS user_emotional_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    emotional_state VARCHAR(50) NOT NULL,
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
    triggers TEXT,
    notes TEXT,
    verse_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_emotional_logs_user ON user_emotional_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emotional_logs_date ON user_emotional_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_user_emotional_logs_state ON user_emotional_logs(emotional_state);

-- Create user_daily_analysis table for automated daily insights
CREATE TABLE IF NOT EXISTS user_daily_analysis (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    emotional_summary TEXT NOT NULL,
    recommended_verses JSONB NOT NULL DEFAULT '[]'::jsonb,
    insights JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    overall_mood_score INTEGER CHECK (overall_mood_score >= 1 AND overall_mood_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, analysis_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_analysis_user ON user_daily_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_analysis_date ON user_daily_analysis(analysis_date);

-- Create user_weekly_reflections table for sacred reflections
CREATE TABLE IF NOT EXISTS user_weekly_reflections (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    reflection_type VARCHAR(50) DEFAULT 'sacred_reflection',
    emotional_journey_summary TEXT,
    key_insights JSONB DEFAULT '[]'::jsonb,
    verses_explored JSONB DEFAULT '[]'::jsonb,
    milestones_achieved JSONB DEFAULT '[]'::jsonb,
    areas_for_growth JSONB DEFAULT '[]'::jsonb,
    gratitude_items JSONB DEFAULT '[]'::jsonb,
    overall_wellbeing_score INTEGER CHECK (overall_wellbeing_score >= 1 AND overall_wellbeing_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_user_weekly_reflections_user ON user_weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_reflections_week ON user_weekly_reflections(week_start_date);

-- Create user_assessments table for weekly structured assessments
CREATE TABLE IF NOT EXISTS user_assessments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'weekly',
    questions_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_scores JSONB DEFAULT '{}'::jsonb,
    recommended_focus_areas JSONB DEFAULT '[]'::jsonb,
    personalized_verses JSONB DEFAULT '[]'::jsonb,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_assessments_user ON user_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_date ON user_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_user_assessments_type ON user_assessments(assessment_type);

-- Create user_verses_bookmarked table for saved verses
CREATE TABLE IF NOT EXISTS user_verses_bookmarked (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    verse_id INTEGER NOT NULL,
    bookmark_reason VARCHAR(255),
    personal_notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verse_id) REFERENCES gita_verses(id) ON DELETE CASCADE,
    UNIQUE(user_id, verse_id)
);

CREATE INDEX IF NOT EXISTS idx_user_verses_bookmarked_user ON user_verses_bookmarked(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verses_bookmarked_verse ON user_verses_bookmarked(verse_id);

-- Create user_journey_progress table for tracking user's journey through KIAAN modules
CREATE TABLE IF NOT EXISTS user_journey_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    module_type VARCHAR(50) NOT NULL,
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100) DEFAULT 0,
    steps_completed JSONB DEFAULT '[]'::jsonb,
    total_steps INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'in_progress',
    achievements JSONB DEFAULT '[]'::jsonb,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, module_name)
);

CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user ON user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_module ON user_journey_progress(module_name);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_status ON user_journey_progress(status);

-- Add comments for documentation
COMMENT ON TABLE user_emotional_logs IS 'Daily emotional check-ins and logs for users';
COMMENT ON TABLE user_daily_analysis IS 'Automated daily mental health analysis and insights';
COMMENT ON TABLE user_weekly_reflections IS 'Weekly sacred reflections and deep-dive assessments';
COMMENT ON TABLE user_assessments IS 'Structured weekly mental health assessments with Gita wisdom';
COMMENT ON TABLE user_verses_bookmarked IS 'User-saved Gita verses with personal notes';
COMMENT ON TABLE user_journey_progress IS 'Track user progress through KIAAN modules and journeys';
