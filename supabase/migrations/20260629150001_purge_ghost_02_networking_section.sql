-- Detach articles from the ghost '02 Networking' section (preserve the articles)
UPDATE articles
SET section_id = NULL
WHERE section_id = 'ae61f887-e5d9-44f9-8c18-5898ad4fd643';

-- Delete the ghost section and its child sub-section stubs
DELETE FROM sections
WHERE id IN (
  'ae61f887-e5d9-44f9-8c18-5898ad4fd643',
  'e12e8dd5-51c3-420b-a1bd-a1eee09b0327',
  'ad61259b-a3c9-4abc-9cd3-e15d93dc098b'
);
