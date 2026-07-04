-- Clear the stale section_id that still points to "Domain 2.0 Networking"
-- for the misrouted Learner Experience article. With section_id = NULL,
-- the ArticlePage front-end correctly falls through to slug-prefix detection
-- and routes back to /learner-experience.
UPDATE articles
SET section_id = NULL
WHERE id = '0711cb3b-29f8-46aa-b684-6fe29a066874'
  AND section_id = '66455c03-15e7-4f4c-b43f-e89d492032f0';