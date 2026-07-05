/*
# Add status column to submissions for soft-delete workflow

## Summary
Adds a `status` text column to the `submissions` table to replace hard deletes
with a soft-delete workflow. Previously rejected submissions were permanently
deleted; now they are marked with status = 'rejected' and preserved for audit.

## New Columns on `submissions`
1. `status` (TEXT, NOT NULL, DEFAULT 'pending')
   - Possible values: 'pending', 'approved', 'rejected'
   - Replaces the old boolean `is_approved` as the canonical state indicator

## Data Backfill
- Rows with `is_approved = true` get status = 'approved'
- Rows with `is_approved = false` get status = 'pending'

## Notes
- The `is_approved` column is kept for backwards compatibility (not dropped).
- Idempotent: uses DO $$ IF NOT EXISTS $$ block.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE submissions ADD COLUMN status text NOT NULL DEFAULT 'pending';

    -- Backfill from existing is_approved boolean
    UPDATE submissions SET status = 'approved' WHERE is_approved = true;
    UPDATE submissions SET status = 'pending' WHERE is_approved = false;
  END IF;
END $$;
