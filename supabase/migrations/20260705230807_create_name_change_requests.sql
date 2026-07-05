/*
# Create name_change_requests table (moderated name change queue)

1. New Tables
   - `name_change_requests`
     - `id` (uuid, primary key, auto-generated)
     - `current_name` (text, not null) - the display name user currently has
     - `requested_name` (text, not null) - the display name user wants to change to
     - `status` (text, not null, default 'pending') - pending/approved/rejected
     - `created_at` (timestamptz, default now()) - when the request was submitted

2. Security
   - Enable RLS on `name_change_requests`.
   - INSERT policy for anon + authenticated (any user can submit a request).
   - SELECT policy for authenticated users (admins viewing the queue).
   - UPDATE policy for authenticated users (admins approving/rejecting).
   - NO DELETE policy — requests are never removed, only status-changed.

3. Important Notes
   - This table gates name changes behind admin moderation.
   - Users submit requests; admins approve/reject from the admin panel.
   - The actual bulk UPDATE to submissions/articles only happens on admin approval.
*/

CREATE TABLE IF NOT EXISTS name_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_name text NOT NULL,
  requested_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE name_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_insert_name_requests" ON name_change_requests;
CREATE POLICY "anyone_can_insert_name_requests"
  ON name_change_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_can_select_name_requests" ON name_change_requests;
CREATE POLICY "authenticated_can_select_name_requests"
  ON name_change_requests FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_can_update_name_requests" ON name_change_requests;
CREATE POLICY "authenticated_can_update_name_requests"
  ON name_change_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);