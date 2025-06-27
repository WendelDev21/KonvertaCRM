import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // 1. Valor total por status
    const byStatus = await prisma.contact.groupBy({
      by: ["status"],
      _sum: {
        value: true,
      },
    })

    const statusData: Record<string, number> = {
      Novo: 0,
      Conversando: 0,
      Interessado: 0,
      Fechado: 0,
      Perdido: 0,
    }

    byStatus.forEach((item) => {
      statusData[item.status] = item._sum.value || 0
    })

    // 2. Valor total por origem
    const bySource = await prisma.contact.groupBy({
      by: ["source"],
      _sum: {
        value: true,
      },
    })

    const sourceData: Record<string, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Outro: 0,
    }

    bySource.forEach((item) => {
      sourceData[item.source] = item._sum.value || 0
    })

    // 3. Valor total
    const total = await prisma.contact.aggregate({
      _sum: {
        value: true,
      },
    })

    // 4. Resumo financeiro
    const summary = {
      total: total._sum.value || 0,
      fechado: statusData.Fechado || 0,
      emNegociacao: statusData.Novo + statusData.Conversando + statusData.Interessado || 0,
      perdido: statusData.Perdido || 0,
    }

    return NextResponse.json({
      byStatus: statusData,
      bySource: sourceData,
      total: total._sum.value || 0,
      summary,
    })
  } catch (error) {
    console.error("Erro ao buscar dados financeiros:", error)
    return NextResponse.json({ error: "Erro ao buscar dados financeiros" }, { status: 500 })
  }
}
