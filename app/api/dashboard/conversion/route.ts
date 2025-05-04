import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { dbAction } from "@/lib/db-client"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const sourceParam = searchParams.get("source")

    // Build filter for queries
    const filter: any = {
      userId: user.id,
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

    // Calculate conversion rates
    const conversionRates = await dbAction(async () => {
      // Get counts by status
      const statusCounts = await prisma.contact.groupBy({
        by: ["status"],
        where: filter,
        _count: {
          id: true,
        },
      })

      // Calculate conversion rates
      const rates: Record<string, number> = {}

      // Overall rate
      const totalContacts = statusCounts.reduce((sum, item) => sum + item._count.id, 0)
      const closedContacts = statusCounts.find((item) => item.status === "Fechado")?._count.id || 0
      rates.overall = totalContacts > 0 ? Math.round((closedContacts / totalContacts) * 100) : 0

      // Rates by source
      if (!sourceParam || sourceParam === "Todos") {
        // Calculate rates for each source
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

          rates[source] = sourceTotalContacts > 0 ? Math.round((sourceClosedContacts / sourceTotalContacts) * 100) : 0
        }
      }

      return rates
    })

    return NextResponse.json({ conversionRates })
  } catch (error) {
    console.error("Error in conversion API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
