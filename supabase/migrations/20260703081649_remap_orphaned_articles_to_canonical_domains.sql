-- Remap articles whose study_category holds an objective string instead of a canonical domain.
-- For these, the objective is promoted into comp_objective and study_category is set to the
-- correct canonical domain derived from the article's slug prefix.

-- core2-os/cli-runbook: study_category='1.2 Command-Line Tools' → domain + move to comp_objective
UPDATE articles
SET
  study_category = 'CompTIA A+ Core 2 — Domain 1.0 (Operating Systems)',
  comp_objective  = '1.2 Command-Line Tools'
WHERE slug = 'core2-os/cli-runbook'
  AND study_category = '1.2 Command-Line Tools';

-- core2-os/module-12-study-guide: study_category='1.11 Linux Features/Tools' → same treatment
UPDATE articles
SET
  study_category = 'CompTIA A+ Core 2 — Domain 1.0 (Operating Systems)',
  comp_objective  = '1.11 Linux Features/Tools'
WHERE slug = 'core2-os/module-12-study-guide'
  AND study_category = '1.11 Linux Features/Tools';

-- core1-troubleshooting/command-documentation: NULL study_category, wrong-track comp_objective
-- CLI Research lives under Core 1 Troubleshooting; clear the stale Core-2 comp_objective
UPDATE articles
SET
  study_category  = 'CompTIA A+ Core 1 — Domain 5.0 (Troubleshooting)',
  comp_objective  = NULL,
  submission_type = COALESCE(submission_type, 'Article')
WHERE slug = 'core1-troubleshooting/command-documentation'
  AND study_category IS NULL;

-- core2-os/snap-in: NULL study_category/comp_objective/submission_type
-- MMC Snap-ins → Control Panel Utilities (Core 2, OS Domain, obj 1.4)
UPDATE articles
SET
  study_category  = 'CompTIA A+ Core 2 — Domain 1.0 (Operating Systems)',
  comp_objective  = '1.4 Control Panel Utilities',
  submission_type = COALESCE(submission_type, 'Article')
WHERE slug = 'core2-os/snap-in'
  AND study_category IS NULL;

-- learner-experience/quick-references-osi-model: NULL study_category
-- OSI model is foundational Core 1 Networking content (2.1 Ports & Protocols)
UPDATE articles
SET
  study_category  = 'CompTIA A+ Core 1 — Domain 2.0 (Networking)',
  comp_objective  = '2.1 Ports & Protocols',
  submission_type = COALESCE(submission_type, 'Quick Reference')
WHERE slug = 'learner-experience/quick-references-osi-model'
  AND study_category IS NULL;
