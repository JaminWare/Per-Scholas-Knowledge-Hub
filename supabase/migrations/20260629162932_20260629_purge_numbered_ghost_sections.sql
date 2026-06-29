-- Delete articles belonging to numbered ghost sections first (FK constraint order)
DELETE FROM articles
WHERE section_id IN (
  SELECT id FROM sections WHERE slug IN (
    '04-identity-access',
    '05-cloud',
    '06-servers',
    '07-mobile',
    '08-troubleshooting',
    '09-operations',
    '10-risk',
    '01-security',
    '01-security/threats',
    '01-security/architecture',
    '01-security/cryptography'
  )
);

-- Delete sub-sections of 01-security before deleting the parent
DELETE FROM sections
WHERE parent_id = (SELECT id FROM sections WHERE slug = '01-security');

-- Delete the numbered ghost top-level sections
DELETE FROM sections
WHERE slug IN (
  '04-identity-access',
  '05-cloud',
  '06-servers',
  '07-mobile',
  '08-troubleshooting',
  '09-operations',
  '10-risk',
  '01-security'
);
