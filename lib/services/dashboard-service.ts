import { prisma, dbAction } from "../db-client"
import type { ContactStatus, ContactSource } from "./contact-service"

export async function getStatusDistribution(userId: string) {
  return dbAction(async () => {
    const counts = await prisma.contact.groupBy({
      by: ["status"],
      where: { userId },
      _count: {
        status: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactStatus, number> = {
      Novo: 0,
      Conversando: 0,
      Interessado: 0,
      Fechado: 0,
      Perdido: 0,
    }

    // Fill with actual results
    counts.forEach((count) => {
      result[count.status as ContactStatus] = count._count.status
    })

    return result
  })
}

export async function getSourceDistribution(userId: string) {
  return dbAction(async () => {
    // Adicionado 'async' aqui
    const counts = await prisma.contact.groupBy({
      by: ["source"],
      where: { userId },
      _count: {
        source: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactSource, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Outro: 0,
    }

    // Fill with actual results
    counts.forEach((count) => {
      result[count.source as ContactSource] = count._count.source
    })

    return result
  })
}

export async function getActivityTimeline(userId: string, startDate: Date, endDate: Date, source?: string) {
  return dbAction(async () => {
    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(source && source !== "Todos" ? { source } : {}),
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const dailyData: Record<
      string,
      { date: string; novos: number; conversando: number; interessado: number; fechados: number; perdidos: number }
    > = {}

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]
      dailyData[dateStr] = {
        date: dateStr,
        novos: 0,
        conversando: 0,
        interessado: 0,
        fechados: 0,
        perdidos: 0,
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    contacts.forEach((contact) => {
      const dateStr = contact.createdAt.toISOString().split("T")[0]
      if (dailyData[dateStr]) {
        if (contact.status === "Novo") {
          dailyData[dateStr].novos++
        } else if (contact.status === "Conversando") {
          dailyData[dateStr].conversando++
        } else if (contact.status === "Interessado") {
          dailyData[dateStr].interessado++
        } else if (contact.status === "Fechado") {
          dailyData[dateStr].fechados++
        } else if (contact.status === "Perdido") {
          dailyData[dateStr].perdidos++
        }
      }
    })

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
  })
}

export async function getConversionRates(userId: string) {
  const [statusCounts] = await getStatusDistribution(userId)

  if (!statusCounts) {
    return {
      overall: 0,
      WhatsApp: 0,
      Instagram: 0,
      Outro: 0,
    }
  }

  const totalContacts = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)

  return {
    overall: totalContacts > 0 ? Math.round((statusCounts.Fechado / totalContacts) * 100) : 0,
    WhatsApp: 50, // Placeholder
    Instagram: 30, // Placeholder
    Outro: 20, // Placeholder
  }
}

export async function getDashboardData(userId: string, startDate: Date, endDate: Date, source?: string) {
  try {
    console.log("[Service] getDashboardData: Starting data fetch for user", userId)

    const [statusCounts] = await getStatusDistribution(userId)
    console.log(
      "[Service] getDashboardData: Status counts fetched",
      statusCounts ? Object.keys(statusCounts).length : 0,
    )

    const [sourceCounts] = await getSourceDistribution(userId)
    console.log(
      "[Service] getDashboardData: Source counts fetched",
      sourceCounts ? Object.keys(sourceCounts).length : 0,
    )

    const [timeline] = await getActivityTimeline(userId, startDate, endDate, source)
    console.log("[Service] getDashboardData: Timeline fetched", timeline ? timeline.length : 0)

    console.log("[Service] getDashboardData: All data fetched successfully")

    return {
      statusCounts: statusCounts || {
        Novo: 0,
        Conversando: 0,
        Interessado: 0,
        Fechado: 0,
        Perdido: 0,
      },
      sourceCounts: sourceCounts || {
        WhatsApp: 0,
        Instagram: 0,
        Outro: 0,
      },
      timeline: timeline || [],
    }
  } catch (error) {
    console.error("[Service] getDashboardData: Error fetching data:", error)
    throw error
  }
}

export async function getConversionData(userId: string, period: string) {
  return dbAction(async () => {
    try {
      console.log("[Service] getConversionData: Starting data fetch for user", userId, "period:", period)

      // Define date range based on period
      const endDate = new Date()
      const startDate = new Date()

      switch (period) {
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3)
          break
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default:
          startDate.setMonth(startDate.getMonth() - 1) // Default to month
      }

      // Get contacts by source
      const contactsBySource = await prisma.contact.groupBy({
        by: ["source"],
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
      })

      // Get closed contacts by source (needed for conversion rate calculation only)
      const closedContactsBySource = await prisma.contact.groupBy({
        by: ["source"],
        where: {
          userId,
          status: "Fechado",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
      })

      // Get total contacts and closed contacts overall
      const totalContacts = await prisma.contact.count({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      const closedContacts = await prisma.contact.count({
        where: {
          userId,
          status: "Fechado",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      // Initialize source counts and conversion rates
      const sourceCounts = {
        WhatsApp: 0,
        Instagram: 0,
        Outro: 0,
      }

      const tempClosedCounts = {
        WhatsApp: 0,
        Instagram: 0,
        Outro: 0,
      }

      const conversionRates = {
        overall: totalContacts > 0 ? (closedContacts / totalContacts) * 100 : 0,
        WhatsApp: 0,
        Instagram: 0,
        Outro: 0,
      }

      // Fill in the actual counts
      contactsBySource.forEach((item) => {
        if (item.source in sourceCounts) {
          sourceCounts[item.source as keyof typeof sourceCounts] = item._count.id
        }
      })

      // Fill in the closed counts (for calculation only, not returned)
      closedContactsBySource.forEach((item) => {
        if (item.source in tempClosedCounts) {
          tempClosedCounts[item.source as keyof typeof tempClosedCounts] = item._count.id
        }
      })

      // Calculate conversion rates
      Object.keys(sourceCounts).forEach((source) => {
        const totalForSource = sourceCounts[source as keyof typeof sourceCounts]
        const closedForSource = tempClosedCounts[source as keyof typeof tempClosedCounts]

        if (totalForSource > 0) {
          conversionRates[source as keyof typeof conversionRates] = (closedForSource / totalForSource) * 100
        }
      })

      console.log("[Service] getConversionData: Source counts:", sourceCounts)
      console.log("[Service] getConversionData: Conversion rates:", conversionRates)

      // Return only the requested data
      return {
        sourceCounts,
        conversionRates,
        totalContacts,
      }
    } catch (error) {
      console.error("[Service] getConversionData: Error calculating conversion data:", error)
      throw error
    }
  })
}
