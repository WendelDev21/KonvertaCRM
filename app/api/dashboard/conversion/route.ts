import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Obter parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const sourceParam = searchParams.get("source")

    // Construir filtro para consultas
    const filter: any = {
      userId: session.user.id,
    }

    if (startDateParam || endDateParam) {
      filter.createdAt = {}

      if (startDateParam) {
        filter.createdAt.gte = new Date(startDateParam)
      }

      if (endDateParam) {
        filter.createdAt.lte = new Date(endDateParam)
      }
    }

    // Calcular taxas de conversão
    try {
      // Obter contagens por status
      const statusCounts = await prisma.contact.groupBy({
        by: ["status"],
        where: filter,
        _count: {
          id: true,
        },
      })

      // Calcular taxas de conversão por origem
      const conversionRates: Record<string, number> = {}

      // Taxa geral
      const totalContacts = statusCounts.reduce((sum, item) => sum + item._count.id, 0)
      const closedContacts = statusCounts.find((item) => item.status === "Fechado")?._count.id || 0
      conversionRates.overall = totalContacts > 0 ? Math.round((closedContacts / totalContacts) * 100) : 0

      // Taxas por origem
      if (!sourceParam || sourceParam === "Todos") {
        // Calcular taxas para cada origem
        const sources = ["WhatsApp", "Instagram", "Outro"]

        for (const source of sources) {
          const sourceFilter = { ...filter, source }

          const sourceStatusCounts = await prisma.contact.groupBy({
            by: ["status"],
            where: sourceFilter,
            _count: {
              id: true,
            },
          })

          const sourceTotalContacts = sourceStatusCounts.reduce((sum, item) => sum + item._count.id, 0)
          const sourceClosedContacts = sourceStatusCounts.find((item) => item.status === "Fechado")?._count.id || 0

          conversionRates[source] =
            sourceTotalContacts > 0 ? Math.round((sourceClosedContacts / sourceTotalContacts) * 100) : 0
        }
      }

      return NextResponse.json({ conversionRates })
    } catch (error) {
      console.error("Error calculating conversion rates:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in conversion API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
