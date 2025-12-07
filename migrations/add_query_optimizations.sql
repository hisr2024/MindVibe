-- Optimized functions

CREATE OR REPLACE FUNCTION get_mood_trend(p_user_id VARCHAR(255), p_days INTEGER DEFAULT 7)
RETURNS TABLE(date DATE, avg_mood NUMERIC, entry_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(at),
        ROUND(AVG(score)::numeric, 2),
        COUNT(*)
    FROM moods
    WHERE user_id = p_user_id 
    AND at >= CURRENT_DATE - p_days * INTERVAL '1 day'
    GROUP BY DATE(at)
    ORDER BY DATE(at) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_cache AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT m.id) as total_moods,
    COUNT(DISTINCT j.id) as total_journals,
    ROUND(AVG(m.score)::numeric, 2) as avg_mood_score
FROM users u
LEFT JOIN moods m ON u.id = m.user_id
LEFT JOIN journal_entries j ON u.id = j.user_id
GROUP BY u.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_cache_user ON user_dashboard_cache(user_id);
