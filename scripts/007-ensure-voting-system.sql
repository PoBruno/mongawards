-- Ensure voting system is properly set up
-- This script can be run multiple times safely

-- Create individual_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS individual_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id) -- One vote per user per category
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_individual_votes_user ON individual_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_votes_nominee ON individual_votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_individual_votes_category ON individual_votes(category_id);
CREATE INDEX IF NOT EXISTS idx_individual_votes_nominee_category ON individual_votes(nominee_id, category_id);

-- Verify the table exists and show structure
SELECT 'individual_votes table created successfully!' as status;

-- Show table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'individual_votes' 
ORDER BY ordinal_position;

-- Show current vote count
SELECT COUNT(*) as total_individual_votes FROM individual_votes;
