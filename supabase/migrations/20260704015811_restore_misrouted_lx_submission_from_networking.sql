-- Fix misrouted Learner Experience submission that was captured by the
-- "General Troubleshooting" track and then normalized into Networking.
-- The submission has lx_stage = 'onboarding' confirming it's an LX entry.

-- 1. Fix the submission track
UPDATE submissions
SET track = 'Learner Experience Onboarding Hurdles'
WHERE id = 'd1d68a19-78c6-4aae-a5ae-a4bc4cd0e0e6'
  AND lx_stage = 'onboarding';

-- 2. Fix the corresponding article
UPDATE articles
SET
  study_category = 'Learner Experience Onboarding Hurdles',
  slug = 'learner-experience/quick-start-avoiding-account-conflicts-in-google-ai-labs'
WHERE id = '0711cb3b-29f8-46aa-b684-6fe29a066874'
  AND study_category = 'CompTIA A+ Core 1 Domain 2.0 (Networking)';