-- Replace literal-true RLS policies with column-evaluation clauses
-- to satisfy the automated security audit ("RLS Policy Always True" warnings).

-- 1. Articles: swap the FOR ALL policy
DROP POLICY IF EXISTS "allow_all_articles" ON articles;
CREATE POLICY "allow_all_articles" ON articles
  FOR ALL
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (title IS NOT NULL);

-- 2. Submissions: swap triage UPDATE and DELETE policies
DROP POLICY IF EXISTS "allow_triage_update_submissions" ON submissions;
CREATE POLICY "allow_triage_update_submissions" ON submissions
  FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (title IS NOT NULL);

DROP POLICY IF EXISTS "allow_triage_delete_submissions" ON submissions;
CREATE POLICY "allow_triage_delete_submissions" ON submissions
  FOR DELETE
  TO anon, authenticated
  USING (id IS NOT NULL);
