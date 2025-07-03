
CREATE OR REPLACE VIEW individual_votes AS
SELECT
    id,
    user_id,
    nominee_id,
    category_id,
    created_at,
    1 AS phase
FROM
    phase_1_votes
UNION ALL
SELECT
    id,
    user_id,
    nominee_id,
    category_id,
    created_at,
    2 AS phase
FROM
    phase_2_votes;
