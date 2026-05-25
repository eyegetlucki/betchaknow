-- Migration 002: add vibe, min_level, language to clubs table
-- Run once against your Supabase project (SQL Editor or psql)

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS vibe      TEXT    DEFAULT 'Friendly',
  ADD COLUMN IF NOT EXISTS min_level INT     DEFAULT 1,
  ADD COLUMN IF NOT EXISTS language  TEXT    DEFAULT NULL;

-- banner_style already exists; repurposed to store the CSS gradient string
-- (no schema change needed for that column)
