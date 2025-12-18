-- =============================================
-- 5. ❤️ LIKE (Associazione Polimorfica)
-- =============================================

-- Tipo ENUM per content_type
DO $$ BEGIN
    CREATE TYPE content_type_enum AS ENUM (
        'post',
        'comment',
        'story'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_type content_type_enum NOT NULL,
    content_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMP,
    
    -- Un like per profilo per contenuto
    CONSTRAINT uq_like UNIQUE (profile_id, content_type, content_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_likes_profile ON likes(profile_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(content_type, content_id) WHERE removed_at IS NULL;

COMMENT ON TABLE likes IS 'Like polimorfici per post/commenti/storie';
