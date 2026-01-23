-- Migration: Add Complete KIAAN Voice System
-- Description: Voice preferences, conversation history, analytics, and enhanced TTS tracking
-- Date: 2026-01-23

-- =========================================================================
-- 1. User Voice Preferences Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS user_voice_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Voice settings
    voice_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_play_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    wake_word_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    custom_wake_word VARCHAR(64) DEFAULT 'Hey KIAAN',

    -- Voice characteristics
    preferred_voice_gender VARCHAR(16) NOT NULL DEFAULT 'female' CHECK (preferred_voice_gender IN ('male', 'female', 'neutral')),
    preferred_voice_type VARCHAR(32) NOT NULL DEFAULT 'friendly' CHECK (preferred_voice_type IN ('calm', 'wisdom', 'friendly')),
    speaking_rate NUMERIC(3, 2) NOT NULL DEFAULT 0.90 CHECK (speaking_rate >= 0.5 AND speaking_rate <= 2.0),
    voice_pitch NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (voice_pitch >= -20.0 AND voice_pitch <= 20.0),

    -- Language settings
    preferred_language VARCHAR(8) NOT NULL DEFAULT 'en',
    secondary_language VARCHAR(8),
    auto_detect_language BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audio quality
    audio_quality VARCHAR(16) NOT NULL DEFAULT 'high' CHECK (audio_quality IN ('low', 'medium', 'high', 'ultra')),

    -- Offline settings
    offline_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    offline_verses_downloaded INTEGER NOT NULL DEFAULT 0,
    last_offline_sync TIMESTAMP WITH TIME ZONE,

    -- Enhancement settings
    binaural_beats_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    binaural_frequency VARCHAR(16) DEFAULT 'alpha',
    spatial_audio_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    breathing_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ambient_sounds_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ambient_sound_type VARCHAR(32) DEFAULT 'nature',

    -- Accessibility
    high_contrast_mode BOOLEAN NOT NULL DEFAULT FALSE,
    larger_text BOOLEAN NOT NULL DEFAULT FALSE,
    haptic_feedback BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,

    -- Unique constraint
    CONSTRAINT uq_user_voice_preferences UNIQUE (user_id)
);

-- Indexes for voice preferences
CREATE INDEX IF NOT EXISTS idx_voice_preferences_user_id ON user_voice_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_preferences_language ON user_voice_preferences(preferred_language);

-- =========================================================================
-- 2. Voice Conversation History Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_conversations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,

    -- Conversation details
    user_query TEXT NOT NULL,
    kiaan_response TEXT NOT NULL,
    detected_intent VARCHAR(64),
    detected_emotion VARCHAR(32),
    confidence_score NUMERIC(4, 3) DEFAULT 0.0,

    -- Context
    concern_category VARCHAR(64),
    mood_at_time VARCHAR(32),

    -- Related verses
    verse_ids JSON,
    verses_helpful BOOLEAN,

    -- Performance metrics
    speech_to_text_ms INTEGER,
    ai_processing_ms INTEGER,
    text_to_speech_ms INTEGER,
    total_latency_ms INTEGER,

    -- Audio metadata
    user_audio_duration_ms INTEGER,
    response_audio_duration_ms INTEGER,
    language_used VARCHAR(8) NOT NULL DEFAULT 'en',
    voice_type_used VARCHAR(32) DEFAULT 'friendly',

    -- User feedback
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    was_helpful BOOLEAN,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for conversation history
CREATE INDEX IF NOT EXISTS idx_voice_conversations_user_id ON voice_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_session ON voice_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_created ON voice_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_concern ON voice_conversations(concern_category);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_language ON voice_conversations(language_used);

-- =========================================================================
-- 3. Voice Analytics Table (Aggregated Daily)
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_analytics (
    id SERIAL PRIMARY KEY,
    analytics_date DATE NOT NULL,

    -- Usage metrics
    total_voice_sessions INTEGER NOT NULL DEFAULT 0,
    total_voice_queries INTEGER NOT NULL DEFAULT 0,
    unique_voice_users INTEGER NOT NULL DEFAULT 0,

    -- Performance metrics
    avg_speech_to_text_ms INTEGER,
    avg_ai_processing_ms INTEGER,
    avg_text_to_speech_ms INTEGER,
    avg_total_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,

    -- Quality metrics
    avg_confidence_score NUMERIC(4, 3),
    avg_user_rating NUMERIC(3, 2),
    positive_feedback_count INTEGER DEFAULT 0,
    negative_feedback_count INTEGER DEFAULT 0,

    -- Language distribution
    language_distribution JSON,

    -- Voice type distribution
    voice_type_distribution JSON,

    -- Concern category distribution
    concern_distribution JSON,

    -- Emotion distribution
    emotion_distribution JSON,

    -- Error metrics
    error_count INTEGER DEFAULT 0,
    timeout_count INTEGER DEFAULT 0,
    fallback_response_count INTEGER DEFAULT 0,

    -- TTS usage and cost tracking
    tts_characters_synthesized BIGINT DEFAULT 0,
    tts_audio_minutes_generated NUMERIC(10, 2) DEFAULT 0,
    tts_cache_hit_rate NUMERIC(5, 4) DEFAULT 0,
    estimated_tts_cost_usd NUMERIC(10, 4) DEFAULT 0,

    -- Enhancement usage
    binaural_beats_sessions INTEGER DEFAULT 0,
    spatial_audio_sessions INTEGER DEFAULT 0,
    breathing_sync_sessions INTEGER DEFAULT 0,

    -- Wake word stats
    wake_word_activations INTEGER DEFAULT 0,
    wake_word_false_positives INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,

    -- Unique constraint on date
    CONSTRAINT uq_voice_analytics_date UNIQUE (analytics_date)
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_voice_analytics_date ON voice_analytics(analytics_date);

-- =========================================================================
-- 4. Voice Quality Metrics Table (Per-request tracking)
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_quality_metrics (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES voice_conversations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,

    -- Speech-to-text quality
    stt_provider VARCHAR(32) DEFAULT 'web_speech_api',
    stt_confidence NUMERIC(4, 3),
    stt_alternative_count INTEGER,
    stt_word_count INTEGER,
    stt_language_detected VARCHAR(8),

    -- TTS quality
    tts_provider VARCHAR(32) DEFAULT 'google_cloud',
    tts_voice_used VARCHAR(64),
    tts_audio_format VARCHAR(16) DEFAULT 'mp3',
    tts_sample_rate INTEGER DEFAULT 24000,
    tts_bitrate INTEGER,
    tts_character_count INTEGER,

    -- Audio characteristics
    audio_duration_ms INTEGER,
    audio_size_bytes INTEGER,

    -- Cache status
    tts_cache_hit BOOLEAN DEFAULT FALSE,
    cache_key VARCHAR(128),

    -- Network metrics
    request_time_ms INTEGER,
    download_time_ms INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for quality metrics
CREATE INDEX IF NOT EXISTS idx_voice_quality_conversation ON voice_quality_metrics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_quality_user ON voice_quality_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_quality_created ON voice_quality_metrics(created_at);

-- =========================================================================
-- 5. Voice Wake Word Events Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_wake_word_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64),

    -- Event details
    wake_word_detected VARCHAR(64) NOT NULL,
    detection_confidence NUMERIC(4, 3),
    is_valid_activation BOOLEAN DEFAULT TRUE,

    -- Audio context
    ambient_noise_level NUMERIC(5, 2),
    audio_energy_level NUMERIC(5, 2),

    -- Device info
    device_type VARCHAR(32),
    browser_type VARCHAR(64),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for wake word events
CREATE INDEX IF NOT EXISTS idx_wake_word_user ON voice_wake_word_events(user_id);
CREATE INDEX IF NOT EXISTS idx_wake_word_created ON voice_wake_word_events(created_at);

-- =========================================================================
-- 6. Voice Enhancement Sessions Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_enhancement_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session details
    session_type VARCHAR(32) NOT NULL CHECK (session_type IN ('binaural', 'spatial', 'breathing', 'ambient', 'sleep', 'meditation')),

    -- Enhancement settings
    enhancement_config JSON NOT NULL,

    -- Binaural specific
    binaural_frequency VARCHAR(16),
    binaural_base_frequency INTEGER,

    -- Breathing specific
    breathing_pattern VARCHAR(32),
    breath_count INTEGER,

    -- Ambient specific
    ambient_type VARCHAR(32),
    ambient_volume NUMERIC(3, 2),

    -- Session metrics
    duration_seconds INTEGER,
    completed BOOLEAN DEFAULT FALSE,

    -- User feedback
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for enhancement sessions
CREATE INDEX IF NOT EXISTS idx_enhancement_user ON voice_enhancement_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_type ON voice_enhancement_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_enhancement_started ON voice_enhancement_sessions(started_at);

-- =========================================================================
-- 7. Daily Check-in Voice Data
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_daily_checkins (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Voice check-in data
    morning_mood VARCHAR(32),
    evening_mood VARCHAR(32),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),

    -- Voice-detected emotions
    detected_emotions JSON,
    voice_sentiment_score NUMERIC(4, 3),

    -- Affirmations
    affirmation_played TEXT,
    affirmation_resonated BOOLEAN,

    -- Timestamps
    morning_checkin_at TIMESTAMP WITH TIME ZONE,
    evening_checkin_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Unique per user per day
    CONSTRAINT uq_voice_checkin_user_date UNIQUE (user_id, checkin_date)
);

-- Indexes for check-ins
CREATE INDEX IF NOT EXISTS idx_voice_checkin_user ON voice_daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_checkin_date ON voice_daily_checkins(checkin_date);

-- =========================================================================
-- Comments for Documentation
-- =========================================================================

COMMENT ON TABLE user_voice_preferences IS 'User voice preferences and settings for KIAAN voice assistant';
COMMENT ON TABLE voice_conversations IS 'Complete voice conversation history with KIAAN';
COMMENT ON TABLE voice_analytics IS 'Daily aggregated voice analytics for admin dashboard';
COMMENT ON TABLE voice_quality_metrics IS 'Per-request quality metrics for TTS and STT';
COMMENT ON TABLE voice_wake_word_events IS 'Wake word detection events and accuracy tracking';
COMMENT ON TABLE voice_enhancement_sessions IS 'Voice enhancement sessions (binaural, spatial audio, etc.)';
COMMENT ON TABLE voice_daily_checkins IS 'Voice-based daily wellness check-ins';

COMMENT ON COLUMN user_voice_preferences.speaking_rate IS 'TTS speaking rate multiplier (0.5-2.0, default 0.9 for natural pace)';
COMMENT ON COLUMN user_voice_preferences.voice_pitch IS 'Voice pitch adjustment (-20 to +20, default 0)';
COMMENT ON COLUMN voice_conversations.confidence_score IS 'AI confidence in understanding user intent (0.0-1.0)';
COMMENT ON COLUMN voice_analytics.tts_cache_hit_rate IS 'Percentage of TTS requests served from cache (0.0-1.0)';
COMMENT ON COLUMN voice_analytics.estimated_tts_cost_usd IS 'Estimated Google Cloud TTS cost in USD';
