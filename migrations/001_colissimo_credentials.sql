-- Migration: Create colissimo_credentials table for storing encrypted API credentials
-- Run this migration manually or integrate into your migration system

CREATE TABLE IF NOT EXISTS colissimo_credentials (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    username TEXT NOT NULL,
    password_enc TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_colissimo_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_colissimo_credentials_updated_at ON colissimo_credentials;

CREATE TRIGGER trigger_colissimo_credentials_updated_at
    BEFORE UPDATE ON colissimo_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_colissimo_credentials_updated_at();

-- Comment
COMMENT ON TABLE colissimo_credentials IS 'Single-row table storing encrypted Colissimo API credentials';
COMMENT ON COLUMN colissimo_credentials.password_enc IS 'AES-256-GCM encrypted password (base64: iv + authTag + ciphertext)';
