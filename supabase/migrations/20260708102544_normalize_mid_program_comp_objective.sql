-- Remove the hyphen from "The Mid-Program Slump" in comp_objective
-- to align with the frontend code which now uses "The Mid Program Slump"
UPDATE articles
SET comp_objective = 'The Mid Program Slump'
WHERE comp_objective = 'The Mid-Program Slump';

UPDATE submissions
SET comp_objective = 'The Mid Program Slump'
WHERE comp_objective = 'The Mid-Program Slump';
