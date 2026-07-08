/*
# Add unique indexes to prevent duplicate articles

1. Modified Tables
   - `articles`: Added partial unique index on normalized title (excluding sample rows)
   - `articles`: Added partial unique index on normalized content for Resource Link types

2. Security Changes
   - Provides database-level enforcement that no two non-sample articles can share
     the same normalized title (case-insensitive, stripped of special characters).
   - Provides database-level enforcement that no two Resource Link articles can share
     the same normalized URL content.

3. Important Notes
   - These indexes act as a final safety net even if client-side duplicate checks are bypassed.
   - Uses `lower(regexp_replace(...))` to normalize titles for comparison.
   - The `WHERE is_sample = false` clause excludes placeholder/sample rows from the constraint.
   - Idempotent: uses IF NOT EXISTS.
*/

-- Unique index on normalized article titles (non-sample rows only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_unique_normalized_title
  ON articles (lower(regexp_replace(title, '[^a-zA-Z0-9]', '', 'g')))
  WHERE is_sample = false;

-- Unique index on normalized content for Resource Link articles (non-sample rows only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_unique_resource_link_url
  ON articles (lower(regexp_replace(content, '^https?://(www\.)?', '', 'g')))
  WHERE is_sample = false AND submission_type = 'Resource Link';
