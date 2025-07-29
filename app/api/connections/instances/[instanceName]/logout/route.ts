import { type NextRequest, NextResponse } from "next/server"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import { logoutEvolutionInstance } from "@/lib/evolution-api"
import { updateWhatsAppInstance } from "@/lib/whatsapp-db"

// POST /api/connections/instances/[instanceName]/logout - Logout from WhatsApp instance
export async function POST(request: NextRequest, { params }: { params: { instanceName: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    const { instanceName } = params
    console.log(`[WhatsApp API] Logout instance ${instanceName} for user: ${userId}`)

    try {
      // Logout from Evolution API
      await logoutEvolutionInstance(instanceName)
      console.log(`[WhatsApp API] Successfully logged out from Evolution API: ${instanceName}`)

      // Update instance status in database
      await updateWhatsAppInstance(instanceName, userId, {
        status: "DISCONNECTED",
        qrCode: null,
      })
      console.log(`[WhatsApp API] Updated instance status to DISCONNECTED: ${instanceName}`)

      return NextResponse.json({
        success: true,
        message: "Instance logged out successfully",
        instanceName,
      })
    } catch (error) {
      console.error("[WhatsApp API] Error logging out instance:", error)
      return NextResponse.json(
        {
          error: "Failed to logout instance",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}
