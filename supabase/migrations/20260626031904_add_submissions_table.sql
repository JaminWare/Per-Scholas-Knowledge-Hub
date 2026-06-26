/*
# Add submissions table for Contributor Submission Engine

1. New Tables
- `submissions` - Community tip/article submissions
  - id (uuid, primary key)
  - full_name (text) - contributor's name or Discord handle
  - track (text) - selected domain/module
  - title (text) - article or tip title
  - content (text) - full tip/troubleshooting content
  - created_at (timestamp)

2. Security
- Enable RLS; allow public anon read and insert (community contribution model).
- No update/delete for anon to protect submissions integrity.
*/

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  track text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_submissions" ON submissions;
CREATE POLICY "anon_select_submissions" ON submissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_submissions" ON submissions;
CREATE POLICY "anon_insert_submissions" ON submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_submissions" ON submissions;
CREATE POLICY "authenticated_update_submissions" ON submissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_submissions" ON submissions;
CREATE POLICY "authenticated_delete_submissions" ON submissions FOR DELETE
  TO authenticated USING (true);