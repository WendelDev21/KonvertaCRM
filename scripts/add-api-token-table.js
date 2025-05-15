// Script para adicionar a tabela ApiToken ao banco de dados
const { PrismaClient } = require("@prisma/client")

async function addApiTokenTable() {
  const prisma = new PrismaClient()

  try {
    console.log("Verificando se a tabela ApiToken existe...")

    // Tentar executar uma consulta na tabela ApiToken
    try {
      await prisma.apiToken.findFirst()
      console.log("A tabela ApiToken já existe.")
      return
    } catch (error) {
      console.log("A tabela ApiToken não existe. Criando...")
    }

    // Criar a tabela ApiToken
    const sql = `
      CREATE TABLE IF NOT EXISTS "ApiToken" (
        "id" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "name" TEXT,
        "lastUsed" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "userId" TEXT NOT NULL,
        
        CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ApiToken_token_key" UNIQUE ("token"),
        CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId");
      CREATE INDEX "ApiToken_token_idx" ON "ApiToken"("token");
    `

    await prisma.$executeRawUnsafe(sql)
    console.log("Tabela ApiToken criada com sucesso!")
  } catch (error) {
    console.error("Erro ao criar tabela ApiToken:", error)
  } finally {
    await prisma.$disconnect()
  }
}

addApiTokenTable()
