-- De-approve duplicate/open-slot submissions incorrectly attributed to Jamin Ware.
-- These do NOT have a corresponding published article and inflate contributor metrics.

-- 4 duplicates of "Understanding LANs, WANs, and Network Types in Healthcare IT"
UPDATE submissions SET is_approved = false
WHERE id IN (
  'acc62fe4-6aad-43df-acc3-8460c86adfc2',
  'd0f3ef3b-8be3-45d0-80cc-acf7553d963f',
  'fb4458e6-d4e9-4594-a37d-cbd4a4c02bee',
  'ba72ec76-ff6c-4ab4-9c82-574e3bda1bd2'
);

-- "Designing Reliable Healthcare Networks" — no corresponding published article
UPDATE submissions SET is_approved = false
WHERE id = '517a4c4e-5fe9-4b62-aaa2-48b47ec6fd42';

-- 3 duplicate "Professor Messer: MDM" Resource Links (1 canonical copy remains: cf803b9a)
UPDATE submissions SET is_approved = false
WHERE id IN (
  'b4d61577-0919-4689-81a5-4db0654570b4',
  '888e1e8d-3a05-47ef-b345-164d6dddc5ce',
  '2bbb7e6d-04ee-4abe-bb67-af1c0c405294'
);
