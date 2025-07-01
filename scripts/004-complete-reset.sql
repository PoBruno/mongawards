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

-- Create nominees table (without category_id since we'll use junction table)
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

-- Insert secret codes for testing
INSERT INTO secret_codes (code) VALUES 
('MONGA2024'),
('AWARDS2024'),
('PREMIUM2024'),
('GOLDEN2024'),
('OSCAR2024');

-- Insert admin user (password: admin123)
INSERT INTO users (email, password, is_admin) VALUES 
('admin@monga.com', 'admin123', TRUE);

-- Insert some test users
INSERT INTO users (email, password, is_admin) VALUES 
('user1@test.com', 'password123', FALSE),
('user2@test.com', 'password123', FALSE),
('user3@test.com', 'password123', FALSE);

-- Insert categories (2 closed, 1 open)
INSERT INTO categories (name, description, is_active, voting_open) VALUES 
('Melhor Ator', 'Categoria para melhor ator do ano', TRUE, FALSE),
('Melhor Atriz', 'Categoria para melhor atriz do ano', TRUE, FALSE),
('Melhor Filme', 'Categoria para melhor filme do ano', TRUE, TRUE);

-- Insert nominees with varied vote counts
INSERT INTO nominees (name, description, image, is_active, vote_count) VALUES 
-- Atores
('Leonardo DiCaprio', 'Ator renomado de Hollywood, conhecido por filmes como Titanic e Inception', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face', TRUE, 45),
('Brad Pitt', 'Ator e produtor americano, vencedor do Oscar por Once Upon a Time in Hollywood', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face', TRUE, 38),
('Robert Downey Jr.', 'Famoso por interpretar Iron Man no Universo Cinematográfico Marvel', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face', TRUE, 52),
('Ryan Gosling', 'Ator canadense conhecido por La La Land e Blade Runner 2049', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=300&h=300&fit=crop&crop=face', TRUE, 29),

-- Atrizes
('Meryl Streep', 'Atriz com múltiplos prêmios, considerada uma das melhores de todos os tempos', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face', TRUE, 41),
('Scarlett Johansson', 'Atriz e cantora americana, conhecida por Viúva Negra e Marriage Story', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face', TRUE, 35),
('Emma Stone', 'Atriz premiada com Oscar por La La Land', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face', TRUE, 47),
('Margot Robbie', 'Atriz australiana conhecida por Barbie e I, Tonya', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face', TRUE, 33),

-- Filmes
('Oppenheimer', 'Filme biográfico dirigido por Christopher Nolan sobre o criador da bomba atômica', 'https://images.unsplash.com/photo-1489599735734-79b4212bdd26?w=400&h=300&fit=crop', TRUE, 67),
('Barbie', 'Comédia dirigida por Greta Gerwig baseada na famosa boneca', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop', TRUE, 58),
('Killers of the Flower Moon', 'Drama dirigido por Martin Scorsese sobre crimes contra os Osage', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop', TRUE, 43),
('Dune: Part Two', 'Continuação da épica ficção científica dirigida por Denis Villeneuve', 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop', TRUE, 39);

-- Now let's create the associations
DO $$
DECLARE
    -- Category IDs
    ator_id UUID;
    atriz_id UUID;
    filme_id UUID;
    
    -- Nominee IDs
    leo_id UUID;
    brad_id UUID;
    rdj_id UUID;
    ryan_id UUID;
    meryl_id UUID;
    scarlett_id UUID;
    emma_id UUID;
    margot_id UUID;
    oppenheimer_id UUID;
    barbie_id UUID;
    killers_id UUID;
    dune_id UUID;
    
    -- User IDs for simulated votes
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO ator_id FROM categories WHERE name = 'Melhor Ator' LIMIT 1;
    SELECT id INTO atriz_id FROM categories WHERE name = 'Melhor Atriz' LIMIT 1;
    SELECT id INTO filme_id FROM categories WHERE name = 'Melhor Filme' LIMIT 1;
    
    -- Get nominee IDs
    SELECT id INTO leo_id FROM nominees WHERE name = 'Leonardo DiCaprio' LIMIT 1;
    SELECT id INTO brad_id FROM nominees WHERE name = 'Brad Pitt' LIMIT 1;
    SELECT id INTO rdj_id FROM nominees WHERE name = 'Robert Downey Jr.' LIMIT 1;
    SELECT id INTO ryan_id FROM nominees WHERE name = 'Ryan Gosling' LIMIT 1;
    SELECT id INTO meryl_id FROM nominees WHERE name = 'Meryl Streep' LIMIT 1;
    SELECT id INTO scarlett_id FROM nominees WHERE name = 'Scarlett Johansson' LIMIT 1;
    SELECT id INTO emma_id FROM nominees WHERE name = 'Emma Stone' LIMIT 1;
    SELECT id INTO margot_id FROM nominees WHERE name = 'Margot Robbie' LIMIT 1;
    SELECT id INTO oppenheimer_id FROM nominees WHERE name = 'Oppenheimer' LIMIT 1;
    SELECT id INTO barbie_id FROM nominees WHERE name = 'Barbie' LIMIT 1;
    SELECT id INTO killers_id FROM nominees WHERE name = 'Killers of the Flower Moon' LIMIT 1;
    SELECT id INTO dune_id FROM nominees WHERE name = 'Dune: Part Two' LIMIT 1;
    
    -- Get user IDs
    SELECT id INTO user1_id FROM users WHERE email = 'user1@test.com' LIMIT 1;
    SELECT id INTO user2_id FROM users WHERE email = 'user2@test.com' LIMIT 1;
    SELECT id INTO user3_id FROM users WHERE email = 'user3@test.com' LIMIT 1;
    
    -- Associate all nominees to all categories (as requested)
    INSERT INTO nominee_categories (nominee_id, category_id) VALUES 
    -- All nominees in Melhor Ator
    (leo_id, ator_id),
    (brad_id, ator_id),
    (rdj_id, ator_id),
    (ryan_id, ator_id),
    (meryl_id, ator_id),
    (scarlett_id, ator_id),
    (emma_id, ator_id),
    (margot_id, ator_id),
    (oppenheimer_id, ator_id),
    (barbie_id, ator_id),
    (killers_id, ator_id),
    (dune_id, ator_id),
    
    -- All nominees in Melhor Atriz
    (leo_id, atriz_id),
    (brad_id, atriz_id),
    (rdj_id, atriz_id),
    (ryan_id, atriz_id),
    (meryl_id, atriz_id),
    (scarlett_id, atriz_id),
    (emma_id, atriz_id),
    (margot_id, atriz_id),
    (oppenheimer_id, atriz_id),
    (barbie_id, atriz_id),
    (killers_id, atriz_id),
    (dune_id, atriz_id),
    
    -- All nominees in Melhor Filme
    (leo_id, filme_id),
    (brad_id, filme_id),
    (rdj_id, filme_id),
    (ryan_id, filme_id),
    (meryl_id, filme_id),
    (scarlett_id, filme_id),
    (emma_id, filme_id),
    (margot_id, filme_id),
    (oppenheimer_id, filme_id),
    (barbie_id, filme_id),
    (killers_id, filme_id),
    (dune_id, filme_id);
    
    -- Add some simulated user votes for closed categories
    INSERT INTO user_votes (user_id, category_id) VALUES 
    (user1_id, ator_id),
    (user1_id, atriz_id),
    (user2_id, ator_id),
    (user3_id, atriz_id);
    
END $$;

-- Add some indexes for better performance
CREATE INDEX idx_nominee_categories_nominee ON nominee_categories(nominee_id);
CREATE INDEX idx_nominee_categories_category ON nominee_categories(category_id);
CREATE INDEX idx_user_votes_user ON user_votes(user_id);
CREATE INDEX idx_user_votes_category ON user_votes(category_id);

-- Display summary
SELECT 'Database reset complete!' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_nominees FROM nominees;
SELECT COUNT(*) as total_associations FROM nominee_categories;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_votes FROM user_votes;
