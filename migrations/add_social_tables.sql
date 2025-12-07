CREATE TABLE IF NOT EXISTS user_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user ON user_connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_friend ON user_connections(friend_id, status);

CREATE TABLE IF NOT EXISTS group_meditations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_meditations_scheduled ON group_meditations(scheduled_at);

CREATE TABLE IF NOT EXISTS group_participants (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES group_meditations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_participants_user ON group_participants(user_id);

CREATE TABLE IF NOT EXISTS wisdom_shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gita_verse_id INTEGER NOT NULL REFERENCES gita_verses(id),
    share_text TEXT,
    visibility VARCHAR(20) CHECK (visibility IN ('public', 'friends', 'private')) DEFAULT 'friends',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wisdom_shares_user ON wisdom_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_shares_visibility ON wisdom_shares(visibility, created_at);

CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
