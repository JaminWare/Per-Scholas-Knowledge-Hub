/*
# Create Database Webhook Trigger for Submissions → Google Sheets

## What this does
Creates a PostgreSQL trigger on the `submissions` table that automatically calls
the deployed `sync-to-sheets` Edge Function whenever a new row is inserted.
This replaces manual webhook configuration in the Supabase Dashboard UI.

## How it works
1. On every INSERT into `public.submissions`, Postgres calls `supabase_functions.http_request()`
2. That function fires an async HTTP POST to the Edge Function endpoint
3. The Edge Function forwards the new row to your Google Apps Script Web App
4. Google Sheets appends the row — no dashboard clicks required

## Notes
- Uses `supabase_functions.http_request` which is built into every Supabase project
- The call is non-blocking (fire-and-forget via pg_net); it won't slow down inserts
- The trigger is idempotent — DROP IF EXISTS before CREATE ensures safe re-runs
- Timeout is set to 5000ms (5 seconds) per request
*/

-- Drop existing trigger safely before (re)creating
DROP TRIGGER IF EXISTS sync_submissions_to_sheets_trigger ON public.submissions;

-- Drop existing function wrapper safely
DROP FUNCTION IF EXISTS public.notify_sheets_on_submission();

-- Wrapper function that calls the Edge Function via HTTP
CREATE OR REPLACE FUNCTION public.notify_sheets_on_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Attach trigger: fires AFTER every INSERT on submissions
CREATE TRIGGER sync_submissions_to_sheets_trigger
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_sheets_on_submission();
