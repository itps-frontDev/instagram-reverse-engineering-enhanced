-- =============================================
-- 3.1. 🎥 MEDIA DEL POST (PostMedia)
-- =============================================

-- Tipo ENUM per il tipo di media
DO $$ BEGIN
    CREATE TYPE media_type_enum AS ENUM (
        'image',
        'video'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS post_media (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type media_type_enum NOT NULL,
    media_dimensions VARCHAR(20), -- es. "1080x1350"
    thumbnail_url TEXT, -- anteprima per video
    duration_seconds INTEGER, -- durata per video
    position INTEGER NOT NULL,  -- posizione nell'ordine dei media del post
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Posizione unica per post
    CONSTRAINT uq_post_media_position UNIQUE (post_id, position)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE post_media IS 'Media associati ai post (supporto caroselli)';
