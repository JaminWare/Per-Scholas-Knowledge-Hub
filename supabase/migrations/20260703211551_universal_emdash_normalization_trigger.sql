/*
# Universal em-dash normalization trigger on submissions

1. Purpose
- Automatically replaces em-dash characters (U+2014) with ' - ' (space-hyphen-space)
  in the `track` column of ALL incoming submissions, regardless of source.
- Applies universally to Deskolas tickets, Google Sheets webhooks, and manual inserts.
- Updates the existing Deskolas normalization trigger to also use ' - ' in its
  track assignment.

2. Changes
- Creates/replaces function `normalize_emdash_in_submissions()` that fires BEFORE INSERT
  on submissions.
- Drops and recreates the Deskolas normalization trigger to assign track with ' - '.

3. Security
- No RLS changes; trigger operates at row level.
*/

-- Universal em-dash normalizer (runs on ALL inserts)
CREATE OR REPLACE FUNCTION normalize_emdash_in_submissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.track IS NOT NULL THEN
    NEW.track := REPLACE(NEW.track, E'\u2014', ' - ');
  END IF;
  IF NEW.title IS NOT NULL THEN
    NEW.title := REPLACE(NEW.title, E'\u2014', ' - ');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_emdash ON submissions;
CREATE TRIGGER trg_normalize_emdash
  BEFORE INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION normalize_emdash_in_submissions();

-- Update the Deskolas normalization function to use ' - ' in its track assignment
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

    NEW.track := 'Learner Experience - Tech Solutions';
    NEW.lx_stage := 'labs';
    NEW.lx_topic := normalized;
    NEW.badge := COALESCE(NULLIF(TRIM(NEW.badge), ''), 'Tech Solutions');
    NEW.submission_type := COALESCE(NULLIF(TRIM(NEW.submission_type), ''), 'Article');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
