/*
# Harden notify_sheets_on_submission Function

## What this fixes
Three security advisories raised against `public.notify_sheets_on_submission`:

1. Mutable search_path — function did not pin its search_path, allowing a
   malicious caller to shadow built-ins via schema injection.
   Fix: add `SET search_path = ''` and use fully-qualified identifiers inside.

2. anon role can call SECURITY DEFINER function via RPC — the function inherited
   the default PUBLIC EXECUTE grant, making it callable by unauthenticated users.
   Fix: revoke EXECUTE from PUBLIC, anon, and authenticated.

3. authenticated role can call SECURITY DEFINER function via RPC — same root cause.
   Fix: same revocation. The function is a trigger-only internal helper and must
   never be reachable as an RPC endpoint.

## Result
- Function runs with a fixed, empty search_path (all names fully qualified).
- Only the Postgres trigger mechanism can invoke it — no role can call it directly.
*/

-- Recreate function with a pinned, empty search_path and fully-qualified names.
CREATE OR REPLACE FUNCTION public.notify_sheets_on_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://uqhpfkmiceqjopoxmldl.supabase.co/functions/v1/sync-to-sheets',
    'POST',
    '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaHBma21pY2Vxam9wb3htbGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjAyMzIsImV4cCI6MjA5Nzk5NjIzMn0.WwM5zTzz6Ng7RKl4Seo13lLoRc3p7Y1sJYnyKaRopqA"}'::jsonb,
    to_jsonb(NEW),
    5000
  );
  RETURN NEW;
END;
$$;

-- Strip the default PUBLIC EXECUTE grant so no role can call this as an RPC.
REVOKE ALL ON FUNCTION public.notify_sheets_on_submission() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_sheets_on_submission() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_sheets_on_submission() FROM authenticated;
