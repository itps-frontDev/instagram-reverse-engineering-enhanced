-- =============================================
-- TRIGGER PER updated_at AUTOMATICO
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger a tutte le tabelle con updated_at
DO $$
BEGIN
    -- Users
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Posts
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at') THEN
        CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Post Media
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_media_updated_at') THEN
        CREATE TRIGGER update_post_media_updated_at BEFORE UPDATE ON post_media
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Chats
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chats_updated_at') THEN
        CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- TRIGGER PER CONTATORI DENORMALIZZATI
-- =============================================

-- Trigger per followers_count e following_count
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'accepted' AND NEW.removed_at IS NULL THEN
        -- Incrementa following_count per chi segue
        UPDATE profiles SET following_count = following_count + 1 
        WHERE id = NEW.follower_profile_id;
        -- Incrementa followers_count per chi viene seguito
        UPDATE profiles SET followers_count = followers_count + 1 
        WHERE id = NEW.following_profile_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Se passa da non-accepted a accepted
        IF OLD.status != 'accepted' AND NEW.status = 'accepted' AND NEW.removed_at IS NULL THEN
            UPDATE profiles SET following_count = following_count + 1 
            WHERE id = NEW.follower_profile_id;
            UPDATE profiles SET followers_count = followers_count + 1 
            WHERE id = NEW.following_profile_id;
        -- Se viene rimosso (soft delete)
        ELSIF OLD.removed_at IS NULL AND NEW.removed_at IS NOT NULL AND OLD.status = 'accepted' THEN
            UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) 
            WHERE id = NEW.follower_profile_id;
            UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) 
            WHERE id = NEW.following_profile_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' AND OLD.removed_at IS NULL THEN
        UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) 
        WHERE id = OLD.follower_profile_id;
        UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) 
        WHERE id = OLD.following_profile_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_follow_counts') THEN
        CREATE TRIGGER trigger_follow_counts
            AFTER INSERT OR UPDATE OR DELETE ON follows
            FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
    END IF;
END $$;

-- Trigger per posts_count
CREATE OR REPLACE FUNCTION update_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.removed_at IS NULL THEN
        UPDATE profiles SET posts_count = posts_count + 1 
        WHERE id = NEW.profile_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Se viene rimosso (soft delete)
        IF OLD.removed_at IS NULL AND NEW.removed_at IS NOT NULL THEN
            UPDATE profiles SET posts_count = GREATEST(posts_count - 1, 0) 
            WHERE id = NEW.profile_id;
        -- Se viene ripristinato
        ELSIF OLD.removed_at IS NOT NULL AND NEW.removed_at IS NULL THEN
            UPDATE profiles SET posts_count = posts_count + 1 
            WHERE id = NEW.profile_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.removed_at IS NULL THEN
        UPDATE profiles SET posts_count = GREATEST(posts_count - 1, 0) 
        WHERE id = OLD.profile_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_posts_count') THEN
        CREATE TRIGGER trigger_posts_count
            AFTER INSERT OR UPDATE OR DELETE ON posts
            FOR EACH ROW EXECUTE FUNCTION update_posts_count();
    END IF;
END $$;
