import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { dbAction } from "@/lib/db-client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await dbAction(async () => {
      // Get counts by source
      const sourceCounts = await prisma.contact.groupBy({
        by: ["source"],
        where: {
          userId: user.id,
        },
        _count: {
          id: true,
        },
      })

      // Format the source counts
      const sources = sourceCounts.map((item) => ({
        name: item.source,
        count: item._count.id,
      }))

      // Get all unique sources
      const uniqueSourcesResult = await prisma.contact.findMany({
        where: {
          userId: user.id,
        },
        select: {
          source: true,
        },
        distinct: ["source"],
      })

      const uniqueSources = uniqueSourcesResult.map((item) => item.source).filter(Boolean)

      // Default sources
      const defaultSources = ["WhatsApp", "Instagram", "Outro"]

      return {
        sources,
        uniqueSources,
        defaultSources,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching contact sources:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
