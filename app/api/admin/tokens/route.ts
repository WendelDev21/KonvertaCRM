import { type NextRequest, NextResponse } from "next/server"
import { apiAuthMiddleware } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

/**
 * GET /api/admin/tokens
 * Lista todos os tokens (apenas admin)
 */
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(
    request,
    async (req, userId) => {
      try {
        // Buscar todos os tokens
        const tokens = await prisma.apiToken.findMany({
          include: {
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

        return NextResponse.json({ tokens })
      } catch (error) {
        console.error("Erro ao buscar tokens:", error)
        return NextResponse.json({ error: "Erro ao buscar tokens" }, { status: 500 })
      }
    },
    true, // requireAdmin = true
  )
}
