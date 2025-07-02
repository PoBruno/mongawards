-- Implement two-phase voting system
-- Phase 1: Nomination (users vote for 2 nominees per category from all available nominees)
-- Phase 2: Final voting (users vote for 1 nominee per category from selected finalists)

-- Add phase control to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS voting_phase INTEGER DEFAULT 1;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS phase_1_active BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS phase_2_active BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

-- Create phase 1 votes table (nominations)
CREATE TABLE IF NOT EXISTS phase_1_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create phase 2 votes table (final votes)
CREATE TABLE IF NOT EXISTS phase_2_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id) -- One vote per user per category in phase 2
);

-- Create table to track user voting progress per phase
CREATE TABLE IF NOT EXISTS user_voting_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    phase INTEGER NOT NULL, -- 1 or 2
    votes_cast INTEGER DEFAULT 0,
    max_votes INTEGER DEFAULT 2, -- 2 for phase 1, 1 for phase 2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id, phase)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phase_1_votes_user ON phase_1_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_1_votes_nominee ON phase_1_votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_phase_1_votes_category ON phase_1_votes(category_id);
CREATE INDEX IF NOT EXISTS idx_phase_1_votes_category_nominee ON phase_1_votes(category_id, nominee_id);

CREATE INDEX IF NOT EXISTS idx_phase_2_votes_user ON phase_2_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_2_votes_nominee ON phase_2_votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_phase_2_votes_category ON phase_2_votes(category_id);
CREATE INDEX IF NOT EXISTS idx_phase_2_votes_category_nominee ON phase_2_votes(category_id, nominee_id);

CREATE INDEX IF NOT EXISTS idx_user_voting_progress_user ON user_voting_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voting_progress_category ON user_voting_progress(category_id);
CREATE INDEX IF NOT EXISTS idx_user_voting_progress_phase ON user_voting_progress(phase);

-- Disable RLS for new tables (since we're using custom auth)
ALTER TABLE phase_1_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE phase_2_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_voting_progress DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON phase_1_votes TO anon;
GRANT ALL ON phase_1_votes TO authenticated;
GRANT ALL ON phase_2_votes TO anon;
GRANT ALL ON phase_2_votes TO authenticated;
GRANT ALL ON user_voting_progress TO anon;
GRANT ALL ON user_voting_progress TO authenticated;

-- Update existing categories to have proper phase settings
UPDATE categories SET 
    voting_phase = 1,
    phase_1_active = voting_open,
    phase_2_active = FALSE,
    is_finalized = FALSE
WHERE voting_phase IS NULL;

-- Function to get phase 1 results for a category
CREATE OR REPLACE FUNCTION get_phase_1_results(category_uuid UUID)
RETURNS TABLE(
    nominee_id UUID,
    nominee_name TEXT,
    vote_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id as nominee_id,
        n.name as nominee_name,
        COUNT(p1.id) as vote_count
    FROM nominees n
    LEFT JOIN phase_1_votes p1 ON n.id = p1.nominee_id AND p1.category_id = category_uuid
    WHERE n.is_active = TRUE
    GROUP BY n.id, n.name
    ORDER BY vote_count DESC, n.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get phase 2 results for a category
CREATE OR REPLACE FUNCTION get_phase_2_results(category_uuid UUID)
RETURNS TABLE(
    nominee_id UUID,
    nominee_name TEXT,
    vote_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id as nominee_id,
        n.name as nominee_name,
        COUNT(p2.id) as vote_count
    FROM nominees n
    INNER JOIN nominee_categories nc ON n.id = nc.nominee_id AND nc.category_id = category_uuid
    LEFT JOIN phase_2_votes p2 ON n.id = p2.nominee_id AND p2.category_id = category_uuid
    WHERE n.is_active = TRUE
    GROUP BY n.id, n.name
    ORDER BY vote_count DESC, n.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Display summary
SELECT 'Two-phase voting system implemented!' as status;
SELECT 'Phase 1: Nomination (2 votes per user per category)' as phase_1_description;
SELECT 'Phase 2: Final voting (1 vote per user per category)' as phase_2_description;
SELECT COUNT(*) as total_categories FROM categories;
