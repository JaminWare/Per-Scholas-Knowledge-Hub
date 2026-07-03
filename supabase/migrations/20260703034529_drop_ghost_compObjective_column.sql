-- Drop the ghost camelCase column that was created by mistake.
-- Only the snake_case `comp_objective` column should exist.
ALTER TABLE submissions DROP COLUMN IF EXISTS "compObjective";