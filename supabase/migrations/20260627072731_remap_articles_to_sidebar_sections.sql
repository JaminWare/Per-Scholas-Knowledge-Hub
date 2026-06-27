-- Insert the three sections that match the sidebar slugs (idempotent).
INSERT INTO sections (slug, title, parent_id, order_index, icon_name)
VALUES
  ('core1-networking',      'Domain 2.0 — Networking',                    NULL, 20, 'Network'),
  ('core1-troubleshooting', 'Domain 5.0 — HW & Network Troubleshooting',  NULL, 50, 'Wrench'),
  ('core2-os',              'Domain 1.0 — Operating Systems',             NULL, 10, 'Monitor')
ON CONFLICT (slug) DO NOTHING;

-- Remap the three research articles to their correct sections.
UPDATE articles
SET section_id = (SELECT id FROM sections WHERE slug = 'core1-networking')
WHERE slug = 'firewall-basics';

UPDATE articles
SET section_id = (SELECT id FROM sections WHERE slug = 'core1-troubleshooting')
WHERE slug = 'command-documentation';

UPDATE articles
SET section_id = (SELECT id FROM sections WHERE slug = 'core2-os')
WHERE slug = 'snap-in';