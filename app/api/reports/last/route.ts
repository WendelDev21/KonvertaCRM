import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/reports/last - Obter o último relatório gerado pelo usuário
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const report = await prisma.report.findFirst({
        where: {
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
      })

      if (!report) {
        return NextResponse.json({ error: "Nenhum relatório encontrado" }, { status: 404 })
      }

      return NextResponse.json(report)
    } catch (error) {
      console.error("Erro ao buscar último relatório:", error)
      return NextResponse.json({ error: "Erro ao buscar último relatório" }, { status: 500 })
    }
  })
}
