import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection
    await prisma.$connect()

    // Check if user exists in database
    const userId = (currentUser as any).id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    // Count user's contacts
    const contactCount = await prisma.contact.count({
      where: { userId },
    })

    return NextResponse.json({
      status: "ok",
      database: {
        connected: true,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          : null,
        contactCount,
      },
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown database error",
        database: {
          connected: false,
        },
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
