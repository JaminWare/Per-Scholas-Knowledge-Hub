/*
# Fix admin_audit_logs RLS policies

1. Security Changes
   - DROP all four existing INSERT policies on `admin_audit_logs` that had
     unrestricted `WITH CHECK (true)` clauses.
   - Replace with a single INSERT policy that enforces the authenticated user's
     email must match the `admin_email` column being written. This prevents any
     authenticated user from forging audit entries under another user's identity.
   - Keep the SELECT policy as-is (all authenticated users can read the full
     audit trail — this is correct for admin visibility).

2. Important Notes
   - The new INSERT constraint uses `auth.jwt() ->> 'email'` to compare against
     the `admin_email` column, ensuring only the actual user can log actions
     attributed to their email.
   - The table remains append-only (no UPDATE/DELETE policies).
*/

-- Drop the duplicate/permissive INSERT policies
DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON admin_audit_logs;
DROP POLICY IF EXISTS "authenticated_insert_audit_logs" ON admin_audit_logs;

-- Drop the duplicate SELECT policies and keep one
DROP POLICY IF EXISTS "Allow select for authenticated users" ON admin_audit_logs;
DROP POLICY IF EXISTS "authenticated_select_audit_logs" ON admin_audit_logs;

-- Recreate a single restricted INSERT policy
CREATE POLICY "insert_own_audit_logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (admin_email = auth.jwt() ->> 'email');

-- Recreate a single SELECT policy (authenticated can view full trail)
CREATE POLICY "select_audit_logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (true);
