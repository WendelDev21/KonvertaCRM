-- Verificar se a tabela ApiToken já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ApiToken') THEN
        -- Criar tabela ApiToken
        CREATE TABLE "ApiToken" (
            "id" TEXT NOT NULL,
            "token" TEXT NOT NULL,
            "name" TEXT,
            "lastUsed" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" TIMESTAMP(3),
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "userId" TEXT NOT NULL,
            
            CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
        );
        
        -- Adicionar índices
        CREATE UNIQUE INDEX "ApiToken_token_key" ON "ApiToken"("token");
        CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId");
        
        -- Adicionar chave estrangeira
        ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            
        RAISE NOTICE 'Tabela ApiToken criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela ApiToken já existe';
    END IF;
END
$$;
