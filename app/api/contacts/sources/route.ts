import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get counts by source
    const sourceCounts = await prisma.contact.groupBy({
      by: ["source"],
      where: {
        userId: session.user.id,
      },
      _count: {
        id: true,
      },
    })

    // Format the response
    const sources = sourceCounts.map((item) => ({
      name: item.source,
      count: item._count.id,
    }))

    // Get all unique sources
    const allSources = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        source: true,
      },
      distinct: ["source"],
    })

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
