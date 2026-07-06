/*
# Allow anonymous crash telemetry inserts on admin_audit_logs

1. Security Changes
   - Add a secondary INSERT policy on `admin_audit_logs` that permits
     unauthenticated (anon) and authenticated users to insert rows
     ONLY when `action_taken = 'frontend_crash'`.
   - This ensures crash telemetry is captured even when the user has not
     signed in (e.g. app crashes before login).
   - The existing `insert_own_audit_logs` policy remains unchanged for
     all other admin actions (still requires JWT email match).

2. Important Notes
   - The new policy is scoped to a single action type, preventing abuse
     of the anon INSERT path for arbitrary audit log entries.
   - The table remains append-only (no UPDATE/DELETE policies exist).
   - SELECT remains restricted to authenticated users only.
*/

DROP POLICY IF EXISTS "anon_insert_crash_telemetry" ON admin_audit_logs;
CREATE POLICY "anon_insert_crash_telemetry"
  ON admin_audit_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (action_taken = 'frontend_crash');
