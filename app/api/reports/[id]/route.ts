import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/reports/[id] - Obter um relatório específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const reportId = params.id

    // Buscar o relatório
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    })

    if (!report) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Erro ao buscar relatório:", error)
    return NextResponse.json({ error: "Erro ao buscar relatório" }, { status: 500 })
  }
}

// DELETE /api/reports/[id] - Excluir um relatório específico
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const reportId = params.id

    // Verificar se o relatório existe
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
      },
    })

    if (!report) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 })
    }

    // Excluir o relatório
    await prisma.report.delete({
      where: {
        id: reportId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir relatório:", error)
    return NextResponse.json({ error: "Erro ao excluir relatório" }, { status: 500 })
  }
}
