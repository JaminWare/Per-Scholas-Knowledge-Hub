/*
# Relax submissions content minimum length

1. Modified Policies
- `public_insert_submissions` on `submissions` table
  - Changed: `length(trim(content)) >= 30` → `length(trim(content)) >= 10`
  - Reason: Allow concise tips, short URLs, and brief resource links to pass
    the RLS check without blocking the user.

2. Security
- All other WITH CHECK clauses remain unchanged (full_name >= 2, track >= 5, title >= 3).
- The policy continues to apply to both `anon` and `authenticated` roles.

3. Notes
- This supports the frictionless submission portal initiative where users should
  never be blocked by overly strict length requirements on valid short content.
*/

DROP POLICY IF EXISTS "public_insert_submissions" ON submissions;
CREATE POLICY "public_insert_submissions" ON submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(full_name))  >= 2  AND
    length(trim(track))      >= 5  AND
    length(trim(title))      >= 3  AND
    length(trim(content))    >= 10
  );
