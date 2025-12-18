-- =============================================
-- 4. ⏳ STORIE (Story)
-- =============================================

CREATE TYPE IF NOT EXISTS media_type_enum AS ENUM (
    'image',
    'video'
);

CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type media_type_enum NOT NULL,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    removed_at TIMESTAMP
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_stories_profile ON stories(profile_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(profile_id, created_at DESC) 
    WHERE removed_at IS NULL;

COMMENT ON TABLE stories IS 'Storie temporanee (24h)';
