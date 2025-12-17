-- =============================================
-- 3. 🖼️ POST (Contenuto Primario)
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    caption VARCHAR(2200),
    location VARCHAR(100),
    comments_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    likes_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMP
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_posts_profile ON posts(profile_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC) WHERE removed_at IS NULL;

COMMENT ON TABLE posts IS 'Post multimediali';
