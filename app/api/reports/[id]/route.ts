import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/reports/[id] - Obter um relatório específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id

    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
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
    const reportId = params.id

    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
    })

    if (!report) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 })
    }

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
