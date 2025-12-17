-- =============================================
-- 3.2. 🏷️ TAG DEL POST (PostTag)
-- =============================================
CREATE TABLE IF NOT EXISTS post_tags (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tagged_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Coppia unica
    CONSTRAINT uq_post_tag UNIQUE (post_id, tagged_profile_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_profile ON post_tags(tagged_profile_id);

COMMENT ON TABLE post_tags IS 'Tag di profili nei post';
