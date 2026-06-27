-- Fix featured article flags:
-- 1. Clear is_featured on ghost-author duplicate articles (they have no contributor
--    and duplicate the real Jamin Ware featured articles).
UPDATE articles
SET is_featured = false
WHERE slug IN (
  '01-security/intro-healthcare-security',
  '05-cloud/healthcare-cloud',
  'azari-prompt-playbook/ai-prompting'
);

-- 2. Ensure the three canonical Jamin Ware articles are definitively featured.
UPDATE articles
SET is_featured = true
WHERE slug IN (
  'intro-healthcare-it-security',
  'cloud-computing-healthcare',
  'ai-prompt-engineering-healthcare'
);

-- 3. Seed the Motherboard PBQ sample article as an open community slot.
INSERT INTO articles (slug, title, excerpt, section_id, content, is_sample, contributor_id, tags, is_featured)
VALUES (
  'core1-troubleshooting/sample-motherboard-pbq',
  '[Sample] Interactive Motherboard Troubleshooting & Master PBQ Analysis',
  'Hands-on motherboard fault isolation, POST diagnostic sequences, and PBQ simulation strategies for the CompTIA A+ Core 1 exam.',
  (SELECT id FROM sections WHERE slug = 'core1-troubleshooting'),
  'This is a sample placeholder applet. Submit your research to claim this slot.',
  true, NULL, ARRAY['motherboard','pbq','troubleshooting','core1'], false
)
ON CONFLICT (slug) DO NOTHING;
