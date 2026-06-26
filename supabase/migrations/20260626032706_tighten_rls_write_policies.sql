/*
# Tighten RLS write policies

articles / contributors / sections:
  - No ownership column exists and there is no admin auth system wired up.
  - Dropping all client-side write policies means only the Supabase service-role
    key (used exclusively server-side) can modify these tables.
  - SELECT policies remain in place so the public read-only app continues to work.

submissions:
  - Public INSERT is intentional (community contribution form).
  - Replace always-true WITH CHECK with a real content-length validation so the
    clause is no longer trivially true.
  - Drop authenticated UPDATE / DELETE — no admin auth system exists; modifications
    should go through the service-role key only.
*/

-- ── articles ─────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_insert_articles" ON articles;
DROP POLICY IF EXISTS "authenticated_update_articles" ON articles;
DROP POLICY IF EXISTS "authenticated_delete_articles" ON articles;

-- ── contributors ─────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_insert_contributors" ON contributors;
DROP POLICY IF EXISTS "authenticated_update_contributors" ON contributors;
DROP POLICY IF EXISTS "authenticated_delete_contributors" ON contributors;

-- ── sections ─────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_insert_sections" ON sections;
DROP POLICY IF EXISTS "authenticated_update_sections" ON sections;
DROP POLICY IF EXISTS "authenticated_delete_sections" ON sections;

-- ── submissions ───────────────────────────────────────────
-- Replace always-true INSERT with content validation
DROP POLICY IF EXISTS "anon_insert_submissions" ON submissions;
CREATE POLICY "public_insert_submissions" ON submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(full_name))  >= 2  AND
    length(trim(track))      >= 5  AND
    length(trim(title))      >= 3  AND
    length(trim(content))    >= 30
  );

-- Drop authenticated write policies — no admin auth system exists
DROP POLICY IF EXISTS "authenticated_update_submissions" ON submissions;
DROP POLICY IF EXISTS "authenticated_delete_submissions" ON submissions;