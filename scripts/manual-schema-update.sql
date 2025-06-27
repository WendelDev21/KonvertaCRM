-- Execute estas consultas SQL manualmente se o script automático falhar

-- Adicionar coluna de tema se não existir
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "theme" TEXT;

-- Adicionar coluna de configurações de notificação se não existir
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationSettings" TEXT;
