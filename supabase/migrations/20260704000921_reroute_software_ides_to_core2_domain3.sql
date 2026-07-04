-- Fix 4 articles that were misrouted to Core 1 Domain 2.0 (Networking)
-- because submissions stored track='Software & IDEs' which normalizeCategory
-- could not resolve. Their comp_objective values (3.2-3.5) confirm they belong
-- to CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting).

UPDATE articles
SET study_category = 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)'
WHERE id IN (
  'b707f606-3d15-475b-9495-366ad13c4328',
  '51da0be4-2557-4b59-aa0b-842ffddae440',
  '9d5eca88-72e0-4a55-b95b-dc5f8b228b1c',
  '6bc95e0c-d90e-47dd-b2a5-7e444e836114'
);

-- Fix the source submissions so future refetches also resolve correctly.
UPDATE submissions
SET track = 'CompTIA A+ Core 2 Domain 3.0 (Software Troubleshooting)'
WHERE id IN (
  'cd8bb3c0-f91d-494c-b83f-0786a8a2a021',
  '56b31717-a797-4f56-9fc6-673baf891319',
  'fda6c2fe-f7de-403f-9721-0a230377b20d',
  'a3c684cd-b1a9-4872-a9e9-af75b2fceac7'
);