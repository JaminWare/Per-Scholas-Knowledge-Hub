-- Drop the rogue trigger that unconditionally overwrites track on ALL submissions.
-- It has NO type guard (unlike trg_normalize_deskolas which checks IF NEW.type = 'deskolas').
-- This trigger was destroying Learner Experience track values on insert.

DROP TRIGGER IF EXISTS trigger_normalize_track ON submissions;
DROP FUNCTION IF EXISTS normalize_deskolas_track();
