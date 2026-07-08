/*
# Upgrade Deskolas normalization trigger with lx_focus derivation

1. Purpose
- Enhances the normalize_deskolas_submission() trigger to also derive lx_focus
  (the third-level nested category) from ticket title+content keywords.
- Uses "first match wins" strategy per lx_topic.
- Backfills existing Deskolas records that have null lx_focus.

2. Keyword Mappings (per lx_topic)
- Hardware & AV Setup:
    Display & Video: monitor, display, hdmi, webcam, video, screen
    Audio & Peripherals: mic, headset, audio, speaker, usb, keyboard, mouse
- Network & Access:
    WiFi & Connectivity: wifi, internet, connection, disconnect, slow
    VPN & Proxy: vpn, proxy, firewall, blocked, access
- Software & IDEs:
    VS Code & Extensions: vscode, extension, plugin, editor, terminal
    VMs & Environments: virtualbox, vm, docker, environment, install
- Git & GitHub:
    Push & Pull Issues: push, pull, remote, origin, reject, fetch
    Merge & Conflicts: merge, conflict, branch, rebase, reset
- Accounts & LMS:
    Login & Password: login, password, locked, reset, mfa, 2fa
    Canvas & Coursera: canvas, coursera, lms, enrollment, module
- General Troubleshooting: no nested — lx_focus stays null

3. Security
- Function uses SECURITY INVOKER (default) with explicit search_path.
*/

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
  IF NEW.type = 'deskolas' THEN
    raw_cat := LOWER(TRIM(COALESCE(NEW.track, '')));

    -- Derive lx_topic from raw category tag
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

    -- Derive lx_focus from title + content keywords (first match wins)
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

    NEW.track := 'Learner Experience Tech Solutions';
    NEW.lx_stage := 'labs';
    NEW.lx_topic := normalized;
    NEW.lx_focus := focus;
    NEW.badge := COALESCE(NULLIF(TRIM(NEW.badge), ''), 'Tech Solutions');
    NEW.submission_type := COALESCE(NULLIF(TRIM(NEW.submission_type), ''), 'Article');
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill existing Deskolas submissions that have null lx_focus
UPDATE submissions
SET lx_focus = CASE
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(monitor|display|hdmi|webcam|video|screen)'
    AND lx_topic = 'Hardware & AV Setup' THEN 'Display & Video'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(mic|headset|audio|speaker|usb|keyboard|mouse)'
    AND lx_topic = 'Hardware & AV Setup' THEN 'Audio & Peripherals'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(wifi|internet|connection|disconnect|slow)'
    AND lx_topic = 'Network & Access' THEN 'WiFi & Connectivity'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(vpn|proxy|firewall|blocked|access)'
    AND lx_topic = 'Network & Access' THEN 'VPN & Proxy'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(vscode|extension|plugin|editor|terminal)'
    AND lx_topic = 'Software & IDEs' THEN 'VS Code & Extensions'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(virtualbox|vm|docker|environment|install)'
    AND lx_topic = 'Software & IDEs' THEN 'VMs & Environments'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(push|pull|remote|origin|reject|fetch)'
    AND lx_topic = 'Git & GitHub' THEN 'Push & Pull Issues'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(merge|conflict|branch|rebase|reset)'
    AND lx_topic = 'Git & GitHub' THEN 'Merge & Conflicts'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(login|password|locked|reset|mfa|2fa)'
    AND lx_topic = 'Accounts & LMS' THEN 'Login & Password'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(canvas|coursera|lms|enrollment|module)'
    AND lx_topic = 'Accounts & LMS' THEN 'Canvas & Coursera'
  ELSE NULL
END
WHERE type = 'deskolas' AND lx_focus IS NULL;

-- Also backfill the published article that was created from the Deskolas submission
UPDATE articles
SET lx_focus = CASE
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(monitor|display|hdmi|webcam|video|screen)'
    AND lx_topic = 'Hardware & AV Setup' THEN 'Display & Video'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(mic|headset|audio|speaker|usb|keyboard|mouse)'
    AND lx_topic = 'Hardware & AV Setup' THEN 'Audio & Peripherals'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(wifi|internet|connection|disconnect|slow)'
    AND lx_topic = 'Network & Access' THEN 'WiFi & Connectivity'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(vpn|proxy|firewall|blocked|access)'
    AND lx_topic = 'Network & Access' THEN 'VPN & Proxy'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(vscode|extension|plugin|editor|terminal)'
    AND lx_topic = 'Software & IDEs' THEN 'VS Code & Extensions'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(virtualbox|vm|docker|environment|install)'
    AND lx_topic = 'Software & IDEs' THEN 'VMs & Environments'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(push|pull|remote|origin|reject|fetch)'
    AND lx_topic = 'Git & GitHub' THEN 'Push & Pull Issues'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(merge|conflict|branch|rebase|reset)'
    AND lx_topic = 'Git & GitHub' THEN 'Merge & Conflicts'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(login|password|locked|reset|mfa|2fa)'
    AND lx_topic = 'Accounts & LMS' THEN 'Login & Password'
  WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '')) ~ '(canvas|coursera|lms|enrollment|module)'
    AND lx_topic = 'Accounts & LMS' THEN 'Canvas & Coursera'
  ELSE NULL
END
WHERE lx_stage = 'labs' AND lx_focus IS NULL AND lx_topic IS NOT NULL AND lx_topic != 'General Troubleshooting';