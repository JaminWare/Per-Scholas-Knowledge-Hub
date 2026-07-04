/*
# Fix misrouted articles: correct slug, section, and study_category

## Problem
A dangerous fallback in the admin approval pipeline defaulted unrecognized
track strings to 'core1-networking', causing articles to be published to the
wrong domain dashboard.

## Changes

1. "Replaceable parts" (id: 4ba53330-...) 
   - Was: slug core1-networking/replaceable-parts, section core1-networking, 
     study_category Networking
   - Now: slug core1-mobile/replaceable-parts, section core1-mobile, 
     study_category Mobile Devices

2. Four Core 2 Software Troubleshooting articles incorrectly in 
   core1-networking section:
   - "Troubleshooting Mobile Security"
   - "Professor Messer: Security Issues"
   - "Professor Messer: Troubleshooting Security Isssues"
   - "Professor Messer: Malware Removal Best Practices"
   - Corrected: slug prefix core2-software/, section core2-software

3. Three Networking articles with null section_id:
   - Populate section_id to core1-networking section

4. Source submission for "Replaceable parts":
   - Track corrected from 'General Troubleshooting' to canonical value

## Security
- No RLS or policy changes.
*/

-- 1. Fix "Replaceable parts" article
UPDATE articles
SET slug = 'core1-mobile/replaceable-parts',
    study_category = 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)',
    section_id = (SELECT id FROM sections WHERE slug = 'core1-mobile' LIMIT 1)
WHERE id = '4ba53330-f206-4d43-9e66-00782f9a8156';

-- 2. Fix the four Core 2 Software Troubleshooting articles misrouted to core1-networking
UPDATE articles
SET slug = 'core2-software/' || split_part(slug, '/', 2),
    section_id = (SELECT id FROM sections WHERE slug = 'core2-software' LIMIT 1)
WHERE id IN (
  'b707f606-3d15-475b-9495-366ad13c4328',
  '51da0be4-2557-4b59-aa0b-842ffddae440',
  '9d5eca88-72e0-4a55-b95b-dc5f8b228b1c',
  '6bc95e0c-d90e-47dd-b2a5-7e444e836114'
);

-- 3. Populate null section_id for Networking articles
UPDATE articles
SET section_id = (SELECT id FROM sections WHERE slug = 'core1-networking' LIMIT 1)
WHERE study_category = 'CompTIA A+ Core 1 Domain 2.0 (Networking)'
  AND section_id IS NULL
  AND slug LIKE 'core1-networking/%';

-- 4. Fix the source submission track
UPDATE submissions
SET track = 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)'
WHERE id = '5a54746e-f0c2-40c5-977c-8266a731482f';
