import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import prisma from "@/lib/prisma"

// Diagnostic route to check database data
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = currentUser.id

    // Fetch contacts to verify actual status and source values
    const contacts = await prisma.contact.findMany({
      where: { userId },
      take: 10, // Limit to 10 contacts to avoid overload
    })

    // Extract unique status and source values
    const uniqueStatuses = [...new Set(contacts.map((c) => c.status))]
    const uniqueSources = [...new Set(contacts.map((c) => c.source))]

    // Count contacts for each status and source
    const statusCounts = {}
    const sourceCounts = {}

    for (const contact of contacts) {
      if (contact.status) {
        statusCounts[contact.status] = (statusCounts[contact.status] || 0) + 1
      }
      if (contact.source) {
        sourceCounts[contact.source] = (sourceCounts[contact.source] || 0) + 1
      }
    }

    return NextResponse.json({
      totalContacts: contacts.length,
      uniqueStatuses,
      uniqueSources,
      statusCounts,
      sourceCounts,
      sampleContacts: contacts.slice(0, 3).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        source: c.source,
        // Include type and exact value for debugging
        statusType: typeof c.status,
        sourceType: typeof c.source,
      })),
    })
  } catch (error) {
    console.error("Error in debug route:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
