import { type NextRequest, NextResponse } from "next/server"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import { getEvolutionInstanceQrCode, getEvolutionInstanceStatus } from "@/lib/evolution-api"
import { getWhatsAppInstance, updateWhatsAppInstance } from "@/lib/whatsapp-db"

// GET /api/whatsapp/instances/[instanceName] - Get QR code and status for a specific instance
export async function GET(request: NextRequest, { params }: { params: { instanceName: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    const { instanceName } = params
    console.log(`[WhatsApp API] GET instance ${instanceName} for user: ${userId}`)

    try {
      // Check if instance exists in our database
      const dbInstance = await getWhatsAppInstance(instanceName, userId)
      if (!dbInstance) {
        console.error(`[WhatsApp API] Instance not found: ${instanceName}`)
        return NextResponse.json({ error: "Instance not found" }, { status: 404 })
      }

      // Get fresh status from Evolution API
      let newStatus = dbInstance.status
      let qrCodeData = dbInstance.qrCode

      try {
        const statusResponse = await getEvolutionInstanceStatus(instanceName)
        console.log("[WhatsApp API] Evolution status response:", statusResponse)

        if (statusResponse && Array.isArray(statusResponse) && statusResponse.length > 0) {
          const instanceData = statusResponse[0]
          console.log("[WhatsApp API] Instance data from Evolution:", instanceData)

          if (instanceData.connectionStatus === "open") {
            newStatus = "CONNECTED"
            qrCodeData = null // Clear QR code when connected
            console.log("[WhatsApp API] Instance is CONNECTED")
          } else if (instanceData.connectionStatus === "close") {
            newStatus = "DISCONNECTED"
            console.log("[WhatsApp API] Instance is DISCONNECTED")
          } else if (instanceData.connectionStatus === "connecting") {
            newStatus = "CONNECTING"
            console.log("[WhatsApp API] Instance is CONNECTING")
          }
        }
      } catch (statusError) {
        console.warn("[WhatsApp API] Failed to get status from Evolution API:", statusError)
      }

      // Get QR code if instance is not connected and doesn't have one
      if (newStatus !== "CONNECTED" && !qrCodeData) {
        try {
          const qrResponse = await getEvolutionInstanceQrCode(instanceName)
          console.log("[WhatsApp API] QR code response:", qrResponse)

          if (qrResponse && typeof qrResponse === "object") {
            if (typeof qrResponse.qrcode === "string") {
              qrCodeData = qrResponse.qrcode
            } else if (qrResponse.qrcode && typeof qrResponse.qrcode === "object") {
              if (typeof qrResponse.qrcode.base64 === "string") {
                qrCodeData = qrResponse.qrcode.base64
              } else if (typeof qrResponse.qrcode.qr === "string") {
                qrCodeData = qrResponse.qrcode.qr
              }
            } else if (typeof qrResponse.base64 === "string") {
              qrCodeData = qrResponse.base64
            } else if (typeof qrResponse.qr === "string") {
              qrCodeData = qrResponse.qr
            }

            // Clean the QR code data if it has the data URL prefix
            if (qrCodeData && typeof qrCodeData === "string" && qrCodeData.startsWith("data:image/png;base64,")) {
              qrCodeData = qrCodeData.replace("data:image/png;base64,", "")
              console.log("[WhatsApp API] Cleaned QR code data URL prefix")
            }

            if (qrCodeData) {
              newStatus = "QR_UPDATED"
            }
          }
        } catch (qrError) {
          console.warn("[WhatsApp API] Failed to get QR code from Evolution API:", qrError)
        }
      }

      // Update database if status or QR code changed
      if (newStatus !== dbInstance.status || qrCodeData !== dbInstance.qrCode) {
        console.log(`[WhatsApp API] Updating instance: status ${dbInstance.status} -> ${newStatus}`)
        await updateWhatsAppInstance(instanceName, userId, {
          status: newStatus,
          qrCode: qrCodeData,
        })
      }

      // Return updated instance data
      const updatedInstance = await getWhatsAppInstance(instanceName, userId)
      return NextResponse.json(updatedInstance)
    } catch (error) {
      console.error("[WhatsApp API] Error getting instance:", error)
      return NextResponse.json(
        {
          error: "Failed to get instance",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}
