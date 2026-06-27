-- 1. Add is_sample and study_category columns.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS study_category text;

-- 2. Mark and rename the six orphan tips/* filler articles as samples.
UPDATE articles SET
  title = '[Sample] ' || title,
  is_sample = true
WHERE slug IN (
  'tips/comptia-osi-mnemonic',
  'tips/healthcare-lab-device-issues',
  'tips/windows-quick-commands',
  'tips/aida-mnemonic',
  'tips/macos-shortcuts',
  'tips/azari-ehr-template'
);

-- 3. Assign study categories to the two real study-tips articles.
UPDATE articles SET study_category = 'Testing Strategies'
WHERE slug = 'study-tips/certification-tips';

UPDATE articles SET study_category = 'Active Recalls'
WHERE slug = 'study-tips/security-flashcards';
