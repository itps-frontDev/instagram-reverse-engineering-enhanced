-- =============================================
-- 2. 👤 PROFILO (Informazioni Sociali)
-- =============================================

-- Tipo ENUM per il genere
DO $$ BEGIN
    CREATE TYPE gender_enum AS ENUM (
        'male', 
        'female',
        'custom',
        'prefer_not_to_say'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(60),
    profile_image_url TEXT,
    bio VARCHAR(150),
    website_url VARCHAR(200),
    gender_type gender_enum,
    gender_description VARCHAR(50),
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    -- Contatori denormalizzati per performance
    followers_count INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    posts_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- gender_description solo se gender_type = 'custom'
    CONSTRAINT chk_gender_description CHECK (
        gender_description IS NULL OR gender_type = 'custom'
    )
);

-- Indici per ricerca
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

COMMENT ON TABLE profiles IS 'Informazioni pubbliche e social handle';
