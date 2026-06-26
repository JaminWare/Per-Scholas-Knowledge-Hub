/*
# Knowledge Base Schema for AI-Enabled Healthcare IT Cohort

1. New Tables
- `contributors` - Authors/contributors of knowledge base articles
  - id (uuid, primary key)
  - name (text, not null)
  - cohort_id (text, not null) - e.g., "AZARI-2024-001"
  - linkedin_url (text, nullable)
  - avatar_url (text, nullable)
  - bio (text, nullable)
  - created_at (timestamp)

- `sections` - Navigation sections (Home, CompTIA Domains, Study Tips, etc.)
  - id (uuid, primary key)
  - title (text, not null)
  - slug (text, unique, not null)
  - parent_id (uuid, nullable, self-referencing for sub-sections)
  - order_index (integer, default 0)
  - icon_name (text, nullable) - Lucide icon name

- `articles` - Knowledge base articles
  - id (uuid, primary key)
  - title (text, not null)
  - slug (text, unique, not null)
  - section_id (uuid, references sections)
  - content (text, not null) - Markdown content
  - excerpt (text, nullable) - Short preview
  - contributor_id (uuid, references contributors)
  - tags (text[], default '{}')
  - is_featured (boolean, default false)
  - created_at (timestamp)
  - updated_at (timestamp)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated read access (public knowledge base).
- Allow anon + authenticated write access (for content management).

3. Indexes
- Index on articles.section_id for section queries
- Index on articles.tags for tag-based searches
- Index on sections.parent_id for hierarchical queries
*/

CREATE TABLE IF NOT EXISTS contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cohort_id text NOT NULL,
  linkedin_url text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  icon_name text
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  content text NOT NULL,
  excerpt text,
  contributor_id uuid REFERENCES contributors(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_articles_section_id ON articles(section_id);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_sections_parent_id ON sections(parent_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(order_index);

-- Enable RLS
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policies for contributors (public read/write)
DROP POLICY IF EXISTS "anon_select_contributors" ON contributors;
CREATE POLICY "anon_select_contributors" ON contributors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contributors" ON contributors;
CREATE POLICY "anon_insert_contributors" ON contributors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contributors" ON contributors;
CREATE POLICY "anon_update_contributors" ON contributors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contributors" ON contributors;
CREATE POLICY "anon_delete_contributors" ON contributors FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for sections (public read/write)
DROP POLICY IF EXISTS "anon_select_sections" ON sections;
CREATE POLICY "anon_select_sections" ON sections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sections" ON sections;
CREATE POLICY "anon_insert_sections" ON sections FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sections" ON sections;
CREATE POLICY "anon_update_sections" ON sections FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sections" ON sections;
CREATE POLICY "anon_delete_sections" ON sections FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for articles (public read/write)
DROP POLICY IF EXISTS "anon_select_articles" ON articles;
CREATE POLICY "anon_select_articles" ON articles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_articles" ON articles;
CREATE POLICY "anon_insert_articles" ON articles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_articles" ON articles;
CREATE POLICY "anon_update_articles" ON articles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_articles" ON articles;
CREATE POLICY "anon_delete_articles" ON articles FOR DELETE
  TO anon, authenticated USING (true);