-- Move "Bad sockets" from Networking to Learner Experience Tech Solutions
UPDATE articles
SET slug = 'learner-experience/bad-sockets',
    section_id = NULL,
    study_category = 'Learner Experience Tech Solutions'
WHERE id = '4f14d041-bf36-4820-8ec9-226314ab60b2';

-- Fix the source submission track for "Bad sockets"
UPDATE submissions
SET track = 'Learner Experience Tech Solutions'
WHERE id = 'e047a4cb-adc1-48b0-98ab-a30dc652bbdb';

-- Move "Battery safety first" from Networking to Mobile Devices (Domain 1.0)
UPDATE articles
SET slug = 'core1-mobile/battery-safety-first',
    section_id = '747c6f2c-fbea-4a49-851d-fbc06b8e0637',
    study_category = 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)'
WHERE slug = 'core1-networking/battery-safety-first';

-- Move "Introduction to Healthcare IT Security" from Networking to Healthcare HIPAA
UPDATE articles
SET slug = 'healthcare-hipaa/introduction-to-healthcare-it-security',
    section_id = (SELECT id FROM sections WHERE slug = 'healthcare-hipaa' LIMIT 1),
    study_category = 'Advanced Healthcare IT HIPAA Data Security'
WHERE slug = 'core1-networking/introduction-to-healthcare-it-security';

-- Rename hyphenated article title
UPDATE articles
SET title = 'Quick Start: Avoiding Account Conflicts in Google AI Labs',
    slug = 'learner-experience/quick-start-avoiding-account-conflicts-in-google-ai-labs'
WHERE slug = 'learner-experience/quick-start-avoiding-account-conflicts-in-google-ai-labs';
