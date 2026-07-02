/*
# Seed Learner Experience Onboarding Runbook Articles

1. New Data
   - Two articles seeded into the `articles` table for the Learner Experience dashboard:
     - "Navigating the Hub: Search, Domains & Filtering" (platform navigation guide)
     - "Adding Intel: How to Submit Your Field Notes" (contribution workflow guide)
   - Both attributed to Jamin Ware, tagged for onboarding/FAQ
   - Set `lx_stage = 'onboarding'` so they appear under the Onboarding Hurdles tab
   - `study_category` set to 'Learner Experience — Onboarding Hurdles' for correct filtering

2. Important Notes
   - Uses ON CONFLICT (slug) DO NOTHING to be idempotent
   - Articles are not samples and not featured — they are standard content entries
*/

INSERT INTO articles (
  title,
  slug,
  content,
  excerpt,
  tags,
  is_featured,
  is_sample,
  study_category,
  author_name,
  submission_type,
  lx_stage,
  lx_topic,
  lx_focus
) VALUES (
  'Navigating the Hub: Search, Domains & Filtering',
  'learner-experience/navigation',
  'A comprehensive guide explaining how to use the Ctrl + K search feature, how the CompTIA Domain dashboards are structured, and how to use the Quick References and Study Tips tabs to filter the resource grids.',
  'Learn how to navigate the Cohort Survival Guide — search, sidebar domains, and filter tabs explained.',
  ARRAY['onboarding', 'navigation', 'faq'],
  false,
  false,
  'Learner Experience — Onboarding Hurdles',
  'Jamin Ware',
  'Article',
  'onboarding',
  'canvas-workflows',
  NULL
), (
  'Adding Intel: How to Submit Your Field Notes',
  'learner-experience/adding-intel',
  'A step-by-step guide explaining the contribution process — the Add Intel button, the smart Author Name autocomplete, and what happens once submitted to the Recognition Wall.',
  'Step-by-step walkthrough of contributing resources to the knowledge base and earning recognition.',
  ARRAY['contribution', 'adding-intel', 'faq'],
  false,
  false,
  'Learner Experience — Onboarding Hurdles',
  'Jamin Ware',
  'Article',
  'onboarding',
  'canvas-workflows',
  NULL
)
ON CONFLICT (slug) DO NOTHING;