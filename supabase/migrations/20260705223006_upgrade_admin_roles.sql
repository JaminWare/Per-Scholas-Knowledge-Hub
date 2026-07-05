/*
# Create admin_whitelist Table with Tiered RBAC

## Summary
Creates a database-driven admin whitelist table that replaces the hardcoded
ADMIN_EMAILS array. Introduces tiered role-based access control where only
users with `can_manage_admins = true` can invite/revoke other admins.

## New Tables
- `admin_whitelist`
  - `id` (uuid, primary key, auto-generated)
  - `email` (text, unique, not null) - the admin's email address
  - `can_manage_admins` (boolean, default false) - whether this admin can invite/revoke others
  - `created_at` (timestamptz, default now()) - when the admin was added

## Seed Data
- `jamindware@gmail.com` with `can_manage_admins = true` (system owner)
- `redeemgrimm@gmail.com` with `can_manage_admins = false` (standard admin)

## Security
- RLS enabled on `admin_whitelist`.
- SELECT: any authenticated user can read the whitelist (needed for auth gate checks).
- INSERT: only authenticated users whose email is in the whitelist AND has `can_manage_admins = true`.
- UPDATE: only authenticated users whose email is in the whitelist AND has `can_manage_admins = true`.
- DELETE: only authenticated users whose email is in the whitelist AND has `can_manage_admins = true`.

## Important Notes
1. This table is the single source of truth for admin access. The hardcoded
   ADMIN_EMAILS constant in the frontend is being removed in favor of this table.
2. The system owner (jamindware@gmail.com) is the only user initially authorized
   to invite new admins or grant invite privileges.
3. Standard admins can only moderate content; they cannot see or use the Access Control tab.
*/

-- ── Create table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  can_manage_admins boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Enable RLS ──────────────────────────────────────────────────────────────
ALTER TABLE admin_whitelist ENABLE ROW LEVEL SECURITY;

-- ── Seed data ───────────────────────────────────────────────────────────────
INSERT INTO admin_whitelist (email, can_manage_admins)
VALUES
  ('jamindware@gmail.com', true),
  ('redeemgrimm@gmail.com', false)
ON CONFLICT (email) DO UPDATE
  SET can_manage_admins = EXCLUDED.can_manage_admins;

-- ── RLS Policies ────────────────────────────────────────────────────────────

-- SELECT: authenticated users can read the whitelist (auth gate needs this)
DROP POLICY IF EXISTS "authenticated_select_admin_whitelist" ON admin_whitelist;
CREATE POLICY "authenticated_select_admin_whitelist" ON admin_whitelist
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: only admins with can_manage_admins = true
DROP POLICY IF EXISTS "manager_insert_admin_whitelist" ON admin_whitelist;
CREATE POLICY "manager_insert_admin_whitelist" ON admin_whitelist
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_whitelist
      WHERE email = (SELECT auth.jwt()->>'email')
        AND can_manage_admins = true
    )
  );

-- UPDATE: only admins with can_manage_admins = true
DROP POLICY IF EXISTS "manager_update_admin_whitelist" ON admin_whitelist;
CREATE POLICY "manager_update_admin_whitelist" ON admin_whitelist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_whitelist
      WHERE email = (SELECT auth.jwt()->>'email')
        AND can_manage_admins = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_whitelist
      WHERE email = (SELECT auth.jwt()->>'email')
        AND can_manage_admins = true
    )
  );

-- DELETE: only admins with can_manage_admins = true
DROP POLICY IF EXISTS "manager_delete_admin_whitelist" ON admin_whitelist;
CREATE POLICY "manager_delete_admin_whitelist" ON admin_whitelist
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_whitelist
      WHERE email = (SELECT auth.jwt()->>'email')
        AND can_manage_admins = true
    )
  );
