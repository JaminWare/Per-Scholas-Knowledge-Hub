-- Backfill lx_stage, lx_topic, lx_focus on articles from their matched submissions.
-- This fixes the nested filter disappearance on the Learner Experience dashboard.

UPDATE articles a
SET lx_stage = s.lx_stage,
    lx_topic = s.lx_topic,
    lx_focus = s.lx_focus
FROM submissions s
WHERE lower(trim(a.title)) = lower(trim(s.title))
  AND a.study_category ILIKE 'Learner Experience%'
  AND a.lx_stage IS NULL
  AND s.lx_stage IS NOT NULL;
