-- =============================================
-- 7. 🔔 NOTIFICHE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'follow_request', 'message', 'mention'
    target_type VARCHAR(20), -- 'post', 'comment', 'story', 'chat', 'profile'
    target_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Validazione tipo notifica
    CONSTRAINT chk_notification_type CHECK (
        type IN ('like', 'comment', 'follow', 'follow_request', 'message', 'mention', 'tag')
    )
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_profile_id) 
    WHERE is_read = FALSE;

COMMENT ON TABLE notifications IS 'Sistema notifiche';
