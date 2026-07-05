/*
# Tighten RLS policies on name_change_requests

## Problem
Two policies had always-true predicates that the security scanner correctly flagged:
1. INSERT `WITH CHECK (true)` — no constraint on the submitted data.
2. UPDATE `USING (true) WITH CHECK (true)` — no constraint on what can be changed or to what.

## Changes

### INSERT policy
- Replaced `WITH CHECK (true)` with a real data-validity check:
  - Both `current_name` and `requested_name` must be non-empty (trimmed).
  - The two names must differ.
  - Each name must be at most 120 characters (prevents oversized payloads).
- Role remains `anon, authenticated` — any visitor can submit a request.

### UPDATE policy
- `USING (status = 'pending')` — admins can only act on rows still pending;
  already-decided rows are immutable.
- `WITH CHECK (status IN ('approved', 'rejected'))` — the only allowed state
  transitions are to 'approved' or 'rejected'; you cannot revert to 'pending'
  or set an arbitrary string.
- Role remains `authenticated` — only signed-in admins can approve/reject.

## Security notes
- No data is deleted; existing rows are untouched.
- SELECT policy is unchanged (authenticated read-all for admin queue view).
*/

-- ── INSERT: replace always-true check with data-validity predicate ──────────
DROP POLICY IF EXISTS "anyone_can_insert_name_requests" ON name_change_requests;
CREATE POLICY "anyone_can_insert_name_requests"
  ON name_change_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(current_name))   BETWEEN 1 AND 120
    AND length(trim(requested_name)) BETWEEN 1 AND 120
    AND trim(current_name) <> trim(requested_name)
  );

-- ── UPDATE: restrict to pending rows and valid terminal statuses ─────────────
DROP POLICY IF EXISTS "authenticated_can_update_name_requests" ON name_change_requests;
CREATE POLICY "authenticated_can_update_name_requests"
  ON name_change_requests FOR UPDATE
  TO authenticated
  USING  (status = 'pending')
  WITH CHECK (status IN ('approved', 'rejected'));