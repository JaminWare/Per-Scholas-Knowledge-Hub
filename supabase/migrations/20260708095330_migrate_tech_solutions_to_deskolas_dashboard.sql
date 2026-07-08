/*
# Migrate Tech Solutions to dedicated Deskolas dashboard track

1. Purpose
- Renames the canonical track for Deskolas-sourced tickets from
  "Learner Experience Tech Solutions" to "Deskolas Tech Solutions"
  so they route to the new /deskolas dashboard instead of /learner-experience.
- Expands the normalize_deskolas_submission() trigger to also match
  submissions with type = 'Resolved Ticket' (a secondary payload signature
  used by the Deskolas app).
- Backfills lx_stage, lx_topic, and lx_focus on orphaned records.

2. Data Updates
- articles.study_category: "Learner Experience Tech Solutions" → "Deskolas Tech Solutions"
- submissions.track: "Learner Experience Tech Solutions" → "Deskolas Tech Solutions"
- Backfill lx_stage = 'labs' on articles where study_category matches but lx_stage is null

3. Trigger Changes
- normalize_deskolas_submission() now fires when:
  NEW.type = 'deskolas' OR NEW.type = 'Resolved Ticket'
- Sets NEW.track := 'Deskolas Tech Solutions' (new canonical name)
- All other normalization logic (lx_topic, lx_focus derivation) unchanged

4. Security
- No RLS changes. Trigger operates at row level with SECURITY INVOKER.
*/

-- 1. Rename existing data
UPDATE articles
SET study_category = 'Deskolas Tech Solutions'
WHERE study_category = 'Learner Experience Tech Solutions';

UPDATE submissions
SET track = 'Deskolas Tech Solutions'
WHERE track = 'Learner Experience Tech Solutions';

-- 2. Backfill lx_stage on orphaned articles
UPDATE articles
SET lx_stage = 'labs'
WHERE study_category = 'Deskolas Tech Solutions' AND lx_stage IS NULL;

-- 3. Backfill lx_topic on articles using keyword derivation
UPDATE articles
SET lx_topic = CASE
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(hardware|av|audio|video|monitor|webcam|mic|headset|display|usb)' THEN 'Hardware & AV Setup'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(network|wifi|vpn|internet|connection|proxy|firewall)' THEN 'Network & Access'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(software|ide|vscode|extension|plugin|virtualbox|vm|docker)' THEN 'Software & IDEs'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(git|github|push|pull|merge|branch|commit)' THEN 'Git & GitHub'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(account|login|password|canvas|lms|coursera)' THEN 'Accounts & LMS'
  ELSE 'General Troubleshooting'
END
WHERE study_category = 'Deskolas Tech Solutions' AND lx_topic IS NULL;

-- 4. Backfill lx_stage on orphaned submissions
UPDATE submissions
SET lx_stage = 'labs'
WHERE track = 'Deskolas Tech Solutions' AND lx_stage IS NULL;

-- 5. Backfill lx_topic on submissions using keyword derivation
UPDATE submissions
SET lx_topic = CASE
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(hardware|av|audio|video|monitor|webcam|mic|headset|display|usb)' THEN 'Hardware & AV Setup'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(network|wifi|vpn|internet|connection|proxy|firewall)' THEN 'Network & Access'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(software|ide|vscode|extension|plugin|virtualbox|vm|docker)' THEN 'Software & IDEs'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(git|github|push|pull|merge|branch|commit)' THEN 'Git & GitHub'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(account|login|password|canvas|lms|coursera)' THEN 'Accounts & LMS'
  ELSE 'General Troubleshooting'
END
WHERE track = 'Deskolas Tech Solutions' AND lx_topic IS NULL;

-- 6. Upgrade the trigger to match both payload signatures and use new track name
CREATE OR REPLACE FUNCTION normalize_deskolas_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  raw_cat text;
  normalized text;
  focus text := NULL;
  haystack text;
BEGIN
  IF NEW.type = 'deskolas' OR NEW.type = 'Resolved Ticket' THEN
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

    haystack := LOWER(COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));

    CASE normalized
      WHEN 'Hardware & AV Setup' THEN
        IF haystack ~ '(monitor|display|hdmi|webcam|video|screen)' THEN
          focus := 'Display & Video';
        ELSIF haystack ~ '(mic|headset|audio|speaker|usb|keyboard|mouse)' THEN
          focus := 'Audio & Peripherals';
        END IF;
      WHEN 'Network & Access' THEN
        IF haystack ~ '(wifi|internet|connection|disconnect|slow)' THEN
          focus := 'WiFi & Connectivity';
        ELSIF haystack ~ '(vpn|proxy|firewall|blocked|access)' THEN
          focus := 'VPN & Proxy';
        END IF;
      WHEN 'Software & IDEs' THEN
        IF haystack ~ '(vscode|extension|plugin|editor|terminal)' THEN
          focus := 'VS Code & Extensions';
        ELSIF haystack ~ '(virtualbox|vm|docker|environment|install)' THEN
          focus := 'VMs & Environments';
        END IF;
      WHEN 'Git & GitHub' THEN
        IF haystack ~ '(push|pull|remote|origin|reject|fetch)' THEN
          focus := 'Push & Pull Issues';
        ELSIF haystack ~ '(merge|conflict|branch|rebase|reset)' THEN
          focus := 'Merge & Conflicts';
        END IF;
      WHEN 'Accounts & LMS' THEN
        IF haystack ~ '(login|password|locked|reset|mfa|2fa)' THEN
          focus := 'Login & Password';
        ELSIF haystack ~ '(canvas|coursera|lms|enrollment|module)' THEN
          focus := 'Canvas & Coursera';
        END IF;
      ELSE
        focus := NULL;
    END CASE;

    NEW.track := 'Deskolas Tech Solutions';
    NEW.lx_stage := 'labs';
    NEW.lx_topic := normalized;
    NEW.lx_focus := focus;
    NEW.badge := COALESCE(NULLIF(TRIM(NEW.badge), ''), 'Tech Solutions');
    NEW.submission_type := COALESCE(NULLIF(TRIM(NEW.submission_type), ''), 'Article');
  END IF;

  RETURN NEW;
END;
$$;
