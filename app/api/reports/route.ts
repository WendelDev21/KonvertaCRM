import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/reports - Listar todos os relatórios do usuário
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const reports = await prisma.report.findMany({
        where: {
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json(reports)
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error)
      return NextResponse.json({ error: "Erro ao buscar relatórios" }, { status: 500 })
    }
  })
}

// POST /api/reports - Criar um novo relatório para o usuário
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const data = await request.json()

      const { fileName, format, period, includeContacts, includeFinancial } = data

      if (!fileName) {
        return NextResponse.json({ error: "Nome do arquivo é obrigatório" }, { status: 400 })
      }

      const report = await prisma.report.create({
        data: {
          userId: userId,
          fileName,
          format: format || "pdf",
          period: period || "30d",
          includeContacts: includeContacts || true,
          includeFinancial: includeFinancial || true,
        },
      })

      return NextResponse.json(report)
    } catch (error) {
      console.error("Erro ao criar relatório:", error)
      return NextResponse.json({ error: "Erro ao criar relatório" }, { status: 500 })
    }
  })
}

// DELETE /api/reports - Excluir todos os relatórios do usuário
export async function DELETE(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      await prisma.report.deleteMany({
        where: {
          userId: userId,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Erro ao excluir relatórios:", error)
      return NextResponse.json({ error: "Erro ao excluir relatórios" }, { status: 500 })
    }
  })
}
