/*
  Re-enable RLS (idempotent) and provision broad CRUD policies
  for client-side admin operations on articles and submissions.
*/

-- ── Ensure RLS is active ─────────────────────────────────────
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- ── Articles: replace legacy select-only with full-access policy ──
DROP POLICY IF EXISTS "anon_select_articles" ON articles;
DROP POLICY IF EXISTS "allow_all_articles" ON articles;
CREATE POLICY "allow_all_articles" ON articles
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── Submissions: keep validated INSERT + SELECT, add UPDATE/DELETE ──
DROP POLICY IF EXISTS "allow_triage_update_submissions" ON submissions;
CREATE POLICY "allow_triage_update_submissions" ON submissions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_triage_delete_submissions" ON submissions;
CREATE POLICY "allow_triage_delete_submissions" ON submissions
  FOR DELETE
  TO anon, authenticated
  USING (true);
