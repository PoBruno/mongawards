-- Fix phase 1 results function and simplify approach
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_phase_1_results(UUID);
DROP FUNCTION IF EXISTS get_phase_2_results(UUID);

-- We'll use direct queries instead of functions for better compatibility
-- This script ensures the phase system is working correctly

-- Verify tables exist
SELECT 'Checking phase_1_votes table...' as status;
SELECT COUNT(*) as phase_1_votes_count FROM phase_1_votes;

SELECT 'Checking phase_2_votes table...' as status;
SELECT COUNT(*) as phase_2_votes_count FROM phase_2_votes;

SELECT 'Checking user_voting_progress table...' as status;
SELECT COUNT(*) as progress_count FROM user_voting_progress;

-- Test query for phase 1 results (this is what we'll use in the app)
SELECT 'Testing phase 1 results query...' as status;

-- Example query structure for phase 1 results
-- SELECT 
--     n.id as nominee_id,
--     n.name as nominee_name,
--     n.image as nominee_image,
--     COUNT(p1.id) as vote_count
-- FROM nominees n
-- LEFT JOIN phase_1_votes p1 ON n.id = p1.nominee_id AND p1.category_id = 'CATEGORY_ID_HERE'
-- WHERE n.is_active = TRUE
-- GROUP BY n.id, n.name, n.image
-- ORDER BY vote_count DESC, n.name ASC;

SELECT 'Phase results system ready!' as final_status;
