-- Fix all submissions where lx_stage is populated but track was corrupted
-- by the now-removed rogue trigger.
-- Maps lx_stage values to the correct Learner Experience track strings.

UPDATE submissions
SET track = CASE lx_stage
  WHEN 'onboarding' THEN 'Learner Experience Onboarding Hurdles'
  WHEN 'labs'        THEN 'Learner Experience Tech Solutions'
  WHEN 'slump'      THEN 'Learner Experience The Mid-Program Slump'
  WHEN 'cert'       THEN 'Learner Experience Certification Prep'
  WHEN 'job'        THEN 'Learner Experience Job Hunt Triage'
  ELSE 'Learner Experience ' || lx_stage
END
WHERE lx_stage IS NOT NULL
  AND track NOT LIKE 'Learner Experience%';

-- Rename and reroute the corresponding article
UPDATE articles
SET title = 'Per Scholas Zero Interest Loan FAQ',
    slug = 'learner-experience/per-scholas-zero-interest-loan-faq',
    study_category = 'Learner Experience Onboarding Hurdles',
    section_id = NULL
WHERE id = '55498c36-fc0e-4bd7-87f6-75ea5c5f5b7d';

-- Also rename the source submission for consistency
UPDATE submissions
SET title = 'Per Scholas Zero Interest Loan FAQ'
WHERE id = 'fb913ffd-ce58-489f-998a-237ef4cfb06c';
