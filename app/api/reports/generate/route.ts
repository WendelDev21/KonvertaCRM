import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateReport } from "@/lib/services/report-service"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// POST /api/reports/generate - Gerar um novo relatório para o usuário
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o content-type é JSON
      const contentType = request.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        return NextResponse.json(
          {
            error: "Content-Type deve ser application/json",
          },
          { status: 400 },
        )
      }

      // Tentar fazer o parse do JSON com tratamento de erro
      let data
      try {
        const body = await request.text()
        console.log("Raw body:", body) // Para debug
        data = JSON.parse(body)
      } catch (parseError) {
        console.error("Erro ao fazer parse do JSON:", parseError)
        return NextResponse.json(
          {
            error: "JSON inválido no corpo da requisição",
            details: parseError instanceof Error ? parseError.message : "Erro de parsing",
          },
          { status: 400 },
        )
      }

      const { format, period, startDate, endDate, includeContacts, includeFinancial } = data

      // Validações
      if (!format || !period) {
        return NextResponse.json(
          {
            error: "Parâmetros obrigatórios: format e period",
            received: { format, period },
          },
          { status: 400 },
        )
      }

      if (!["pdf", "csv"].includes(format)) {
        return NextResponse.json(
          {
            error: "Formato deve ser 'pdf' ou 'csv'",
            received: format,
          },
          { status: 400 },
        )
      }

      if (!["7d", "30d", "90d", "1y", "custom"].includes(period)) {
        return NextResponse.json(
          {
            error: "Período deve ser '7d', '30d', '90d', '1y' ou 'custom'",
            received: period,
          },
          { status: 400 },
        )
      }

      if (!includeContacts && !includeFinancial) {
        return NextResponse.json(
          {
            error: "Deve incluir pelo menos contatos ou dados financeiros",
            received: { includeContacts, includeFinancial },
          },
          { status: 400 },
        )
      }

      if (period === "custom" && (!startDate || !endDate)) {
        return NextResponse.json(
          {
            error: "Para período 'custom', startDate e endDate são obrigatórios (formato: YYYY-MM-DD)",
            received: { startDate, endDate },
          },
          { status: 400 },
        )
      }

      // Validar datas se fornecidas
      if (startDate && isNaN(Date.parse(startDate))) {
        return NextResponse.json(
          {
            error: "startDate deve estar no formato YYYY-MM-DD",
            received: startDate,
          },
          { status: 400 },
        )
      }

      if (endDate && isNaN(Date.parse(endDate))) {
        return NextResponse.json(
          {
            error: "endDate deve estar no formato YYYY-MM-DD",
            received: endDate,
          },
          { status: 400 },
        )
      }

      console.log("Gerando relatório com parâmetros:", {
        userId,
        format,
        period,
        startDate,
        endDate,
        includeContacts,
        includeFinancial,
      })

      // Gerar o relatório
      const {
        fileContent,
        contentType: reportContentType,
        fileName,
      } = await generateReport({
        userId: userId,
        format,
        period,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeContacts: includeContacts || false,
        includeFinancial: includeFinancial || false,
      })

      // Salvar o registro do relatório no banco de dados
      await prisma.report.create({
        data: {
          userId: userId,
          format,
          period,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          includeContacts: includeContacts || false,
          includeFinancial: includeFinancial || false,
          fileName,
        },
      })

      // Relatório salvo no banco de dados com sucesso
      console.log(`Relatório salvo no banco com sucesso para usuário ${userId}: ${fileName}`)

      console.log("Relatório gerado com sucesso:", fileName)

      // Sucesso: Relatório gerado e pronto para download
      console.log(
        `API /api/reports/generate executada com sucesso - Usuário: ${userId}, Formato: ${format}, Período: ${period}, Arquivo: ${fileName}`,
      )

      return new NextResponse(fileContent, {
        headers: {
          "Content-Type": reportContentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      return NextResponse.json(
        {
          error: "Erro interno do servidor ao gerar relatório",
          details: error instanceof Error ? error.message : "Erro desconhecido",
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      )
    }
  })
}
