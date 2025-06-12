import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    // Obter parâmetros da consulta
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    if (type === "contacts") {
      // Buscar contatos ordenados por valor
      const contacts = await prisma.contact.findMany({
        where: { userId },
        orderBy: { value: "desc" },
        select: {
          id: true,
          name: true,
          contact: true,
          status: true,
          source: true,
          value: true,
          createdAt: true,
        },
      })

      return NextResponse.json(contacts)
    } else {
      // Buscar dados financials agregados
      // 1. Valor total por status
      const byStatus = await prisma.contact.groupBy({
        by: ["status"],
        where: { userId },
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
        where: { userId },
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
        where: { userId },
        _sum: {
          value: true,
        },
      })

      // 4. Resumo financial
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
    }
  } catch (error) {
    console.error("Erro ao buscar dados financials:", error)
    return NextResponse.json({ error: "Erro ao buscar dados financials" }, { status: 500 })
  }
}
