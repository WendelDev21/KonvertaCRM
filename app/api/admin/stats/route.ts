import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/lib/auth-utils"
import type { NextRequest } from "next/server"

// GET /api/admin/stats - Obtém estatísticas gerais do sistema (apenas admin)
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(
    request,
    async (req, userId) => {
      try {
        // Contar usuários por plano
        const usersByPlan = await prisma.user.groupBy({
          by: ["plan"],
          _count: {
            id: true,
          },
        })

        // Contar usuários por função
        const usersByRole = await prisma.user.groupBy({
          by: ["role"],
          _count: {
            id: true,
          },
        })

        // Contar tokens ativos
        const activeTokensCount = await prisma.apiToken.count({
          where: {
            isActive: true, // Corrigido: usando isActive em vez de revoked
          },
        })

        // Contar novos usuários nos últimos 30 dias
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const newUsersCount = await prisma.user.count({
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        })

        // Estatísticas gerais
        const stats = {
          usersByPlan: usersByPlan.map((item) => ({
            plan: item.plan,
            count: item._count.id,
          })),
          usersByRole: usersByRole.map((item) => ({
            role: item.role,
            count: item._count.id,
          })),
          activeTokens: activeTokensCount,
          newUsers30Days: newUsersCount,
          totalUsers: await prisma.user.count(),
          totalContacts: await prisma.contact.count(),
        }

        return NextResponse.json(stats)
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
      }
    },
    true, // true indica que requer admin
  )
}
