-- Retroactively prefix all article slugs that are missing their section prefix.
-- Only updates articles that: have a section_id, and whose slug does NOT already
-- start with the section's slug followed by '/'.
-- Skips articles whose section_slug is NULL or that already have the correct prefix.
UPDATE articles
SET slug = s.slug || '/' || articles.slug,
    updated_at = now()
FROM sections s
WHERE articles.section_id = s.id
  AND articles.slug NOT LIKE s.slug || '/%'
  AND s.slug IS NOT NULL
  AND articles.slug NOT LIKE '%/%';