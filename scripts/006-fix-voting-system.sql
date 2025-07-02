-- Fix voting system: Create individual votes per category
-- Drop existing vote tracking and create proper vote system

-- Create individual_votes table to track each vote per category
CREATE TABLE IF NOT EXISTS individual_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id) -- One vote per user per category
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_individual_votes_user ON individual_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_votes_nominee ON individual_votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_individual_votes_category ON individual_votes(category_id);
CREATE INDEX IF NOT EXISTS idx_individual_votes_nominee_category ON individual_votes(nominee_id, category_id);

-- Migrate existing data if any (this is optional since we're starting fresh)
-- We'll keep the vote_count in nominees table for backward compatibility but won't use it

-- Display summary
SELECT 'Voting system fixed!' as status;
SELECT 'Now each vote is tracked individually per category' as description;
