import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se o usuário é admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const prisma = new PrismaClient()

    // Verificar se a tabela ApiToken existe
    try {
      await prisma.apiToken.findFirst()
      await prisma.$disconnect()
      return NextResponse.json({ message: "A tabela ApiToken já existe." })
    } catch (error) {
      // A tabela não existe, vamos criá-la
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
    await prisma.$disconnect()

    return NextResponse.json({ message: "Tabela ApiToken criada com sucesso!" })
  } catch (error) {
    console.error("Erro ao criar tabela ApiToken:", error)
    return NextResponse.json({ error: "Erro ao criar tabela ApiToken" }, { status: 500 })
  }
}
