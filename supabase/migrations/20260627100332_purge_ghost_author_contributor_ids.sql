-- Purge all ghost authors: any article not authored by Jamin Ware gets contributor_id = NULL
-- and is_sample = true so the [Sample Learner] fallback kicks in on the frontend.
UPDATE articles
SET contributor_id = NULL,
    is_sample      = true
WHERE contributor_id IS NOT NULL
  AND contributor_id != 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
