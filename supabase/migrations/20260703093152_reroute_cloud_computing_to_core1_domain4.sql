-- Move "Cloud Computing in Healthcare" from EHR Architecture to Core 1 Domain 4.0 (Cloud).
-- The comp_objective was already correctly set to '4.1 Cloud Computing Concepts'.
UPDATE articles
SET
  study_category  = 'CompTIA A+ Core 1 — Domain 4.0 (Cloud)',
  submission_type = COALESCE(submission_type, 'Article')
WHERE id = '7b845b43-04af-42dc-9dd5-cb3be333e789'
  AND study_category = 'Advanced Healthcare IT — EHR Architecture';
