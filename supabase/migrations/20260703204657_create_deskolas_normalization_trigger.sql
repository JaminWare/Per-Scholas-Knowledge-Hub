/*
# Deskolas Ticket Normalization Trigger

1. Purpose
- Automatically normalizes inbound Deskolas ticket submissions on INSERT.
- Maps raw category strings from the Deskolas platform to canonical focus areas.
- Sets the appropriate lx_stage and track fields so tickets appear in "Tech Solutions".

2. Changes
- Creates function `normalize_deskolas_submission()` that fires BEFORE INSERT on submissions.
- When `type = 'deskolas'`, the function:
  - Sets `track` to 'Learner Experience — Tech Solutions'
  - Sets `lx_stage` to 'labs' (the internal ID for the Tech Solutions tab)
  - Maps raw category in the original `track` field to normalized `lx_topic`
  - Sets `submission_type` to 'Article' if not provided
  - Sets `badge` to 'Tech Solutions' if not provided

3. Category Mapping
  - 'Hardware and AV' → 'Hardware & AV Setup'
  - 'Network and Access' → 'Network & Access'
  - 'Software and IDE' → 'Software & IDEs'
  - 'Git and GitHub' → 'Git & GitHub'
  - 'Accounts and LMS' → 'Accounts & LMS'
  - Any other value → 'General Troubleshooting'

4. Security
- No RLS changes; trigger operates at statement level.
*/

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

    NEW.track := 'Learner Experience — Tech Solutions';
    NEW.lx_stage := 'labs';
    NEW.lx_topic := normalized;
    NEW.badge := COALESCE(NULLIF(TRIM(NEW.badge), ''), 'Tech Solutions');
    NEW.submission_type := COALESCE(NULLIF(TRIM(NEW.submission_type), ''), 'Article');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_deskolas ON submissions;
CREATE TRIGGER trg_normalize_deskolas
  BEFORE INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION normalize_deskolas_submission();
