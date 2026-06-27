-- Insert the 6 domain sections missing from the sections table.
-- These slugs are referenced by the sidebar but have no DB row,
-- causing SectionPage to always hit ComingSoonPanel.
INSERT INTO sections (slug, title, order_index) VALUES
  ('core1-mobile',      'Domain 1.0 — Mobile Devices',              10),
  ('core1-hardware',    'Domain 3.0 — Hardware',                    30),
  ('core1-cloud',       'Domain 4.0 — Virtualization & Cloud',      40),
  ('core2-security',    'Domain 2.0 — Security',                    20),
  ('core2-software',    'Domain 3.0 — Software Troubleshooting',    30),
  ('core2-operations',  'Domain 4.0 — Operational Procedures',      40)
ON CONFLICT (slug) DO NOTHING;
