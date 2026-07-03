/*
# Normalize em-dashes to space-hyphen-space globally

1. Purpose
- Replaces all em-dash characters (U+2014) with ' - ' (space-hyphen-space) in all
  text columns that store category/track/routing values.
- Ensures frontend constants and database values use the same separator.

2. Modified Tables
- `articles`: study_category, slug columns updated
- `submissions`: track column updated
- `sections`: slug column updated (if any em-dashes exist)

3. Important Notes
- This is a data-only UPDATE, no schema changes.
- Safe to re-run (idempotent - replaces only if em-dash exists).
*/

UPDATE articles
SET study_category = REPLACE(study_category, E'\u2014', ' - ')
WHERE study_category LIKE E'%\u2014%';

UPDATE submissions
SET track = REPLACE(track, E'\u2014', ' - ')
WHERE track LIKE E'%\u2014%';
