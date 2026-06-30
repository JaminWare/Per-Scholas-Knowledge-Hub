-- Normalize all "[OPEN SLOT] ..." titles to just "[OPEN SLOT]"
UPDATE articles
SET title = '[OPEN SLOT]', updated_at = now()
WHERE title LIKE '[OPEN SLOT] %'
  AND is_sample = true;