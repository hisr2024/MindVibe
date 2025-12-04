DO $$ BEGIN
    CREATE TYPE achievementcategory AS ENUM ('mood', 'journal', 'chat', 'streak', 'wellness');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE achievementrarity AS ENUM ('common', 'rare', 'epic', 'legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE unlockabletype AS ENUM ('theme', 'prompt', 'badge', 'boost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    key VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    category achievementcategory NOT NULL,
    target_value INTEGER NOT NULL DEFAULT 1,
    rarity achievementrarity NOT NULL DEFAULT 'common',
    badge_icon VARCHAR(32),
    reward_hint VARCHAR(256),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    metadata_json JSONB,
    deleted_at TIMESTAMPTZ,
    UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS unlockables (
    id SERIAL PRIMARY KEY,
    key VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    kind unlockabletype NOT NULL,
    rarity achievementrarity NOT NULL DEFAULT 'common',
    required_achievement_id INTEGER REFERENCES achievements(id) ON DELETE SET NULL,
    reward_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_unlockables (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    unlockable_id INTEGER REFERENCES unlockables(id) ON DELETE CASCADE,
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    source VARCHAR(128),
    metadata_json JSONB,
    deleted_at TIMESTAMPTZ,
    UNIQUE (user_id, unlockable_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_mood_entries INTEGER NOT NULL DEFAULT 0,
    total_journals INTEGER NOT NULL DEFAULT 0,
    total_chat_sessions INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_stage VARCHAR(64),
    last_awarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_unlockables_user ON user_unlockables (user_id);

INSERT INTO achievements (key, name, description, category, target_value, rarity, badge_icon, reward_hint)
VALUES
    ('first_journal', 'Reflection Seed', 'Write your first private journal entry to plant your tree.', 'journal', 1, 'common', '📝', 'Unlocks the Dawnlight badge'),
    ('journal_10', 'Roots of Reflection', 'Complete 10 journal entries to deepen your roots.', 'journal', 10, 'rare', '🌱', 'Unlocks the Amber Grove theme'),
    ('mood_week', 'Mood Streak', 'Log your mood seven days in a row.', 'streak', 7, 'rare', '🔥', 'Unlocks a streak badge'),
    ('chat_explorer', 'KIAAN Explorer', 'Complete 10 guided chats with KIAAN.', 'chat', 10, 'common', '💬', 'Unlocks a prompt booster'),
    ('mood_checkins', 'Feelings Cartographer', 'Log 25 moods to map your feelings.', 'mood', 25, 'epic', '📍', 'Unlocks the Aurora canopy')
ON CONFLICT (key) DO NOTHING;

INSERT INTO unlockables (key, name, description, kind, rarity, required_achievement_id, reward_data)
SELECT 'dawnlight_badge', 'Dawnlight Badge', 'A soft sunrise badge for your first reflection.', 'badge', 'common', a.id, jsonb_build_object('color', '#f97316')
FROM achievements a WHERE a.key = 'first_journal'
ON CONFLICT (key) DO NOTHING;

INSERT INTO unlockables (key, name, description, kind, rarity, required_achievement_id, reward_data)
SELECT 'amber_grove_theme', 'Amber Grove Theme', 'A warm theme inspired by mindful journaling.', 'theme', 'rare', a.id, jsonb_build_object('gradient', 'from-orange-400 via-amber-300 to-amber-500')
FROM achievements a WHERE a.key = 'journal_10'
ON CONFLICT (key) DO NOTHING;

INSERT INTO unlockables (key, name, description, kind, rarity, required_achievement_id, reward_data)
SELECT 'streak_flame', 'Streak Flame', 'Celebrate your seven day streak with a glowing leaf.', 'badge', 'rare', a.id, jsonb_build_object('accent', '#fb923c')
FROM achievements a WHERE a.key = 'mood_week'
ON CONFLICT (key) DO NOTHING;
