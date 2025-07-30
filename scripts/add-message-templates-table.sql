-- Criar tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Geral',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "MessageTemplate_userId_idx" ON "MessageTemplate"("userId");
CREATE INDEX IF NOT EXISTS "MessageTemplate_category_idx" ON "MessageTemplate"("category");
CREATE INDEX IF NOT EXISTS "MessageTemplate_createdAt_idx" ON "MessageTemplate"("createdAt");
