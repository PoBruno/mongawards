-- Create nominee_categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS nominee_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nominee_id, category_id)
);

-- Remove the category_id from nominees table since we'll use the junction table
-- But keep it for backward compatibility for now
-- ALTER TABLE nominees DROP COLUMN IF EXISTS category_id;

-- Insert some sample associations
DO $$
DECLARE
    leo_id UUID;
    brad_id UUID;
    rdj_id UUID;
    meryl_id UUID;
    scarlett_id UUID;
    emma_id UUID;
    oppenheimer_id UUID;
    barbie_id UUID;
    killers_id UUID;
    
    ator_id UUID;
    atriz_id UUID;
    filme_id UUID;
BEGIN
    -- Get nominee IDs
    SELECT id INTO leo_id FROM nominees WHERE name = 'Leonardo DiCaprio' LIMIT 1;
    SELECT id INTO brad_id FROM nominees WHERE name = 'Brad Pitt' LIMIT 1;
    SELECT id INTO rdj_id FROM nominees WHERE name = 'Robert Downey Jr.' LIMIT 1;
    SELECT id INTO meryl_id FROM nominees WHERE name = 'Meryl Streep' LIMIT 1;
    SELECT id INTO scarlett_id FROM nominees WHERE name = 'Scarlett Johansson' LIMIT 1;
    SELECT id INTO emma_id FROM nominees WHERE name = 'Emma Stone' LIMIT 1;
    SELECT id INTO oppenheimer_id FROM nominees WHERE name = 'Oppenheimer' LIMIT 1;
    SELECT id INTO barbie_id FROM nominees WHERE name = 'Barbie' LIMIT 1;
    SELECT id INTO killers_id FROM nominees WHERE name = 'Killers of the Flower Moon' LIMIT 1;
    
    -- Get category IDs
    SELECT id INTO ator_id FROM categories WHERE name = 'Melhor Ator' LIMIT 1;
    SELECT id INTO atriz_id FROM categories WHERE name = 'Melhor Atriz' LIMIT 1;
    SELECT id INTO filme_id FROM categories WHERE name = 'Melhor Filme' LIMIT 1;
    
    -- Insert associations
    INSERT INTO nominee_categories (nominee_id, category_id) VALUES 
    (leo_id, ator_id),
    (brad_id, ator_id),
    (rdj_id, ator_id),
    (meryl_id, atriz_id),
    (scarlett_id, atriz_id),
    (emma_id, atriz_id),
    (oppenheimer_id, filme_id),
    (barbie_id, filme_id),
    (killers_id, filme_id)
    ON CONFLICT DO NOTHING;
END $$;
