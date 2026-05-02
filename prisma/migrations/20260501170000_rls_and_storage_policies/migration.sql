-- RLS policies + Storage bucket configuration + status decorative pin.
--
-- This migration is intentionally idempotent so it is safe to run on:
--   (a) a fresh Supabase project for the first time,
--   (b) the existing Supabase project where the policies were already
--       applied via the Management API at provisioning time.
-- Re-running has no effect on already-correct rows; running on a
-- fresh project produces the V1 security posture in one shot.
--
-- This migration was originally applied out-of-band via the Supabase
-- MCP at project creation. Committing it here closes the
-- reproducibility gap a code-review surfaced.

-- =====================================================================
-- PROJECT + PUNCHITEM RLS
-- =====================================================================

ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PunchItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read projects" ON "Project";
DROP POLICY IF EXISTS "Service role write projects" ON "Project";
DROP POLICY IF EXISTS "Public read items" ON "PunchItem";
DROP POLICY IF EXISTS "Service role write items" ON "PunchItem";

-- Public read: V1 is single-tenant demo, anon SELECT is the design.
-- When auth lands in V2, scope these to auth.uid() through a
-- membership table.
CREATE POLICY "Public read projects" ON "Project"
  FOR SELECT USING (true);

CREATE POLICY "Public read items" ON "PunchItem"
  FOR SELECT USING (true);

-- Writes only via service role (Server Actions). Browser-side anon
-- writes are denied by default since no INSERT/UPDATE/DELETE policy
-- exists for the anon role — RLS without a policy is implicit deny.
CREATE POLICY "Service role write projects" ON "Project"
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role write items" ON "PunchItem"
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================================
-- STORAGE BUCKET (punch-photos) — public read, service-role write,
-- 10MB max, image MIME whitelist.
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'punch-photos',
  'punch-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read punch-photos" ON storage.objects;
DROP POLICY IF EXISTS "Service role write punch-photos" ON storage.objects;
DROP POLICY IF EXISTS "Service role update punch-photos" ON storage.objects;
DROP POLICY IF EXISTS "Service role delete punch-photos" ON storage.objects;

CREATE POLICY "Public read punch-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'punch-photos');

CREATE POLICY "Service role write punch-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'punch-photos' AND auth.role() = 'service_role');

CREATE POLICY "Service role update punch-photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'punch-photos' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'punch-photos' AND auth.role() = 'service_role');

CREATE POLICY "Service role delete punch-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'punch-photos' AND auth.role() = 'service_role');

-- =====================================================================
-- Project.status decorative pin
--
-- The `status` column is never written to by app code — project
-- status is computed at render time from item counts. Pin the
-- column so any future write fails loudly instead of silently
-- shipping a wrong dashboard.
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Project_status_decorative_check'
  ) THEN
    ALTER TABLE "Project"
      ADD CONSTRAINT "Project_status_decorative_check"
      CHECK (status = 'active');
  END IF;
END $$;
