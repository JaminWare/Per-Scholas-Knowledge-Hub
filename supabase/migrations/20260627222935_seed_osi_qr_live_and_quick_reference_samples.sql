-- Seed OSI Model as a live, featured Quick References article authored by Jamin Ware
INSERT INTO articles (slug, title, excerpt, content, tags, is_featured, is_sample, section_id, contributor_id)
VALUES (
  'quick-references/osi-model',
  '7-Layer OSI Reference Model & Data Encapsulation Guide',
  'A complete visual and technical reference mapping all 7 OSI layers to their Protocol Data Units, encapsulation headers, and real-world CompTIA A+ exam relevance.',
  '',
  ARRAY['OSI','networking','PDU','core1','reference'],
  true,
  false,
  (SELECT id FROM sections WHERE slug = 'quick-references' LIMIT 1),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
)
ON CONFLICT (slug) DO NOTHING;

-- Three sample Quick References slots to incentivise cohort submissions
INSERT INTO articles (slug, title, excerpt, content, tags, is_featured, is_sample, section_id, contributor_id)
VALUES
  (
    'quick-references/cli-networking-matrix',
    '[Sample] Windows Command-Line (CLI) Networking Toolset Matrix',
    'A compact interactive lookup guide for ipconfig, ping, tracert, netstat, and nslookup syntax configurations.',
    '',
    ARRAY['CLI','Troubleshooting','Core1'],
    false,
    true,
    (SELECT id FROM sections WHERE slug = 'quick-references' LIMIT 1),
    NULL
  ),
  (
    'quick-references/essential-ports',
    '[Sample] Ultimate CompTIA A+ Core 1 & Core 2 Essential Port Protocols',
    'A high-density reference sheet matching port numbers (21, 22, 23, 25, 53, 80, 443, 3389) with their core transport protocols.',
    '',
    ARRAY['Ports','Protocols','Core1','Core2'],
    false,
    true,
    (SELECT id FROM sections WHERE slug = 'quick-references' LIMIT 1),
    NULL
  ),
  (
    'quick-references/healthcare-acronym-directory',
    '[Sample] Healthcare IT Acronym Directory & HL7 Port Mappings',
    'A specialized healthcare matrix crossing EHR, PHI, HIPAA, and PACS definitions with standard interface engine connection points.',
    '',
    ARRAY['Healthcare','HL7','EHR','Security'],
    false,
    true,
    (SELECT id FROM sections WHERE slug = 'quick-references' LIMIT 1),
    NULL
  )
ON CONFLICT (slug) DO NOTHING;
