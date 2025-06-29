import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateReport } from "@/lib/services/report-service"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/reports/[id]/download - Baixar um relatório específico do usuário
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const reportId = params.id

      const report = await prisma.report.findFirst({
        where: {
          id: reportId,
          userId: userId,
        },
      })

      if (!report) {
        return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 })
      }

      // Relatório encontrado com sucesso
      console.log(`Relatório encontrado com sucesso: ${report.id} para usuário ${userId}`)

      // Regenerar o relatório com base nos parâmetros salvos
      const { format, period, startDate, endDate, includeContacts, includeFinancial } = report

      // Gerar o relatório
      const { fileContent, contentType, fileName } = await generateReport({
        userId: userId,
        format: format as "pdf" | "csv",
        period: period as "7d" | "30d" | "90d" | "1y" | "custom",
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeContacts,
        includeFinancial,
      })

      // Relatório gerado e pronto para download
      console.log(`Download do relatório iniciado com sucesso: ${fileName}`)

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
  })
}
