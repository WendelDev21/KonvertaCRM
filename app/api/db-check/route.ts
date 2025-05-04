import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { dbAction } from "@/lib/db-client"

// Ensure this route is always dynamically rendered
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // User ID from the session
    const userId = currentUser.id

    // Wrap database operations in dbAction for consistent error handling
    const [dbResult, dbError] = await dbAction(async () => {
      // Test database connection
      await prisma.$connect()

      // Check if user exists in database
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

      return {
        user,
        contactCount,
      }
    })

    if (dbError) {
      console.error("Database check error:", dbError)
      return NextResponse.json(
        {
          status: "error",
          error: dbError instanceof Error ? dbError.message : "Unknown database error",
          database: {
            connected: false,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      database: {
        connected: true,
        user: dbResult.user
          ? {
              id: dbResult.user.id,
              name: dbResult.user.name,
              email: dbResult.user.email,
              role: dbResult.user.role,
            }
          : null,
        contactCount: dbResult.contactCount,
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
