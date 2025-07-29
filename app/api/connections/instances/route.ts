import { type NextRequest, NextResponse } from "next/server"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import { createEvolutionInstance, deleteEvolutionInstance } from "@/lib/evolution-api"
import { createWhatsAppInstance, getAllWhatsAppInstances, deleteWhatsAppInstance } from "@/lib/whatsapp-db"

// GET /api/connections/instances - Get all instances for the user
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    console.log(`[WhatsApp API] GET instances for user: ${userId}`)

    try {
      const instances = await getAllWhatsAppInstances(userId)
      console.log(`[WhatsApp API] Found ${instances.length} instances`)
      return NextResponse.json(instances)
    } catch (error) {
      console.error("[WhatsApp API] Error getting instances:", error)
      return NextResponse.json(
        {
          error: "Failed to get instances",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}

// POST /api/connections/instances - Create a new instance
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    console.log(`[WhatsApp API] POST create instance for user: ${userId}`)

    try {
      const body = await req.json()
      const { instanceName } = body

      if (!instanceName) {
        return NextResponse.json({ error: "Instance name is required" }, { status: 400 })
      }

      console.log(`[WhatsApp API] Creating instance: ${instanceName}`)

      // Create instance in Evolution API
      const evolutionResponse = await createEvolutionInstance(instanceName)
      console.log("[WhatsApp API] Evolution response:", evolutionResponse)

      // Create instance in our database
      const dbInstance = await createWhatsAppInstance({
        instanceName,
        userId,
        status: "CREATED",
        qrCode: null,
      })

      console.log("[WhatsApp API] Instance created successfully")
      return NextResponse.json(dbInstance, { status: 201 })
    } catch (error) {
      console.error("[WhatsApp API] Error creating instance:", error)
      return NextResponse.json(
        {
          error: "Failed to create instance",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}

// DELETE /api/connections/instances - Delete an instance
export async function DELETE(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    const { searchParams } = new URL(req.url)
    const instanceName = searchParams.get("instanceName")

    if (!instanceName) {
      console.error("[WhatsApp API] Instance name is required for deletion")
      return NextResponse.json({ error: "Instance name is required" }, { status: 400 })
    }

    console.log(`[WhatsApp API] DELETE instance: ${instanceName} for user: ${userId}`)

    try {
      // First delete from Evolution API
      try {
        console.log(`[WhatsApp API] Deleting from Evolution API: ${instanceName}`)
        await deleteEvolutionInstance(instanceName)
        console.log("[WhatsApp API] Successfully deleted from Evolution API")
      } catch (evolutionError) {
        console.warn(
          "[WhatsApp API] Failed to delete from Evolution API (continuing with DB deletion):",
          evolutionError,
        )
        // Continue with database deletion even if Evolution API fails
      }

      // Delete from our database
      console.log(`[WhatsApp API] Deleting from database: ${instanceName}`)
      const result = await deleteWhatsAppInstance(instanceName, userId)

      if (result.count === 0) {
        console.error(`[WhatsApp API] No instance found to delete: ${instanceName}`)
        return NextResponse.json({ error: "Instance not found" }, { status: 404 })
      }

      console.log(`[WhatsApp API] Successfully deleted ${result.count} instance(s) from database`)
      return NextResponse.json({
        message: "Instance deleted successfully",
        deletedCount: result.count,
      })
    } catch (error) {
      console.error("[WhatsApp API] Error deleting instance:", error)
      return NextResponse.json(
        {
          error: "Failed to delete instance",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}
