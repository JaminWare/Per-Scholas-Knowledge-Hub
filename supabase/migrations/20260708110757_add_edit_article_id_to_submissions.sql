/*
# Add edit_article_id column to submissions table

1. Modified Tables
   - `submissions`
     - Added `edit_article_id` (uuid, nullable) — references the original article
       being edited. When NULL, the submission is a brand-new contribution.
       When populated, it is an "Edit Suggestion" that the admin must approve
       before the live article is mutated.

2. Security
   - No RLS changes needed — the existing INSERT policy allows any columns
     the schema accepts, and the uuid column is nullable (no length check needed).
   - The column has no foreign key constraint intentionally: if the original
     article is ever deleted, the edit suggestion record remains for audit history.

3. Important Notes
   - This column gates article edits behind admin moderation.
   - The frontend will INSERT into submissions with submission_type = 'Edit Suggestion'
     and edit_article_id = <original article uuid>.
   - The admin approval handler reads edit_article_id to know which article to UPDATE.
*/

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS edit_article_id uuid DEFAULT NULL;
