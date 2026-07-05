/*
# Add status column to articles table

1. Modified Tables
   - `articles`
     - Added `status` (text, default 'published') — tracks whether an article is live or pending review after a community edit.

2. Security
   - No RLS policy changes required — existing policies already cover the column.

3. Notes
   - Default 'published' ensures all existing articles remain live.
   - Community edits set status to 'pending' until admin approves.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.articles ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;
