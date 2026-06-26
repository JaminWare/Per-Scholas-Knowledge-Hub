/*
# Secure RLS Policies for Knowledge Base

1. Security Changes
- Tables modified: articles, contributors, sections
- Changed INSERT, UPDATE, DELETE policies from public access to authenticated-only
- Kept SELECT policies public (intentional for knowledge base visibility)

2. Rationale
- This is a public knowledge base where anyone can read content
- Write operations (INSERT/UPDATE/DELETE) should require authentication
- The policies now properly enforce that only authenticated users can modify content

3. Note
- If the app needs anonymous write access (e.g., wiki-style collaboration), 
  authentication should be added with proper workflow for content contributions
*/

-- Fix articles policies
DROP POLICY IF EXISTS "anon_insert_articles" ON articles;
CREATE POLICY "authenticated_insert_articles" ON articles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_articles" ON articles;
CREATE POLICY "authenticated_update_articles" ON articles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_articles" ON articles;
CREATE POLICY "authenticated_delete_articles" ON articles FOR DELETE
  TO authenticated USING (true);

-- Fix contributors policies
DROP POLICY IF EXISTS "anon_insert_contributors" ON contributors;
CREATE POLICY "authenticated_insert_contributors" ON contributors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contributors" ON contributors;
CREATE POLICY "authenticated_update_contributors" ON contributors FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contributors" ON contributors;
CREATE POLICY "authenticated_delete_contributors" ON contributors FOR DELETE
  TO authenticated USING (true);

-- Fix sections policies
DROP POLICY IF EXISTS "anon_insert_sections" ON sections;
CREATE POLICY "authenticated_insert_sections" ON sections FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sections" ON sections;
CREATE POLICY "authenticated_update_sections" ON sections FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sections" ON sections;
CREATE POLICY "authenticated_delete_sections" ON sections FOR DELETE
  TO authenticated USING (true);