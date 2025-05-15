-- Criar tabela de tokens de API
CREATE TABLE IF NOT EXISTS "ApiToken" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'API Token',
  "userId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsed" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  
  CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE UNIQUE INDEX IF NOT EXISTS "ApiToken_token_key" ON "ApiToken"("token");
CREATE INDEX IF NOT EXISTS "ApiToken_userId_idx" ON "ApiToken"("userId");
CREATE INDEX IF NOT EXISTS "ApiToken_token_idx" ON "ApiToken"("token");

-- Adicionar chave estrangeira
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
