import { type NextRequest, NextResponse } from "next/server"
import { getWhatsAppInstanceByName, updateWhatsAppInstance, createWhatsAppMessage } from "@/lib/whatsapp-db"

// POST /api/connections/webhook - Handle webhooks from Evolution API
export async function POST(request: NextRequest) {
  console.log("[WhatsApp Webhook] Received webhook")

  try {
    const body = await request.json()
    console.log("[WhatsApp Webhook] Webhook body:", JSON.stringify(body, null, 2))

    const { event, instance, data } = body

    if (!event || !instance) {
      console.error("[WhatsApp Webhook] Missing required fields: event or instance")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`[WhatsApp Webhook] Processing event: ${event} for instance: ${instance}`)

    // Find the instance in our database
    const dbInstance = await getWhatsAppInstanceByName(instance)
    if (!dbInstance) {
      console.warn(`[WhatsApp Webhook] Instance not found in database: ${instance}`)
      return NextResponse.json({ message: "Instance not found, ignoring webhook" })
    }

    console.log(`[WhatsApp Webhook] Found instance in DB: ${dbInstance.id}`)

    // Handle different webhook events
    switch (event) {
      case "connection.update":
        console.log("[WhatsApp Webhook] Processing connection update")
        if (data && data.state) {
          let newStatus = dbInstance.status

          switch (data.state) {
            case "open":
              newStatus = "CONNECTED"
              console.log("[WhatsApp Webhook] Connection opened - setting to CONNECTED")
              break
            case "close":
              newStatus = "DISCONNECTED"
              console.log("[WhatsApp Webhook] Connection closed - setting to DISCONNECTED")
              break
            case "connecting":
              newStatus = "CONNECTING"
              console.log("[WhatsApp Webhook] Connection connecting - setting to CONNECTING")
              break
            default:
              console.log(`[WhatsApp Webhook] Unknown connection state: ${data.state}`)
          }

          if (newStatus !== dbInstance.status) {
            console.log(`[WhatsApp Webhook] Updating status from ${dbInstance.status} to ${newStatus}`)
            await updateWhatsAppInstance(instance, dbInstance.userId, {
              status: newStatus,
              qrCode: newStatus === "CONNECTED" ? null : dbInstance.qrCode,
            })
          }
        }
        break

      case "qrcode.updated":
        console.log("[WhatsApp Webhook] Processing QR code update")
        if (data && data.qrcode) {
          let qrCodeData = data.qrcode

          // Clean the QR code data if it has the data URL prefix
          if (typeof qrCodeData === "string" && qrCodeData.startsWith("data:image/png;base64,")) {
            qrCodeData = qrCodeData.replace("data:image/png;base64,", "")
            console.log("[WhatsApp Webhook] Cleaned QR code data URL prefix")
          }

          console.log("[WhatsApp Webhook] Updating QR code")
          await updateWhatsAppInstance(instance, dbInstance.userId, {
            status: "QR_UPDATED",
            qrCode: qrCodeData,
          })
        }
        break

      case "messages.upsert":
        console.log("[WhatsApp Webhook] Processing message upsert")
        if (data && data.messages && Array.isArray(data.messages)) {
          for (const message of data.messages) {
            try {
              console.log("[WhatsApp Webhook] Processing message:", message.key?.id)

              await createWhatsAppMessage({
                instanceName: instance,
                messageId: message.key?.id || `msg_${Date.now()}`,
                fromNumber: message.key?.remoteJid || "unknown",
                toNumber: message.key?.participant || instance,
                messageType: message.messageType || "text",
                content: JSON.stringify(message.message || {}),
                timestamp: new Date(message.messageTimestamp * 1000 || Date.now()),
                userId: dbInstance.userId,
              })

              console.log("[WhatsApp Webhook] Message saved successfully")
            } catch (messageError) {
              console.error("[WhatsApp Webhook] Error saving message:", messageError)
            }
          }
        }
        break

      default:
        console.log(`[WhatsApp Webhook] Unhandled event type: ${event}`)
    }

    return NextResponse.json({ message: "Webhook processed successfully" })
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing webhook:", error)
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// GET /api/connections/webhook - Health check
export async function GET() {
  return NextResponse.json({ message: "WhatsApp webhook endpoint is active" })
}
