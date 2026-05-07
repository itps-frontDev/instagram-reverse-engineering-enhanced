--liquibase formatted sql

-- ============================================================
-- Aggiunge public_id UUID alle entità principali.
--
-- Pattern: BIGINT interno per JOIN veloci, UUID esposto
-- nelle API REST e usato per comunicazione inter-servizio.
--
-- gen_random_uuid() è built-in da PostgreSQL 13+.
-- Ogni riga esistente riceve un UUID generato automaticamente.
--
-- Tabelle coinvolte:
--   users, profiles, posts, comments, stories, chats, messages
--
-- Escluse deliberatamente (tabelle di relazione, non entità):
--   follows, post_likes, comment_likes, story_likes,
--   saved_posts, story_views, chat_participants, notifications
-- ============================================================

--changeset cbiallo:022-uuid-users
ALTER TABLE users ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
--rollback ALTER TABLE users DROP COLUMN public_id;

--changeset cbiallo:023-uuid-profiles
ALTER TABLE profiles ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
--rollback ALTER TABLE profiles DROP COLUMN public_id;

--changeset cbiallo:024-uuid-posts
ALTER TABLE posts ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
--rollback ALTER TABLE posts DROP COLUMN public_id;

--changeset cbiallo:025-uuid-comments
ALTER TABLE comments ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
--rollback ALTER TABLE comments DROP COLUMN public_id;

--changeset cbiallo:026-uuid-stories
ALTER TABLE stories ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
--rollback ALTER TABLE stories DROP COLUMN public_id;

--changeset cbiallo:027-uuid-chats
ALTER TABLE chats ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
--rollback ALTER TABLE chats DROP COLUMN public_id;

--changeset cbiallo:028-uuid-messages
ALTER TABLE messages ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
--rollback ALTER TABLE messages DROP COLUMN public_id;
