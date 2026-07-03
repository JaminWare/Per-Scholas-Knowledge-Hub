/*
# Canonicalize healthcare article study_category values

1. Modified Tables
   - `articles`: Updates the `study_category` column for healthcare articles
     to use the full canonical form that matches the frontend's CANONICAL_DOMAINS map.

2. Changes
   - All articles with study_category 'HIPAA Data Security' → 'Advanced Healthcare IT — HIPAA Data Security'
   - All articles with study_category 'EHR Architecture' → 'Advanced Healthcare IT — EHR Architecture'
   - All articles with study_category 'Clinical Workflows' → 'Advanced Healthcare IT — Clinical Workflows'
   - Specific remap: intro-healthcare-it-security moved from Core 2 Security → HIPAA Data Security
   - Specific remap: cloud-computing-healthcare moved from Core 1 Cloud → EHR Architecture

3. Rationale
   - The frontend CurriculumDashboard filters on the full canonical form
     (e.g. 'Advanced Healthcare IT — HIPAA Data Security'). Previously the DB stored
     short-form values ('HIPAA Data Security') which were being mis-normalized by
     normalizeCategory.ts and routed to the wrong domain dashboard.
   - The two explicitly remapped articles contain healthcare-specific content and
     belong under the Advanced Healthcare IT umbrella.

4. Important Notes
   - Idempotent: articles already using full canonical form are unaffected.
   - No data is deleted or dropped.
*/

-- Remap short-form healthcare categories to full canonical form
UPDATE articles
SET study_category = 'Advanced Healthcare IT — HIPAA Data Security',
    updated_at = now()
WHERE study_category = 'HIPAA Data Security';

UPDATE articles
SET study_category = 'Advanced Healthcare IT — EHR Architecture',
    updated_at = now()
WHERE study_category = 'EHR Architecture';

UPDATE articles
SET study_category = 'Advanced Healthcare IT — Clinical Workflows',
    updated_at = now()
WHERE study_category = 'Clinical Workflows';

-- Remap intro-healthcare-it-security from Core 2 Security to HIPAA dashboard
UPDATE articles
SET study_category = 'Advanced Healthcare IT — HIPAA Data Security',
    comp_objective = COALESCE(comp_objective, 'PHI Protection Strategies'),
    updated_at = now()
WHERE slug = 'advanced-healthcare-it/intro-healthcare-it-security'
  AND study_category = 'CompTIA A+ Core 2 — Domain 2.0 (Security)';

-- Remap cloud-computing-healthcare from Core 1 Cloud to EHR Architecture
UPDATE articles
SET study_category = 'Advanced Healthcare IT — EHR Architecture',
    comp_objective = COALESCE(comp_objective, 'EHR Integrations & Sandboxes'),
    updated_at = now()
WHERE slug = 'advanced-healthcare-it/cloud-computing-healthcare'
  AND study_category = 'CompTIA A+ Core 1 — Domain 4.0 (Cloud)';
