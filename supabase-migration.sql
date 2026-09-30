-- Run this in the Supabase SQL editor to set up the database and storage.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create the photobooths table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photobooths (
  id           TEXT        PRIMARY KEY,
  image_url    TEXT        NOT NULL,
  filter       TEXT        NOT NULL DEFAULT 'original',
  music_url    TEXT,
  music_provider TEXT,
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: public read access (anyone with the ID can view)
ALTER TABLE photobooths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON photobooths
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Storage bucket (run separately or via Supabase dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
-- Dashboard: Storage → New bucket → Name: "photobooth-strips" → Public: ON
--
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('photobooth-strips', 'photobooth-strips', true)
ON CONFLICT (id) DO NOTHING;

-- Allow the service role (used in API routes) to upload files
CREATE POLICY "Service role upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photobooth-strips');

-- Allow public to read files
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'photobooth-strips');
