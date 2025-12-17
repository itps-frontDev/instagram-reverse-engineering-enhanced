-- =============================================
-- 2.1. 🤝 RELAZIONE FOLLOW (Social Graph)
-- =============================================
CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMP,
    
    -- Un profilo non può seguire se stesso
    CONSTRAINT chk_no_self_follow CHECK (follower_profile_id != following_profile_id),
    -- Coppia unica
    CONSTRAINT uq_follow_pair UNIQUE (follower_profile_id, following_profile_id)
);

-- Indici per query frequenti
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_profile_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_profile_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status) WHERE removed_at IS NULL;

COMMENT ON TABLE follows IS 'Relazioni follower/following';
