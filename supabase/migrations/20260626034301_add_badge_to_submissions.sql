-- Add badge column to submissions for contributor role tracking
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS badge text DEFAULT 'Cohort Contributor';