/*
# Remap legacy healthcare article slugs to unified advanced-healthcare-it/ prefix

1. Modified Tables
   - `articles`: Updates the `slug` column for any articles whose slug
     starts with `healthcare-ehr/`, `healthcare-hipaa/`, or `healthcare-clinical/`
     to use the unified `advanced-healthcare-it/` prefix instead.

2. Rationale
   - The admin approval flow now routes all Advanced Healthcare IT submissions
     under the `advanced-healthcare-it/` prefix. This migration retroactively
     aligns existing articles so they are not orphaned under stale prefixes.

3. Important Notes
   - Only rewrites the prefix portion of the slug; the article-specific suffix
     is preserved unchanged.
   - Idempotent: articles already using `advanced-healthcare-it/` are unaffected
     because they do not match the WHERE conditions.
   - No data is deleted or dropped.
*/

UPDATE articles
SET slug = 'advanced-healthcare-it/' || substring(slug FROM position('/' IN slug) + 1),
    updated_at = now()
WHERE slug LIKE 'healthcare-ehr/%';

UPDATE articles
SET slug = 'advanced-healthcare-it/' || substring(slug FROM position('/' IN slug) + 1),
    updated_at = now()
WHERE slug LIKE 'healthcare-hipaa/%';

UPDATE articles
SET slug = 'advanced-healthcare-it/' || substring(slug FROM position('/' IN slug) + 1),
    updated_at = now()
WHERE slug LIKE 'healthcare-clinical/%';
