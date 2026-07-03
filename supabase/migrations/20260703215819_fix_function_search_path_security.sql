/*
# Fix mutable search_path on trigger functions

1. Security Fix
- Adds SET search_path = public to normalize_deskolas_track,
  normalize_emdash_in_submissions, and normalize_deskolas_submission.
- Prevents search_path injection attacks where a malicious role could
  shadow pg_catalog or public objects by prepending a schema to search_path.

2. Changes
- Recreates all three functions with identical logic but with
  SECURITY INVOKER and an explicit SET search_path = public clause.
*/

CREATE OR REPLACE FUNCTION public.normalize_emdash_in_submissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.normalize_deskolas_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- Fix normalize_deskolas_track if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'normalize_deskolas_track'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.normalize_deskolas_track()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SET search_path = public
      AS $inner$
      DECLARE
        raw_cat text;
        normalized text;
      BEGIN
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

        NEW.track := normalized;
        RETURN NEW;
      END;
      $inner$
    $func$;
  END IF;
END;
$$;
