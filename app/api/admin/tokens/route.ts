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
      const filter: any = {
        isActive: true,
      }

      // Se o userId foi fornecido, filtrar por ele
      if (userIdParam) {
        filter.userId = userIdParam
      }

      // Buscar tokens com informações do usuário
      const tokens = await prisma.apiToken.findMany({
        where: filter,
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsed: true,
          expiresAt: true,
          isActive: true,
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
      return NextResponse.json({ error: "Erro ao buscar tokens" }, { status: 500 })
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
      const filter: any = {
        isActive: true,
      }

      // Se o tokenId foi fornecido, filtrar por ele
      if (tokenId) {
        filter.id = tokenId
      }

      // Se o userId foi fornecido, filtrar por ele
      if (userIdParam) {
        filter.userId = userIdParam
      }

      // Revogar tokens (marcar como inativos)
      const result = await prisma.apiToken.updateMany({
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
    } catch (error) {
      console.error("Error revoking tokens:", error)
      return NextResponse.json({ error: "Erro ao revogar tokens" }, { status: 500 })
    }
  })
}
