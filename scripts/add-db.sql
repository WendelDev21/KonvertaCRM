-- Add media fields to Campaign table
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "caption" TEXT;

-- Add media fields to MessageTemplate table
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "caption" TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "Campaign_mediaType_idx" ON "Campaign"("mediaType");
CREATE INDEX IF NOT EXISTS "MessageTemplate_mediaType_idx" ON "MessageTemplate"("mediaType");
