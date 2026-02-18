-- Create table if not exists (standard fallback)
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    species VARCHAR(255),
    image_url VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    planted_date DATE DEFAULT CURRENT_DATE NOT NULL,
    harvest_date DATE,
    created_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL
);

-- Simpler, safer column addition (Postgres 9.6+)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
