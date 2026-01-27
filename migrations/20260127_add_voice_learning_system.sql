-- Migration: Add Complete Voice Learning System
-- Description: Database tables for KIAAN self-improvement via sentiment analysis,
--              voice fingerprinting, A/B testing, preference learning, real-time
--              adaptation, intelligent caching, cross-session memory, and RLHF
-- Date: 2026-01-27
-- dialect: postgres-only

-- =========================================================================
-- 1. CREATE ENUM TYPES
-- =========================================================================

DO $$
BEGIN
    -- Emotion categories for sentiment analysis
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'emotion_category_enum') THEN
        CREATE TYPE emotion_category_enum AS ENUM (
            'joy', 'sadness', 'anger', 'fear', 'anxiety', 'peace',
            'hope', 'love', 'gratitude', 'compassion', 'confusion',
            'loneliness', 'neutral'
        );
    END IF;

    -- Voice provider types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voice_provider_enum') THEN
        CREATE TYPE voice_provider_enum AS ENUM (
            'google_studio', 'google_neural2', 'edge_tts', 'pyttsx3', 'sarvam'
        );
    END IF;

    -- Experiment status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experiment_status_enum') THEN
        CREATE TYPE experiment_status_enum AS ENUM (
            'draft', 'running', 'paused', 'completed', 'cancelled'
        );
    END IF;

    -- Feedback types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_type_enum') THEN
        CREATE TYPE feedback_type_enum AS ENUM (
            'rating', 'thumbs', 'text', 'completion', 'skip',
            'replay', 'follow_up', 'engagement', 'return'
        );
    END IF;

    -- Memory types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memory_type_enum') THEN
        CREATE TYPE memory_type_enum AS ENUM (
            'emotional_state', 'topic', 'preference', 'milestone',
            'concern', 'progress', 'relationship', 'insight'
        );
    END IF;

    -- Memory priority levels
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memory_priority_enum') THEN
        CREATE TYPE memory_priority_enum AS ENUM (
            'critical', 'high', 'medium', 'low'
        );
    END IF;

    -- Preference categories
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preference_category_enum') THEN
        CREATE TYPE preference_category_enum AS ENUM (
            'voice', 'response_style', 'content', 'timing', 'interaction'
        );
    END IF;
END
$$;


-- =========================================================================
-- 2. SENTIMENT ANALYSIS TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_sentiment_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64),

    -- Analysis results
    text_analyzed TEXT NOT NULL,
    text_hash VARCHAR(32),
    primary_emotion emotion_category_enum NOT NULL DEFAULT 'neutral',
    confidence NUMERIC(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    polarity NUMERIC(4, 3) NOT NULL CHECK (polarity >= -1 AND polarity <= 1),
    intensity NUMERIC(4, 3) NOT NULL CHECK (intensity >= 0 AND intensity <= 1),

    -- Secondary emotions (JSON array)
    secondary_emotions JSON,

    -- Model info
    model_type VARCHAR(50) NOT NULL DEFAULT 'transformer',
    processing_time_ms INTEGER,

    -- Context
    context_type VARCHAR(50) NOT NULL DEFAULT 'general',
    language VARCHAR(10) NOT NULL DEFAULT 'en',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for sentiment records
CREATE INDEX IF NOT EXISTS idx_sentiment_user_id ON voice_sentiment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_session ON voice_sentiment_records(session_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_user_session ON voice_sentiment_records(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_emotion ON voice_sentiment_records(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_sentiment_text_hash ON voice_sentiment_records(text_hash);
CREATE INDEX IF NOT EXISTS idx_sentiment_created ON voice_sentiment_records(created_at);


CREATE TABLE IF NOT EXISTS voice_emotion_trajectories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,

    -- Trajectory metrics
    trend NUMERIC(4, 3) DEFAULT 0.0,
    volatility NUMERIC(4, 3) DEFAULT 0.0,
    dominant_emotion emotion_category_enum DEFAULT 'neutral',
    reading_count INTEGER DEFAULT 0,

    -- Crisis detection
    crisis_indicators BOOLEAN DEFAULT FALSE,
    crisis_severity NUMERIC(3, 2),

    -- Polarity progression
    start_polarity NUMERIC(4, 3),
    end_polarity NUMERIC(4, 3),
    avg_intensity NUMERIC(4, 3),

    -- Timestamps
    session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for emotion trajectories
CREATE INDEX IF NOT EXISTS idx_trajectory_user_id ON voice_emotion_trajectories(user_id);
CREATE INDEX IF NOT EXISTS idx_trajectory_session ON voice_emotion_trajectories(session_id);
CREATE INDEX IF NOT EXISTS idx_trajectory_user_crisis ON voice_emotion_trajectories(user_id, crisis_indicators);


-- =========================================================================
-- 3. VOICE FINGERPRINT TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_fingerprints (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fingerprint_hash VARCHAR(32) UNIQUE NOT NULL,

    -- Voice configuration
    provider voice_provider_enum DEFAULT 'google_neural2',
    voice_name VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    voice_type VARCHAR(20) NOT NULL DEFAULT 'friendly',

    -- Prosody settings
    speaking_rate NUMERIC(3, 2) DEFAULT 0.95 CHECK (speaking_rate >= 0.5 AND speaking_rate <= 2.0),
    pitch NUMERIC(4, 2) DEFAULT 0.0 CHECK (pitch >= -20 AND pitch <= 20),
    volume NUMERIC(3, 2) DEFAULT 1.0,

    -- Emotion settings
    emotion_adaptation_enabled BOOLEAN DEFAULT TRUE,
    emotion_intensity_multiplier NUMERIC(3, 2) DEFAULT 1.0,

    -- Quality metrics
    quality_score NUMERIC(3, 2) DEFAULT 1.0,
    usage_count INTEGER DEFAULT 0,

    -- Fallback configuration (JSON array)
    fallback_voices JSON,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for voice fingerprints
CREATE INDEX IF NOT EXISTS idx_fingerprint_user ON voice_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_hash ON voice_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_fingerprint_user_language ON voice_fingerprints(user_id, language);
CREATE INDEX IF NOT EXISTS idx_fingerprint_provider ON voice_fingerprints(provider);


CREATE TABLE IF NOT EXISTS voice_interaction_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fingerprint_id VARCHAR(64) REFERENCES voice_fingerprints(id) ON DELETE SET NULL,

    -- Interaction details
    interaction_type VARCHAR(20) NOT NULL, -- rating, skip, replay, complete
    value NUMERIC(3, 2),

    -- Context
    context_type VARCHAR(50) DEFAULT 'general',
    content_length INTEGER,
    playback_duration_ms INTEGER,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for interaction logs
CREATE INDEX IF NOT EXISTS idx_interaction_user ON voice_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_fingerprint ON voice_interaction_logs(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_interaction_user_type ON voice_interaction_logs(user_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_interaction_created ON voice_interaction_logs(created_at);


-- =========================================================================
-- 4. A/B TESTING TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_ab_experiments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    experiment_type VARCHAR(50) NOT NULL,

    -- Status
    status experiment_status_enum DEFAULT 'draft',

    -- Targeting
    user_percentage NUMERIC(5, 2) DEFAULT 100.0,
    target_contexts JSON,
    target_languages JSON,

    -- Statistical settings
    min_sample_size INTEGER DEFAULT 100,
    confidence_level NUMERIC(3, 2) DEFAULT 0.95,

    -- Results
    winner_variant_id VARCHAR(64),
    is_significant BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for experiments
CREATE INDEX IF NOT EXISTS idx_experiment_status ON voice_ab_experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiment_type ON voice_ab_experiments(experiment_type);


CREATE TABLE IF NOT EXISTS voice_ab_variants (
    id VARCHAR(64) PRIMARY KEY,
    experiment_id VARCHAR(64) NOT NULL REFERENCES voice_ab_experiments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Configuration
    config JSON NOT NULL,
    weight NUMERIC(3, 2) DEFAULT 0.5,

    -- Metrics
    impressions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    total_rating NUMERIC(10, 2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0
);

-- Indexes for variants
CREATE INDEX IF NOT EXISTS idx_variant_experiment ON voice_ab_variants(experiment_id);


CREATE TABLE IF NOT EXISTS voice_ab_assignments (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experiment_id VARCHAR(64) NOT NULL REFERENCES voice_ab_experiments(id) ON DELETE CASCADE,
    variant_id VARCHAR(64) NOT NULL REFERENCES voice_ab_variants(id) ON DELETE CASCADE,

    -- Assignment timestamp
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Unique constraint
    CONSTRAINT uq_user_experiment UNIQUE (user_id, experiment_id)
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_assignment_user ON voice_ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_experiment ON voice_ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_variant ON voice_ab_assignments(variant_id);


-- =========================================================================
-- 5. USER PREFERENCE LEARNING TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_preference_signals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Signal details
    signal_type feedback_type_enum NOT NULL,
    category preference_category_enum DEFAULT 'voice',
    value NUMERIC(4, 3) NOT NULL,

    -- Context
    context JSON,
    session_id VARCHAR(64),

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for preference signals
CREATE INDEX IF NOT EXISTS idx_signal_user ON voice_preference_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_user_type ON voice_preference_signals(user_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_category ON voice_preference_signals(category);
CREATE INDEX IF NOT EXISTS idx_signal_created ON voice_preference_signals(created_at);


CREATE TABLE IF NOT EXISTS voice_learned_preferences (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Preference details
    preference_key VARCHAR(100) NOT NULL,
    preferred_value JSON NOT NULL,
    confidence NUMERIC(4, 3) DEFAULT 0.0,
    signal_count INTEGER DEFAULT 0,

    -- Decay settings
    decay_rate NUMERIC(4, 3) DEFAULT 0.95,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    CONSTRAINT uq_user_preference UNIQUE (user_id, preference_key)
);

-- Indexes for learned preferences
CREATE INDEX IF NOT EXISTS idx_preference_user ON voice_learned_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preference_user_key ON voice_learned_preferences(user_id, preference_key);


-- =========================================================================
-- 6. REAL-TIME ADAPTATION TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_adaptation_configs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,

    -- Configuration
    config_name VARCHAR(100) NOT NULL,
    emotion emotion_category_enum NOT NULL,

    -- Prosody settings
    speaking_rate NUMERIC(3, 2) DEFAULT 0.95,
    pitch NUMERIC(4, 2) DEFAULT 0.0,
    volume NUMERIC(3, 2) DEFAULT 1.0,
    emphasis VARCHAR(20) DEFAULT 'none',
    pause_before_ms INTEGER DEFAULT 0,
    pause_after_ms INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for adaptation configs
CREATE INDEX IF NOT EXISTS idx_adaptation_user ON voice_adaptation_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_user_emotion ON voice_adaptation_configs(user_id, emotion);


CREATE TABLE IF NOT EXISTS voice_adaptation_history (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,

    -- Adaptation details
    response_text_hash VARCHAR(32),
    sentence_count INTEGER,
    transition_count INTEGER,
    arc_type VARCHAR(20), -- ascending, descending, stable, volatile

    -- Emotions detected (JSON array)
    emotions_detected JSON,

    -- User feedback
    feedback_score NUMERIC(3, 2),

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for adaptation history
CREATE INDEX IF NOT EXISTS idx_adaptation_history_user ON voice_adaptation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_history_user_created ON voice_adaptation_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_adaptation_history_session ON voice_adaptation_history(session_id);


-- =========================================================================
-- 7. INTELLIGENT CACHE TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_cache_entries (
    id VARCHAR(64) PRIMARY KEY,
    cache_key VARCHAR(32) UNIQUE NOT NULL,
    content_hash VARCHAR(32),

    -- Content metadata
    content_type VARCHAR(20) DEFAULT 'audio',
    language VARCHAR(10) DEFAULT 'en',
    voice_type VARCHAR(20) DEFAULT 'friendly',
    context VARCHAR(50) DEFAULT 'general',

    -- Size and location
    size_bytes BIGINT DEFAULT 0,
    storage_path VARCHAR(500),

    -- Importance metrics
    frequency INTEGER DEFAULT 1,
    priority_score NUMERIC(6, 2) DEFAULT 0.0,

    -- Flags
    is_core_response BOOLEAN DEFAULT FALSE,
    is_verse BOOLEAN DEFAULT FALSE,
    is_meditation BOOLEAN DEFAULT FALSE,
    is_evictable BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cache entries
CREATE INDEX IF NOT EXISTS idx_cache_key ON voice_cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_content_hash ON voice_cache_entries(content_hash);
CREATE INDEX IF NOT EXISTS idx_cache_priority ON voice_cache_entries(priority_score);
CREATE INDEX IF NOT EXISTS idx_cache_last_accessed ON voice_cache_entries(last_accessed);
CREATE INDEX IF NOT EXISTS idx_cache_evictable ON voice_cache_entries(is_evictable);


CREATE TABLE IF NOT EXISTS voice_cache_predictions (
    id VARCHAR(64) PRIMARY KEY,

    -- Prediction details
    prediction_key VARCHAR(100) NOT NULL,
    probability NUMERIC(4, 3) NOT NULL,
    reason VARCHAR(200),
    context JSON,

    -- Outcome
    was_hit BOOLEAN,
    hit_within_ms INTEGER,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for cache predictions
CREATE INDEX IF NOT EXISTS idx_prediction_created ON voice_cache_predictions(created_at);


-- =========================================================================
-- 8. CROSS-SESSION CONTEXT TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_user_memories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Memory details
    memory_type memory_type_enum NOT NULL,
    priority memory_priority_enum DEFAULT 'medium',
    key VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    context JSON,

    -- Confidence and decay
    confidence NUMERIC(4, 3) DEFAULT 1.0,
    decay_rate NUMERIC(4, 3) DEFAULT 0.98,
    access_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user memories
CREATE INDEX IF NOT EXISTS idx_memory_user ON voice_user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_user_type ON voice_user_memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_user_key ON voice_user_memories(user_id, key);
CREATE INDEX IF NOT EXISTS idx_memory_priority ON voice_user_memories(priority);


CREATE TABLE IF NOT EXISTS voice_session_contexts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) UNIQUE NOT NULL,

    -- Session state
    current_mood VARCHAR(20) DEFAULT 'neutral',
    current_topic VARCHAR(50) DEFAULT 'general',
    current_intensity NUMERIC(3, 2) DEFAULT 0.5,
    messages_count INTEGER DEFAULT 0,

    -- Memories accessed (JSON array)
    active_memory_ids JSON,
    proactive_prompts JSON,

    -- Timestamps
    session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for session contexts
CREATE INDEX IF NOT EXISTS idx_session_user ON voice_session_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_session_id ON voice_session_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_session_start ON voice_session_contexts(session_start);


-- =========================================================================
-- 9. FEEDBACK AND LEARNING TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_feedback_signals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Feedback details
    feedback_type feedback_type_enum NOT NULL,
    value NUMERIC(4, 3) NOT NULL,

    -- Response context
    response_hash VARCHAR(32),
    query_hash VARCHAR(32),
    context_type VARCHAR(50) DEFAULT 'general',
    language VARCHAR(10) DEFAULT 'en',

    -- Metadata
    voice_settings JSON,
    response_length INTEGER DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for feedback signals
CREATE INDEX IF NOT EXISTS idx_feedback_user ON voice_feedback_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_type ON voice_feedback_signals(user_id, feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_response ON voice_feedback_signals(response_hash);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON voice_feedback_signals(created_at);


CREATE TABLE IF NOT EXISTS voice_reward_models (
    id VARCHAR(64) PRIMARY KEY,
    model_name VARCHAR(100) UNIQUE NOT NULL,
    context_type VARCHAR(50), -- NULL = global model

    -- Model parameters (JSON)
    weights JSON DEFAULT '{}',
    baseline_scores JSON DEFAULT '{}',
    training_samples INTEGER DEFAULT 0,

    -- Version info
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reward models
CREATE INDEX IF NOT EXISTS idx_reward_model_context ON voice_reward_models(context_type);


CREATE TABLE IF NOT EXISTS voice_improvement_actions (
    id VARCHAR(64) PRIMARY KEY,

    -- Action details
    category VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    priority NUMERIC(4, 3) DEFAULT 0.5,
    evidence TEXT,

    -- Impact
    affected_users INTEGER DEFAULT 0,
    potential_impact NUMERIC(4, 3) DEFAULT 0.0,
    actual_impact NUMERIC(4, 3),

    -- Configuration change (JSON)
    config_change JSON,

    -- Status: proposed, applied, reverted
    status VARCHAR(20) DEFAULT 'proposed',

    -- Timestamps
    proposed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE,
    measured_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for improvement actions
CREATE INDEX IF NOT EXISTS idx_improvement_category ON voice_improvement_actions(category);
CREATE INDEX IF NOT EXISTS idx_improvement_status ON voice_improvement_actions(status);


-- =========================================================================
-- 10. AGGREGATED ANALYTICS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS voice_learning_daily_stats (
    id VARCHAR(64) PRIMARY KEY,
    stats_date DATE UNIQUE NOT NULL,

    -- Sentiment stats
    total_sentiment_analyses INTEGER DEFAULT 0,
    avg_polarity NUMERIC(4, 3),
    crisis_incidents INTEGER DEFAULT 0,

    -- Fingerprint stats
    new_fingerprints INTEGER DEFAULT 0,
    active_fingerprints INTEGER DEFAULT 0,

    -- Experiment stats
    active_experiments INTEGER DEFAULT 0,
    experiment_impressions INTEGER DEFAULT 0,

    -- Preference stats
    preference_signals INTEGER DEFAULT 0,
    preferences_learned INTEGER DEFAULT 0,

    -- Adaptation stats
    adaptations_performed INTEGER DEFAULT 0,
    avg_adaptation_score NUMERIC(4, 3),

    -- Cache stats
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    prediction_accuracy NUMERIC(4, 3),

    -- Memory stats
    memories_created INTEGER DEFAULT 0,
    memories_accessed INTEGER DEFAULT 0,

    -- Feedback stats
    feedback_signals INTEGER DEFAULT 0,
    avg_feedback_score NUMERIC(4, 3),
    improvements_applied INTEGER DEFAULT 0,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for daily stats
CREATE INDEX IF NOT EXISTS idx_learning_stats_date ON voice_learning_daily_stats(stats_date);


-- =========================================================================
-- 11. COMMENTS FOR DOCUMENTATION
-- =========================================================================

COMMENT ON TABLE voice_sentiment_records IS 'Stores individual sentiment analysis results for user messages';
COMMENT ON TABLE voice_emotion_trajectories IS 'Tracks emotional trajectories across conversation sessions';
COMMENT ON TABLE voice_fingerprints IS 'Unique voice configurations per user for consistent TTS experience';
COMMENT ON TABLE voice_interaction_logs IS 'Logs voice interactions for preference learning';
COMMENT ON TABLE voice_ab_experiments IS 'A/B experiment configurations for voice response optimization';
COMMENT ON TABLE voice_ab_variants IS 'Variants within A/B experiments with metrics';
COMMENT ON TABLE voice_ab_assignments IS 'User assignments to experiment variants (deterministic)';
COMMENT ON TABLE voice_preference_signals IS 'Records preference signals from user behavior (implicit + explicit)';
COMMENT ON TABLE voice_learned_preferences IS 'Stores learned preferences per user with confidence scores';
COMMENT ON TABLE voice_adaptation_configs IS 'Real-time prosody adaptation configurations per emotion';
COMMENT ON TABLE voice_adaptation_history IS 'History of adaptations performed for learning';
COMMENT ON TABLE voice_cache_entries IS 'Intelligent cache metadata for audio responses';
COMMENT ON TABLE voice_cache_predictions IS 'Cache predictions for analysis and improvement';
COMMENT ON TABLE voice_user_memories IS 'Cross-session user memories for context persistence';
COMMENT ON TABLE voice_session_contexts IS 'Session context state for continuation';
COMMENT ON TABLE voice_feedback_signals IS 'Feedback signals for RLHF-style learning';
COMMENT ON TABLE voice_reward_models IS 'Reward model parameters for response scoring';
COMMENT ON TABLE voice_improvement_actions IS 'Tracks improvement actions identified and applied';
COMMENT ON TABLE voice_learning_daily_stats IS 'Daily aggregated statistics for voice learning system';

COMMENT ON COLUMN voice_sentiment_records.confidence IS 'Model confidence in emotion detection (0.0-1.0)';
COMMENT ON COLUMN voice_sentiment_records.polarity IS 'Sentiment polarity (-1.0 negative to 1.0 positive)';
COMMENT ON COLUMN voice_emotion_trajectories.crisis_indicators IS 'Flag for potential crisis detected in session';
COMMENT ON COLUMN voice_fingerprints.fingerprint_hash IS 'Unique hash for voice configuration deduplication';
COMMENT ON COLUMN voice_ab_experiments.user_percentage IS 'Percentage of users included in experiment';
COMMENT ON COLUMN voice_learned_preferences.decay_rate IS 'Rate at which preference confidence decays over time';
COMMENT ON COLUMN voice_user_memories.decay_rate IS 'Rate at which memory confidence decays over time';
COMMENT ON COLUMN voice_cache_entries.priority_score IS 'Score for cache eviction priority (higher = keep longer)';
COMMENT ON COLUMN voice_reward_models.weights IS 'JSON of response attribute weights for scoring';
