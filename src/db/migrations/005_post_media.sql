-- =============================================
-- 3.1. 🎥 MEDIA DEL POST (PostMedia)
-- =============================================
CREATE TABLE IF NOT EXISTS post_media (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL, -- 'image' o 'video'
    media_dimensions VARCHAR(20), -- es. "1080x1350"
    thumbnail_url TEXT, -- anteprima per video
    duration_seconds INTEGER, -- durata per video
    position INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Validazione tipo media
    CONSTRAINT chk_media_type CHECK (media_type IN ('image', 'video')),
    -- Posizione unica per post
    CONSTRAINT uq_post_media_position UNIQUE (post_id, position)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE post_media IS 'Media associati ai post (supporto caroselli)';
