-- Add author_name column to articles for permanent contributor attribution
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_name text;

-- Backfill existing Jamin Ware articles from contributor_id join
UPDATE articles
SET author_name = 'Jamin Ware'
WHERE contributor_id IS NOT NULL
  AND author_name IS NULL;