/*
# Add Payload Size Constraints to submissions and articles

1. Modified Tables
   - `submissions`: Added CHECK constraints for title (300 chars), content (50,000 chars),
     full_name (100 chars), track (200 chars). Set default for `type` column.
   - `articles`: Added CHECK constraints for title (300 chars), content (100,000 chars),
     slug (200 chars with format enforcement).

2. Security Changes
   - Prevents oversized payloads from being stored in the database.
   - Enforces slug format at the database level (lowercase alphanumeric + hyphens + slashes).

3. Important Notes
   - These constraints protect against unbounded text payloads that could bloat the database.
   - The slug format constraint ensures only valid URL-safe characters are stored.
   - All constraints use CHECK with char_length to enforce upper bounds.
   - Default for submissions.type ensures trigger type guards always have a value.
*/

-- submissions: payload limits
ALTER TABLE submissions
  ADD CONSTRAINT chk_submissions_title_length
    CHECK (char_length(title) <= 300);

ALTER TABLE submissions
  ADD CONSTRAINT chk_submissions_content_length
    CHECK (char_length(content) <= 50000);

ALTER TABLE submissions
  ADD CONSTRAINT chk_submissions_full_name_length
    CHECK (char_length(full_name) <= 100);

ALTER TABLE submissions
  ADD CONSTRAINT chk_submissions_track_length
    CHECK (char_length(track) <= 200);

-- submissions: default type so trigger guards always have a value
ALTER TABLE submissions
  ALTER COLUMN type SET DEFAULT 'standard';

-- articles: payload limits
ALTER TABLE articles
  ADD CONSTRAINT chk_articles_title_length
    CHECK (char_length(title) <= 300);

ALTER TABLE articles
  ADD CONSTRAINT chk_articles_content_length
    CHECK (char_length(content) <= 100000);

ALTER TABLE articles
  ADD CONSTRAINT chk_articles_slug_length
    CHECK (char_length(slug) <= 200);

ALTER TABLE articles
  ADD CONSTRAINT chk_articles_slug_format
    CHECK (slug ~ '^[a-z0-9][a-z0-9/_-]*$');
