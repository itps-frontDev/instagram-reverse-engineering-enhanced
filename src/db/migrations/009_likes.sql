-- =============================================
-- 5. ❤️ LIKE (Associazione Polimorfica)
-- =============================================
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL, -- 'post', 'comment', 'story'
    content_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMP,
    
    -- Validazione content_type
    CONSTRAINT chk_content_type CHECK (content_type IN ('post', 'comment', 'story')),
    -- Un like per profilo per contenuto
    CONSTRAINT uq_like UNIQUE (profile_id, content_type, content_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_likes_profile ON likes(profile_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(content_type, content_id) WHERE removed_at IS NULL;

COMMENT ON TABLE likes IS 'Like polimorfici per post/commenti/storie';
