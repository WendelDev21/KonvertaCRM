import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/reports/last - Obter o último relatório gerado
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    // Buscar o último relatório gerado
    const report = await prisma.report.findFirst({
      where: { userId },
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
}
