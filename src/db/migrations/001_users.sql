-- =============================================
-- 1. 👥 UTENTE (Autenticazione)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(60) NOT NULL,
    date_of_birth DATE NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Almeno uno tra phone_number o email deve essere presente
    CONSTRAINT chk_user_contact CHECK (phone_number IS NOT NULL OR email IS NOT NULL),
    
    -- Instagram richiede età minima di 13 anni
    CONSTRAINT chk_user_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '13 years')
);

-- Indici per ricerca veloce
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number) WHERE phone_number IS NOT NULL;

COMMENT ON TABLE users IS 'Tabella autenticazione utenti';
