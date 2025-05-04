import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import prisma from "@/lib/prisma"
import type { ContactSource } from "@/lib/services/contact-service"

// Tell Next.js this route should not be statically optimized
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    // Get counts by source
    const sourceCounts = await prisma.contact.groupBy({
      by: ["source"],
      where: { userId },
      _count: {
        source: true,
      },
    })

    // Initialize with zeros for all possible sources
    const result: Record<ContactSource, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Outro: 0,
    }

    // Fill with actual results
    sourceCounts.forEach((count) => {
      result[count.source as ContactSource] = count._count.source
    })

    // Get all unique sources used in the system
    const sources = await prisma.contact.findMany({
      where: { userId },
      select: { source: true },
      distinct: ["source"],
    })

    const uniqueSources = sources.map((item) => item.source)

    return NextResponse.json({
      counts: result,
      sources: uniqueSources,
    })
  } catch (error) {
    console.error("Error fetching contact sources:", error)
    return NextResponse.json({ error: "Error fetching contact sources" }, { status: 500 })
  }
}
