import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { dbAction } from "@/lib/db-client"
import { prisma } from "@/lib/prisma"

// Tell Next.js this route should not be statically optimized
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    // Get counts by source
    const sourceCounts = await dbAction(() =>
      prisma.contact.groupBy({
        by: ["source"],
        where: { userId },
        _count: {
          id: true,
        },
      }),
    )

    // Format the response
    const sources = sourceCounts.map((item) => ({
      name: item.source,
      count: item._count.id,
    }))

    // Get all unique sources
    const allSources = await dbAction(() =>
      prisma.contact.findMany({
        where: { userId },
        select: { source: true },
        distinct: ["source"],
      }),
    )

    const uniqueSources = allSources.map((item) => item.source)

    return NextResponse.json({
      sources,
      uniqueSources,
      defaultSources: ["WhatsApp", "Instagram", "Outro"],
    })
  } catch (error) {
    console.error("Error fetching contact sources:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
