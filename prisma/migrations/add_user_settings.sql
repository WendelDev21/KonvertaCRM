-- Adicionar campos para configurações do usuário
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "theme" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationSettings" TEXT;
