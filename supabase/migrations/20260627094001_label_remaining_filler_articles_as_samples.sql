-- Mark all remaining contributor_id=null, non-sample articles as [Sample] placeholders.
UPDATE articles
SET
  title = '[Sample] ' || title,
  is_sample = true
WHERE contributor_id IS NULL
  AND is_sample = false
  AND slug IN (
    '02-networking/tcp-ip',
    '04-identity-access/iam',
    '06-servers/administration',
    '07-mobile/mdm',
    '08-troubleshooting/methodology',
    '09-operations/change-management',
    '10-risk/disaster-recovery',
    'quick-references/common-ports',
    'study-tips/security-flashcards'
  );
