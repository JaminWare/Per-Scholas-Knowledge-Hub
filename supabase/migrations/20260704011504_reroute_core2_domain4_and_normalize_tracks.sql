-- Fix misrouted "General Troubleshooting" submissions -> Core 2 Domain 4.0
-- These are all Professor Messer Operational Procedures videos that were submitted
-- with a non-canonical track string.

-- 1. Fix submissions table: reroute "General Troubleshooting" to Core 2 Domain 4.0
--    EXCEPT "Introduction to Healthcare IT Security" which belongs to HIPAA
UPDATE submissions
SET track = 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)'
WHERE track = 'General Troubleshooting'
  AND title != 'Introduction to Healthcare IT Security';

UPDATE submissions
SET track = 'Advanced Healthcare IT HIPAA Data Security'
WHERE track = 'General Troubleshooting'
  AND title = 'Introduction to Healthcare IT Security';

-- 2. Fix other non-canonical track strings in submissions
UPDATE submissions
SET track = 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)'
WHERE track = 'Domain 1.0 Mobile Devices';

UPDATE submissions
SET track = 'CompTIA A+ Core 2 Domain 2.0 (Security)'
WHERE track = 'Domain 2.0 Security';

UPDATE submissions
SET track = 'CompTIA A+ Core 1 Domain 3.0 (Hardware)'
WHERE track = 'Domain 3.0 Hardware';

UPDATE submissions
SET track = 'CompTIA A+ Core 1 Domain 4.0 (Cloud)'
WHERE track = 'CompTIA A+ Core 1 Domain 4.0 (Virtualization & Cloud)';

-- 3. Fix the articles table: reroute the 9 Professor Messer operational articles
--    from core1-networking to core2-operations
UPDATE articles
SET
  study_category = 'CompTIA A+ Core 2 Domain 4.0 (Operational Procedures)',
  slug = REPLACE(slug, 'core1-networking/', 'core2-operations/'),
  section_id = 'a8201ae3-e4da-4492-ac5e-e0924745f8a2'
WHERE title IN (
  'Professor Messer: Change Management',
  'Professor Messer: Managing Backups',
  'Professor Messer: Safety Procedures',
  'Professor Messer: Environmental Impact',
  'Professor Messer: Privacy, Licensing, and Policies',
  'Professor Messer: Document Types',
  'Professor Messer: Communication',
  'Professor Messer: Scripting Languages',
  'Professor Messer: Remote Access'
)
AND slug LIKE 'core1-networking/%';