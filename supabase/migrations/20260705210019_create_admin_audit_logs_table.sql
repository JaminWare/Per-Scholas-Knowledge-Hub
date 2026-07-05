/*
# Create admin_audit_logs table (immutable audit trail)

1. New Tables
   - `admin_audit_logs`
     - `id` (uuid, primary key, auto-generated)
     - `admin_email` (text, not null) - email of admin who performed the action
     - `action_type` (text, not null) - e.g. APPROVED_SUBMISSION, REJECTED_SUBMISSION
     - `target_id` (text, not null) - ID of the submission acted upon
     - `target_title` (text, not null) - title of the submission at time of action
     - `created_at` (timestamptz, default now()) - immutable timestamp

2. Security
   - Enable RLS on `admin_audit_logs`.
   - INSERT policy for authenticated users only (admins performing actions).
   - SELECT policy for authenticated users only (admins viewing the trail).
   - NO UPDATE or DELETE policies — enforcing immutability at the database level.

3. Important Notes
   - This table is strictly append-only. Once a row is written, it cannot be
     modified or removed via the API.
   - The absence of UPDATE/DELETE policies means even authenticated users cannot
     alter or destroy audit records through the Supabase client.
*/

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action_type text NOT NULL,
  target_id text NOT NULL,
  target_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_audit_logs" ON admin_audit_logs;
CREATE POLICY "authenticated_insert_audit_logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_audit_logs" ON admin_audit_logs;
CREATE POLICY "authenticated_select_audit_logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (true);