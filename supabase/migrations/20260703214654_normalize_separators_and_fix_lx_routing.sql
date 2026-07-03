/*
# Normalize separators to single space and fix Learner Experience routing

1. Data Updates
- Replace all ' - ' (space-hyphen-space) and '  -  ' (double-space-hyphen-double-space)
  separators in submissions.track, submissions.title, articles.study_category, articles.title,
  and sections.title with a single space.
- Replace em-dash characters (U+2014) and ' — ' patterns in sections.title with single space.
- Clear section_id for all articles with study_category LIKE 'Learner Experience%' so they
  route correctly to /learner-experience instead of orphaned CompTIA domain sections.

2. Trigger Updates
- Update normalize_emdash_in_submissions() to normalize both em-dashes AND ' - ' patterns
  to single space.
- Update normalize_deskolas_submission() to set track as 'Learner Experience Tech Solutions'
  (single space, no hyphen separator).

3. Security
- No RLS changes; triggers operate at row level.
*/

-- 1. Normalize existing submissions.track: replace '  -  ' and ' - ' with single space
UPDATE submissions SET track = REPLACE(track, '  -  ', ' ') WHERE track LIKE '%  -  %';
UPDATE submissions SET track = REPLACE(track, ' - ', ' ') WHERE track LIKE '% - %';

-- 2. Normalize existing submissions.title
UPDATE submissions SET title = REPLACE(title, '  -  ', ' ') WHERE title LIKE '%  -  %';
UPDATE submissions SET title = REPLACE(title, ' - ', ' ') WHERE title LIKE '% - %';

-- 3. Normalize existing articles.study_category
UPDATE articles SET study_category = REPLACE(study_category, '  -  ', ' ') WHERE study_category LIKE '%  -  %';
UPDATE articles SET study_category = REPLACE(study_category, ' - ', ' ') WHERE study_category LIKE '% - %';

-- 4. Normalize existing articles.title (em-dash and hyphen separators)
UPDATE articles SET title = REPLACE(title, E'\u2014', ' ') WHERE title LIKE E'%\u2014%';
UPDATE articles SET title = REPLACE(title, '  -  ', ' ') WHERE title LIKE '%  -  %';
UPDATE articles SET title = REPLACE(title, ' - ', ' ') WHERE title LIKE '% - %';

-- 5. Normalize sections.title: em-dash patterns and hyphen separators
UPDATE sections SET title = REPLACE(title, E' \u2014 ', ' ') WHERE title LIKE E'% \u2014 %';
UPDATE sections SET title = REPLACE(title, E'\u2014', ' ') WHERE title LIKE E'%\u2014%';
UPDATE sections SET title = REPLACE(title, '  -  ', ' ') WHERE title LIKE '%  -  %';
UPDATE sections SET title = REPLACE(title, ' - ', ' ') WHERE title LIKE '% - %';

-- 6. Clear section_id for all Learner Experience articles
UPDATE articles SET section_id = NULL WHERE study_category LIKE 'Learner Experience%';

-- 7. Update trigger: normalize em-dashes AND hyphen separators to single space
CREATE OR REPLACE FUNCTION normalize_emdash_in_submissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.track IS NOT NULL THEN
    NEW.track := REPLACE(NEW.track, E'\u2014', ' ');
    NEW.track := REPLACE(NEW.track, '  -  ', ' ');
    NEW.track := REPLACE(NEW.track, ' - ', ' ');
  END IF;
  IF NEW.title IS NOT NULL THEN
    NEW.title := REPLACE(NEW.title, E'\u2014', ' ');
    NEW.title := REPLACE(NEW.title, '  -  ', ' ');
    NEW.title := REPLACE(NEW.title, ' - ', ' ');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Update Deskolas trigger to use single-space separator
CREATE OR REPLACE FUNCTION normalize_deskolas_submission()
RETURNS TRIGGER AS $$
DECLARE
  raw_cat text;
  normalized text;
BEGIN
  IF NEW.type = 'deskolas' THEN
    raw_cat := LOWER(TRIM(COALESCE(NEW.track, '')));

    CASE
      WHEN raw_cat LIKE '%hardware%' OR raw_cat LIKE '%av%' THEN
        normalized := 'Hardware & AV Setup';
      WHEN raw_cat LIKE '%network%' OR raw_cat LIKE '%access%' THEN
        normalized := 'Network & Access';
      WHEN raw_cat LIKE '%software%' OR raw_cat LIKE '%ide%' THEN
        normalized := 'Software & IDEs';
      WHEN raw_cat LIKE '%git%' OR raw_cat LIKE '%github%' THEN
        normalized := 'Git & GitHub';
      WHEN raw_cat LIKE '%account%' OR raw_cat LIKE '%lms%' THEN
        normalized := 'Accounts & LMS';
      ELSE
        normalized := 'General Troubleshooting';
    END CASE;

    NEW.track := 'Learner Experience Tech Solutions';
    NEW.lx_stage := 'labs';
    NEW.lx_topic := normalized;
    NEW.badge := COALESCE(NULLIF(TRIM(NEW.badge), ''), 'Tech Solutions');
    NEW.submission_type := COALESCE(NULLIF(TRIM(NEW.submission_type), ''), 'Article');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
