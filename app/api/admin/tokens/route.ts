import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/admin/tokens - Lista todos os tokens ativos por usuário
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
      }

      // Obter query params
      const searchParams = request.nextUrl.searchParams
      const userIdParam = searchParams.get("userId")

      // Construir filtro
      const filter: any = {}

      // Se o userId foi fornecido, filtrar por ele
      if (userIdParam) {
        filter.userId = userIdParam
      }

      // Verificar se o campo isActive existe no modelo ApiToken
      let hasIsActiveField = false
      try {
        // Tentar obter um token para verificar a estrutura
        const testToken = await prisma.apiToken.findFirst({
          select: { id: true },
          take: 1,
        })

        // Se chegou aqui, a tabela existe
        // Agora verificamos se o campo isActive existe usando uma consulta raw
        const tableInfo = await prisma.$queryRaw`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'ApiToken' 
          AND column_name = 'isActive'
        `

        // Se a consulta retornar resultados, o campo existe
        hasIsActiveField = Array.isArray(tableInfo) && (tableInfo as any[]).length > 0

        console.log("Campo isActive existe:", hasIsActiveField)

        // Adicionar isActive ao filtro apenas se o campo existir
        if (hasIsActiveField) {
          filter.isActive = true
        }
      } catch (error) {
        console.error("Erro ao verificar campo isActive:", error)
        // Se ocorrer um erro, assumimos que o campo não existe
        // e continuamos sem adicionar isActive ao filtro
      }

      console.log("Filtro aplicado:", filter)

      // Buscar tokens com informações do usuário
      const tokens = await prisma.apiToken.findMany({
        where: filter,
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsed: true,
          expiresAt: true,
          ...(hasIsActiveField ? { isActive: true } : {}),
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json(tokens)
    } catch (error) {
      console.error("Error fetching tokens:", error)
      return NextResponse.json(
        {
          error: "Erro ao buscar tokens",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}

// DELETE /api/admin/tokens - Revoga todos os tokens ou um token específico
export async function DELETE(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
      }

      // Obter query params
      const searchParams = request.nextUrl.searchParams
      const tokenId = searchParams.get("id")
      const userIdParam = searchParams.get("userId")

      // Construir filtro
      const filter: any = {}

      // Se o tokenId foi fornecido, filtrar por ele
      if (tokenId) {
        filter.id = tokenId
      }

      // Se o userId foi fornecido, filtrar por ele
      if (userIdParam) {
        filter.userId = userIdParam
      }

      // Verificar se o campo isActive existe no modelo ApiToken
      let hasIsActiveField = false
      try {
        const tableInfo = await prisma.$queryRaw`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'ApiToken' 
          AND column_name = 'isActive'
        `

        hasIsActiveField = Array.isArray(tableInfo) && (tableInfo as any[]).length > 0
        console.log("Campo isActive existe para DELETE:", hasIsActiveField)
      } catch (error) {
        console.error("Erro ao verificar campo isActive para DELETE:", error)
      }

      // Se o campo isActive existir, usamos updateMany para marcar como inativo
      // Caso contrário, usamos deleteMany para remover os tokens
      let result

      if (hasIsActiveField) {
        // Adicionar isActive ao filtro apenas se estivermos atualizando
        filter.isActive = true

        // Revogar tokens (marcar como inativos)
        result = await prisma.apiToken.updateMany({
          where: filter,
          data: {
            isActive: false,
          },
        })

        return NextResponse.json({
          success: true,
          revokedCount: result.count,
          message: tokenId
            ? "Token revogado com sucesso"
            : userIdParam
              ? "Todos os tokens do usuário foram revogados"
              : "Todos os tokens foram revogados",
        })
      } else {
        // Se o campo isActive não existir, excluímos os tokens
        result = await prisma.apiToken.deleteMany({
          where: filter,
        })

        return NextResponse.json({
          success: true,
          deletedCount: result.count,
          message: tokenId
            ? "Token excluído com sucesso"
            : userIdParam
              ? "Todos os tokens do usuário foram excluídos"
              : "Todos os tokens foram excluídos",
        })
      }
    } catch (error) {
      console.error("Error revoking tokens:", error)
      return NextResponse.json(
        {
          error: "Erro ao revogar tokens",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}
