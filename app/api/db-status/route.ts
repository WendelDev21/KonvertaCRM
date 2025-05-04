import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { dbAction } from "@/lib/db-client"

// Prevent static optimization
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    // Allow checking database status without authentication
    const dbStatus = {
      connection: false,
      tables: {
        User: false,
        Contact: false,
        Webhook: false,
        WebhookLog: false,
      },
    }

    // Test database connection using dbAction for consistent error handling
    const [tableCheckResult, tableCheckError] = await dbAction(async () => {
      // Check if tables exist
      return await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'User'
        ) AS "User_exists",
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'Contact'
        ) AS "Contact_exists",
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'Webhook'
        ) AS "Webhook_exists",
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'WebhookLog'
        ) AS "WebhookLog_exists"
      `
    })

    if (tableCheckError) {
      console.error("Database connection error:", tableCheckError)
      return NextResponse.json({
        ...dbStatus,
        error: tableCheckError instanceof Error ? tableCheckError.message : "Unknown database error",
      })
    }

    // Update status with table check results
    const tableCheck = tableCheckResult
    dbStatus.connection = true
    dbStatus.tables.User = tableCheck[0].User_exists
    dbStatus.tables.Contact = tableCheck[0].Contact_exists
    dbStatus.tables.Webhook = tableCheck[0].Webhook_exists
    dbStatus.tables.WebhookLog = tableCheck[0].WebhookLog_exists

    // If user is authenticated, get more details
    if (currentUser) {
      const userId = (currentUser as any).id

      // Count user's contacts using dbAction
      const [contactCountResult, contactCountError] = await dbAction(async () => {
        return await prisma.contact.count({
          where: { userId },
        })
      })

      if (contactCountError) {
        console.error("Error counting contacts:", contactCountError)
        return NextResponse.json({
          ...dbStatus,
          user: {
            id: (currentUser as any).id,
            name: currentUser.name,
            email: currentUser.email,
          },
          error: "Failed to count contacts",
        })
      }

      return NextResponse.json({
        ...dbStatus,
        user: {
          id: (currentUser as any).id,
          name: currentUser.name,
          email: currentUser.email,
        },
        data: {
          contactCount: contactCountResult,
        },
      })
    }

    return NextResponse.json(dbStatus)
  } catch (error) {
    console.error("Error checking database status:", error)
    return NextResponse.json(
      { error: `Error checking database status: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
