import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"

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

    // Test database connection
    try {
      // Check if tables exist
      const tableCheck = await sql`
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

      dbStatus.connection = true
      dbStatus.tables.User = tableCheck[0].User_exists
      dbStatus.tables.Contact = tableCheck[0].Contact_exists
      dbStatus.tables.Webhook = tableCheck[0].Webhook_exists
      dbStatus.tables.WebhookLog = tableCheck[0].WebhookLog_exists

      // If user is authenticated, get more details
      if (currentUser) {
        const userId = (currentUser as any).id

        // Count user's contacts
        const contactCount = await sql`
          SELECT COUNT(*) as count FROM "Contact" WHERE "userId" = ${userId}
        `

        return NextResponse.json({
          ...dbStatus,
          user: {
            id: (currentUser as any).id,
            name: currentUser.name,
            email: currentUser.email,
          },
          data: {
            contactCount: contactCount[0].count,
          },
        })
      }

      return NextResponse.json(dbStatus)
    } catch (error) {
      console.error("Database connection error:", error)
      return NextResponse.json({
        ...dbStatus,
        error: error instanceof Error ? error.message : "Unknown database error",
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Error checking database status: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
