-- =============================================
-- 7. 🔔 NOTIFICHE
-- =============================================

-- Tipo ENUM per tipo di notifica
DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM (
        'like',
        'comment',
        'follow',
        'follow_request',
        'message',
        'mention',
        'tag'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo ENUM per target
DO $$ BEGIN
    CREATE TYPE target_type_enum AS ENUM ('post', 'comment', 'story', 'chat', 'profile');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
    type notification_type_enum NOT NULL,
    target_type target_type_enum,
    target_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_profile_id) 
    WHERE is_read = FALSE;

COMMENT ON TABLE notifications IS 'Sistema notifiche';
