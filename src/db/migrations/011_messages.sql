-- =============================================
-- 6.3. MESSAGGIO (Message)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_profile_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE messages IS 'Messaggi nelle chat';
