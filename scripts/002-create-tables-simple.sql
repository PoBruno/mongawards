-- Create tables with simpler structure
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    banner_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    voting_open BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nominees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- Insert sample data for testing
INSERT INTO categories (name, description, is_active, voting_open) VALUES 
('Melhor Ator', 'Categoria para melhor ator do ano', TRUE, TRUE),
('Melhor Atriz', 'Categoria para melhor atriz do ano', TRUE, TRUE),
('Melhor Filme', 'Categoria para melhor filme do ano', TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- Get category IDs for nominees
DO $$
DECLARE
    cat_ator_id UUID;
    cat_atriz_id UUID;
    cat_filme_id UUID;
BEGIN
    SELECT id INTO cat_ator_id FROM categories WHERE name = 'Melhor Ator' LIMIT 1;
    SELECT id INTO cat_atriz_id FROM categories WHERE name = 'Melhor Atriz' LIMIT 1;
    SELECT id INTO cat_filme_id FROM categories WHERE name = 'Melhor Filme' LIMIT 1;
    
    -- Insert nominees
    INSERT INTO nominees (category_id, name, description, is_active, vote_count) VALUES 
    (cat_ator_id, 'Leonardo DiCaprio', 'Ator renomado de Hollywood', TRUE, 5),
    (cat_ator_id, 'Brad Pitt', 'Ator e produtor americano', TRUE, 3),
    (cat_ator_id, 'Robert Downey Jr.', 'Famoso por interpretar Iron Man', TRUE, 8),
    
    (cat_atriz_id, 'Meryl Streep', 'Atriz com múltiplos prêmios', TRUE, 7),
    (cat_atriz_id, 'Scarlett Johansson', 'Atriz e cantora americana', TRUE, 4),
    (cat_atriz_id, 'Emma Stone', 'Atriz premiada com Oscar', TRUE, 6),
    
    (cat_filme_id, 'Oppenheimer', 'Filme biográfico dirigido por Christopher Nolan', TRUE, 12),
    (cat_filme_id, 'Barbie', 'Comédia baseada na boneca famosa', TRUE, 9),
    (cat_filme_id, 'Killers of the Flower Moon', 'Drama dirigido por Martin Scorsese', TRUE, 7)
    ON CONFLICT DO NOTHING;
END $$;
