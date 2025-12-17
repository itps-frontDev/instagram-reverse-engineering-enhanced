-- =============================================
-- 6.2. PARTECIPANTI ALLA CHAT (ChatParticipant)
-- =============================================
CREATE TABLE IF NOT EXISTS chat_participants (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_read_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP,
    
    -- Partecipante unico per chat
    CONSTRAINT uq_chat_participant UNIQUE (chat_id, profile_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_participants_profile ON chat_participants(profile_id) WHERE left_at IS NULL;

COMMENT ON TABLE chat_participants IS 'Partecipanti alle chat';
