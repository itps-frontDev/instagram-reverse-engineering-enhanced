-- =============================================
-- 📱 INSTAGRAM CLONE - DATABASE SCHEMA
-- =============================================
-- SQLite Database Schema
-- Version: 1.0.0
-- Last Updated: 2025-12-23
-- =============================================

PRAGMA foreign_keys = ON;

-- =============================================
-- 1. 👥 USERS (Autenticazione)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number VARCHAR(15) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    date_of_birth DATETIME NOT NULL,
    is_email_verified INTEGER NOT NULL DEFAULT 0,
    is_phone_verified INTEGER NOT NULL DEFAULT 0,
    last_login_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME, -- soft delete
    
    CHECK (phone_number IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number) WHERE phone_number IS NOT NULL AND deleted_at IS NULL;

-- =============================================
-- 2. 👤 PROFILES (Informazioni Sociali)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    username VARCHAR(32) NOT NULL UNIQUE COLLATE NOCASE,
    full_name VARCHAR(64),
    profile_image_url TEXT,
    bio VARCHAR(150),
    website_url TEXT,
    gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'prefer_not_to_say', 'custom')),
    custom_gender TEXT,
    is_private INTEGER NOT NULL DEFAULT 0,
    is_verified INTEGER NOT NULL DEFAULT 0,
    followers_count INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    posts_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME, -- soft delete
    
    CHECK ((gender = 'custom' AND custom_gender IS NOT NULL) OR (gender != 'custom' AND custom_gender IS NULL)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id) WHERE deleted_at IS NULL;

-- =============================================
-- 3. 🤝 FOLLOWS (Social Graph)
-- =============================================
CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_profile_id INTEGER NOT NULL,
    following_profile_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME,

    CHECK (follower_profile_id != following_profile_id),
    FOREIGN KEY (follower_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (following_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Unique solo sui follow attivi, permette storico di follow/unfollow
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_unique_active ON follows(follower_profile_id, following_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_profile_id) WHERE deleted_at IS NULL AND status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_profile_id) WHERE deleted_at IS NULL AND status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_follows_pending ON follows(following_profile_id) WHERE deleted_at IS NULL AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_follows_rejected ON follows(following_profile_id) WHERE deleted_at IS NULL AND status = 'rejected';

-- =============================================
-- 4. 🖼️ POSTS (Contenuto Primario)
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    caption VARCHAR(2200),
    location TEXT,
    is_comments_disabled INTEGER NOT NULL DEFAULT 0,
    is_likes_hidden INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME, -- soft delete
    
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_profile ON posts(profile_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts(created_at DESC) WHERE deleted_at IS NULL;

-- =============================================
-- 5. 🎥 POST_MEDIA (Media del Post - Carousel)
-- =============================================
CREATE TABLE IF NOT EXISTS post_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    duration_seconds REAL, -- per i video
    position INTEGER NOT NULL, -- ordine nel carousel
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE (post_id, position)
);

CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id, position) WHERE deleted_at IS NULL;


-- =============================================
-- 6. 🏷️ POST_TAGS (Tag di Persone nei Post)
-- =============================================
CREATE TABLE IF NOT EXISTS post_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    post_media_id INTEGER,
    tagged_profile_id INTEGER NOT NULL,
    x_position REAL, -- posizione del tag nell'immagine (0.0 - 1.0)
    y_position REAL, -- posizione del tag nell'immagine (0.0 - 1.0)
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (post_media_id) REFERENCES post_media(id) ON DELETE CASCADE,
    FOREIGN KEY (tagged_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE (post_id, post_media_id, tagged_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_profile ON post_tags(tagged_profile_id);

-- =============================================
-- 7. 💬 COMMENTS (Commenti sui Post)
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    parent_id INTEGER, -- per risposte ai commenti
    text VARCHAR(2200) NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME,
    deleted_at DATETIME, -- soft delete
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_profile ON comments(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

-- =============================================
-- 8. ⏳ STORIES (Storie - contenuto effimero 24h)
-- =============================================
CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    duration_seconds REAL,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    expires_at DATETIME NOT NULL,
    deleted_at DATETIME, -- soft delete
    
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stories_profile ON stories(profile_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(profile_id, expires_at DESC) WHERE deleted_at IS NULL AND expires_at > datetime('now');

-- =============================================
-- 9. 👁️ STORY_VIEWS (Visualizzazioni Storie)
-- =============================================
CREATE TABLE IF NOT EXISTS story_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL,
    viewer_profile_id INTEGER NOT NULL,
    viewed_at DATETIME NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE (story_id, viewer_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON story_views(viewer_profile_id);

-- =============================================
-- 10. ❤️ LIKES (Like su Post, Commenti, Storie)
-- =============================================
CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    likeable_type TEXT NOT NULL CHECK (likeable_type IN ('post', 'comment', 'story')),
    likeable_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME, -- storico like rimossi
    
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Unique solo sui like attivi, permette storico di like/unlike
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique_active ON likes(profile_id, likeable_type, likeable_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_likes_profile ON likes(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(likeable_type, likeable_id) WHERE deleted_at IS NULL;

-- =============================================
-- 11. 🔖 SAVED_POSTS (Post Salvati)
-- =============================================
CREATE TABLE IF NOT EXISTS saved_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME, -- soft delete per rimuovere dai salvati

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Unique solo sui post salvati attivi
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_posts_unique_active ON saved_posts(profile_id, post_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_posts_profile ON saved_posts(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id) WHERE deleted_at IS NULL;

-- =============================================
-- 12. 💬 CHATS (Conversazioni Direct)
-- =============================================
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_group INTEGER NOT NULL DEFAULT 0,
    name VARCHAR(100),
    created_by_profile_id INTEGER,
    last_message_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    deleted_at DATETIME, -- soft delete
    
    FOREIGN KEY (created_by_profile_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC) WHERE deleted_at IS NULL;

-- =============================================
-- 13. 👥 CHAT_PARTICIPANTS (Partecipanti alle Chat)
-- =============================================
CREATE TABLE IF NOT EXISTS chat_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    is_muted INTEGER NOT NULL DEFAULT 0,
    last_read_message_id INTEGER,
    joined_at DATETIME NOT NULL DEFAULT (datetime('now')),
    left_at DATETIME, -- NULL = ancora nella chat
    
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Unique solo sui partecipanti attivi, permette storico di entrate/uscite
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_participants_unique_active ON chat_participants(chat_id, profile_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_participants_profile ON chat_participants(profile_id) WHERE left_at IS NULL;

-- =============================================
-- 14. 💬 MESSAGES (Messaggi nelle Chat)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    sender_profile_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME,
    deleted_at DATETIME, -- soft delete
    
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_profile_id) WHERE deleted_at IS NULL;

-- =============================================
-- 15. 🔔 NOTIFICATIONS (Notifiche)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_profile_id INTEGER NOT NULL,
    sender_profile_id INTEGER,
    type TEXT NOT NULL CHECK (type IN (
        'like_post', 'like_comment', 'like_story',
        'comment', 'comment_reply',
        'follow', 'follow_request', 'follow_accepted',
        'mention_post', 'mention_comment', 'mention_story',
        'tag', 'message', 'story_view'
    )),
    reference_type TEXT CHECK (reference_type IS NULL OR reference_type IN ('post', 'comment', 'story', 'chat', 'profile')),
    reference_id INTEGER,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (recipient_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_profile_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_profile_id, is_read) WHERE is_read = 0;