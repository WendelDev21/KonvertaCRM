import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generateReport } from "@/lib/services/report-service"

// GET /api/reports/[id]/download - Baixar um relatório específico
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

    // Regenerar o relatório com base nos parâmetros salvos
    const { format, period, startDate, endDate, includeContacts, includeFinancial } = report

    // Gerar o relatório
    const { fileContent, contentType, fileName } = await generateReport({
      userId,
      format: format as "pdf" | "csv",
      period: period as "7d" | "30d" | "90d" | "1y" | "custom",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeContacts,
      includeFinancial,
    })

    // Retornar o arquivo
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Erro ao baixar relatório:", error)
    return NextResponse.json({ error: "Erro ao baixar relatório" }, { status: 500 })
  }
}
