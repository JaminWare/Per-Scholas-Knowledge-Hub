-- Remap quick-references articles to their new domain-specific slugs and sections
-- This consolidates orphaned quick-reference articles into the proper domain structure

-- 1. Remap ports articles to core1-networking
UPDATE articles
SET slug = 'core1-networking/ports',
    title = 'Network Ports & Protocols — Complete Quick Reference',
    section_id = '66455c03-15e7-4f4c-b43f-e89d492032f0',
    is_sample = false,
    study_category = 'Domain 2.0 — Networking',
    submission_type = 'Quick Reference',
    updated_at = NOW()
WHERE slug = 'quick-references/common-ports';

-- Remove the duplicate essential-ports entry (content merged into the above)
UPDATE articles
SET slug = 'core1-networking/ports-legacy',
    is_sample = true,
    section_id = '66455c03-15e7-4f4c-b43f-e89d492032f0',
    updated_at = NOW()
WHERE slug = 'quick-references/essential-ports';

-- 2. Remap CLI runbook to core2-os
UPDATE articles
SET slug = 'core2-os/cli-runbook',
    title = 'Essential CLI Command Runbook — Windows & Linux',
    section_id = 'a48950ba-c115-4b92-a795-ca7ba4fd0d0c',
    is_sample = false,
    study_category = 'Domain 1.0 — Operating Systems',
    submission_type = 'Quick Reference',
    updated_at = NOW()
WHERE slug = 'quick-references/cli-networking-matrix';

-- 3. Remap acronyms to study-tips
UPDATE articles
SET slug = 'study-tips/acronyms',
    title = 'Healthcare IT & CompTIA Acronym Master Directory',
    section_id = '524023df-2ef4-4ecd-8bfd-62ac54724fd7',
    is_sample = false,
    study_category = 'Study Tips',
    submission_type = 'Quick Reference',
    updated_at = NOW()
WHERE slug = 'quick-references/healthcare-acronym-directory';

-- 4. Update any submissions referencing old quick-references slugs
UPDATE submissions
SET track = 'CompTIA A+ Core 1 — Domain 2.0 Networking (Ports & Protocols)'
WHERE track ILIKE '%quick reference%port%' OR track ILIKE '%quick-references%port%';

UPDATE submissions
SET track = 'CompTIA A+ Core 2 — Domain 1.0 Operating Systems (CLI Runbook)'
WHERE track ILIKE '%quick reference%cli%' OR track ILIKE '%quick-references%cli%';

UPDATE submissions
SET track = 'Study Tips — Acronym Directory'
WHERE track ILIKE '%quick reference%acronym%' OR track ILIKE '%quick-references%acronym%';
