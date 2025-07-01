-- Production setup: Clean database and create minimal structure
-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS nominee_categories CASCADE;
DROP TABLE IF EXISTS user_votes CASCADE;
DROP TABLE IF EXISTS nominees CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS secret_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    banner_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    voting_open BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nominees table
CREATE TABLE nominees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nominee_categories junction table for many-to-many relationship
CREATE TABLE nominee_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nominee_id, category_id)
);

-- Create user_votes table (to track which categories user has voted in)
CREATE TABLE user_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- Create secret_codes table
CREATE TABLE secret_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_nominee_categories_nominee ON nominee_categories(nominee_id);
CREATE INDEX idx_nominee_categories_category ON nominee_categories(category_id);
CREATE INDEX idx_user_votes_user ON user_votes(user_id);
CREATE INDEX idx_user_votes_category ON user_votes(category_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_nominees_active ON nominees(is_active);

-- Display summary
SELECT 'Production database setup complete!' as status;
SELECT 'Ready for admin configuration via environment variables' as next_step;
