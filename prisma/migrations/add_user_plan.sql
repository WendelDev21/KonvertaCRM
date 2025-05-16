-- Adicionar a coluna plan à tabela User se ela não existir
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'starter';
