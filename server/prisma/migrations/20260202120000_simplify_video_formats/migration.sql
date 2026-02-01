-- Simplify video_formats: single video_url instead of HLS manifest/segment columns
-- Add video_url if missing (for DBs created from init migration)
ALTER TABLE "video_formats" ADD COLUMN IF NOT EXISTS "video_url" TEXT;

-- Drop old HLS/segment columns (safe if already dropped)
ALTER TABLE "video_formats" DROP COLUMN IF EXISTS "manifest_url";
ALTER TABLE "video_formats" DROP COLUMN IF EXISTS "segment_base_url";
ALTER TABLE "video_formats" DROP COLUMN IF EXISTS "segment_duration";
ALTER TABLE "video_formats" DROP COLUMN IF EXISTS "segment_count";
