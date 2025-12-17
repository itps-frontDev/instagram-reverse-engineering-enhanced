-- =============================================
-- 6. 💬 CHAT (Messaggistica Direct)
-- =============================================

-- 6.1. Conversazione
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(100), -- nome per chat di gruppo
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chats IS 'Conversazioni direct';
