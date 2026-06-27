-- 1. Insert Jamin Ware as a contributor (idempotent).
INSERT INTO contributors (id, name, cohort_id, bio)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Jamin Ware',
  '2026-RTT-23',
  'Founder of the 2026-RTT-23 cohort knowledge base. AI-Enabled Healthcare IT professional specializing in network security, cloud infrastructure, and clinical systems administration.'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert the three Healthcare IT sidebar sections (idempotent).
INSERT INTO sections (slug, title, parent_id, order_index, icon_name)
VALUES
  ('healthcare-hipaa',    'HIPAA Data Security',  NULL, 20, 'Lock'),
  ('healthcare-ehr',      'EHR Architecture',     NULL, 10, 'Database'),
  ('healthcare-clinical', 'Clinical Workflows',   NULL, 30, 'Heart')
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert the three new featured articles by Jamin Ware.
INSERT INTO articles (slug, title, section_id, contributor_id, content, excerpt, tags, is_featured)
VALUES (
  'intro-healthcare-it-security',
  'Introduction to Healthcare IT Security',
  (SELECT id FROM sections WHERE slug = 'healthcare-hipaa'),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '# Introduction to Healthcare IT Security',
  'A comprehensive foundation in protecting Patient Health Information (PHI) using the CIA Triad, endpoint security, MDM, and HIPAA administrative and physical safeguards.',
  ARRAY['healthcare', 'HIPAA', 'security', 'CIA-triad', 'endpoint', 'CompTIA'],
  true
),
(
  'cloud-computing-healthcare',
  'Cloud Computing in Healthcare',
  (SELECT id FROM sections WHERE slug = 'healthcare-ehr'),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '# Cloud Computing in Healthcare',
  'How healthcare organizations leverage IaaS, PaaS, and SaaS for HIPAA-compliant cloud infrastructure — covering BAA requirements, data residency, AES-256 encryption, and disaster recovery.',
  ARRAY['cloud', 'healthcare', 'HIPAA', 'BAA', 'AWS', 'Azure', 'infrastructure'],
  true
),
(
  'ai-prompt-engineering-healthcare',
  'AI Prompt Engineering for Healthcare',
  (SELECT id FROM sections WHERE slug = 'azari-prompt-playbook'),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '# AI Prompt Engineering for Healthcare',
  'A practical framework for leveraging LLMs in clinical and IT workflows — covering role-prompting, few-shot prompting, PHI scrubbing rules, and the TRACE output quality framework.',
  ARRAY['AI', 'prompt-engineering', 'healthcare', 'LLM', 'PHI', 'documentation'],
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Backfill Jamin Ware as author on the three existing research articles.
UPDATE articles
SET contributor_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE slug IN ('firewall-basics', 'command-documentation', 'snap-in')
  AND contributor_id IS NULL;
