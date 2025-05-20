import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Verificar se a tabela ApiToken existe
    let tableExists = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM "ApiToken" LIMIT 1`
      tableExists = true
    } catch (error) {
      console.log("Tabela ApiToken não existe, será criada")
    }

    if (!tableExists) {
      // Criar a tabela ApiToken usando SQL raw
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ApiToken" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "permissions" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "lastUsed" TIMESTAMP(3),
          "expiresAt" TIMESTAMP(3),
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "userId" TEXT NOT NULL,
          
          CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ApiToken_token_key" UNIQUE ("token"),
          CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `

      return NextResponse.json({
        success: true,
        message: "Tabela ApiToken criada com sucesso",
      })
    }

    // Verificar se o campo isActive existe
    let hasIsActiveField = false
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ApiToken' 
        AND column_name = 'isActive'
      `

      hasIsActiveField = Array.isArray(tableInfo) && (tableInfo as any[]).length > 0
    } catch (error) {
      console.error("Erro ao verificar campo isActive:", error)
    }

    // Se o campo isActive não existir, adicioná-lo
    if (!hasIsActiveField) {
      await prisma.$executeRaw`
        ALTER TABLE "ApiToken" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true
      `

      return NextResponse.json({
        success: true,
        message: "Campo isActive adicionado à tabela ApiToken",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Tabela ApiToken já existe e possui o campo isActive",
    })
  } catch (error) {
    console.error("Erro ao configurar tabela ApiToken:", error)
    return NextResponse.json(
      {
        error: "Erro ao configurar tabela ApiToken",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
