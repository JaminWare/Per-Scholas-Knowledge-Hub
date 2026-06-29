/*
# Add formatted_content and is_approved columns to submissions

## Summary
Adds two new columns to the `submissions` table to support the automated
submission pipeline:

## New Columns on `submissions`

1. `formatted_content` (TEXT, nullable)
   - Stores the auto-generated Markdown body produced by the template engine
     after a student's Article submission passes all four validation gates.
   - Kept separate from `content` (the raw student description) so both the
     original input and the published formatted version are preserved.
   - NULL for non-Article submissions (support tickets, resource links) which
     bypass the formatter.

2. `is_approved` (BOOLEAN, NOT NULL, DEFAULT false)
   - Publication state flag.
   - Set to TRUE when:
     a) All four checklist criteria pass AND the submission overwrites a [Sample]
        article slot (slot-overwrite path, self-approving).
     b) All four checklist criteria pass and the article is published directly
        into the uncategorized stream.
   - Remains FALSE for non-Article submissions and any edge cases.

## Security
- No RLS changes required. Existing anon INSERT / SELECT policies on
  `submissions` already cover the new columns automatically.

## Notes
- Statements are idempotent: uses `DO $$ ... IF NOT EXISTS ... END $$` blocks
  so re-running this migration is safe.
- No data loss: only additive changes.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'formatted_content'
  ) THEN
    ALTER TABLE submissions ADD COLUMN formatted_content TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE submissions ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
