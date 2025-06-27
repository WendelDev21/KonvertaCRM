import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateReport } from "@/lib/services/report-service"

// POST /api/reports/generate - Gerar um novo relatório
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const { format, period, startDate, endDate, includeContacts, includeFinancial } = data

    if (!format || !period || (!includeContacts && !includeFinancial)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    if (period === "custom" && (!startDate || !endDate)) {
      return NextResponse.json({ error: "Datas personalizadas são obrigatórias" }, { status: 400 })
    }

    // Gerar o relatório
    const { fileContent, contentType, fileName } = await generateReport({
      userId: "system", // Placeholder para manter compatibilidade
      format,
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeContacts,
      includeFinancial,
    })

    // Salvar o registro do relatório no banco de dados
    await prisma.report.create({
      data: {
        userId: "system", // Placeholder para manter compatibilidade
        format,
        period,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        includeContacts,
        includeFinancial,
        fileName,
      },
    })

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
