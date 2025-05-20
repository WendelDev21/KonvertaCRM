-- Adiciona o campo isActive à tabela ApiToken
ALTER TABLE "ApiToken" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
