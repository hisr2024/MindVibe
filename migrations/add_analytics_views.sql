-- MATERIALIZED VIEWS FOR ANALYTICS (READ-ONLY)

CREATE MATERIALIZED VIEW IF NOT EXISTS mood_analytics AS
SELECT 
    user_id,
    DATE(at) as date,
    AVG(score) as avg_mood,
    COUNT(*) as entries_count,
    STDDEV(score) as mood_volatility,
    MIN(score) as min_mood,
    MAX(score) as max_mood
FROM moods
WHERE deleted_at IS NULL
GROUP BY user_id, DATE(at);

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mood_analytics_user_date_unique ON mood_analytics(user_id, date);

CREATE MATERIALIZED VIEW IF NOT EXISTS usage_analytics AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT m.id) as total_moods,
    COUNT(DISTINCT j.id) as total_journals,
    COUNT(DISTINCT c.id) as total_chats,
    MAX(m.at) as last_mood_at,
    MAX(j.created_at) as last_journal_at
FROM users u
LEFT JOIN moods m ON u.id = m.user_id AND m.deleted_at IS NULL
LEFT JOIN journal_entries j ON u.id = j.user_id AND j.deleted_at IS NULL
LEFT JOIN chat_messages c ON u.id = c.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_analytics_user_unique ON usage_analytics(user_id);

-- Refresh function (run via cron)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mood_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY usage_analytics;
END;
$$ LANGUAGE plpgsql;
