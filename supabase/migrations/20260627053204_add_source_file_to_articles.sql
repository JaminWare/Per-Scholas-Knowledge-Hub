/*
# Add source_file column to articles

## What this does
Adds a `source_file` column to the `articles` table to track the original
source document each article was derived from (e.g., "Firewall_Basics.html").

## Changes
- `articles.source_file` (text, nullable) — stores the verbatim filename of the
  original source document for provenance tracking.
*/

ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_file text;
