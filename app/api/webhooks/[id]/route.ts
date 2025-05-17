import { type NextRequest, NextResponse } from "next/server"
import { getWebhookById, updateWebhook, deleteWebhook, getWebhookLogs, type WebhookEvent } from "@/lib/webhook-db"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/webhooks/[id] - Obtém detalhes de um webhook específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url)
      const logs = searchParams.get("logs") === "true"

      const webhook = await getWebhookById(params.id, userId)

      if (!webhook) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
      }

      if (logs) {
        const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
        const webhookLogs = await getWebhookLogs(params.id, limit)
        return NextResponse.json({ webhook, logs: webhookLogs })
      }

      return NextResponse.json(webhook)
    } catch (error) {
      console.error("Error fetching webhook:", error)
      return NextResponse.json({ error: "Error fetching webhook" }, { status: 500 })
    }
  })
}

// PUT /api/webhooks/[id] - Atualiza um webhook existente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`[API] Webhooks: PUT request received for webhook ID: ${params.id}`)

  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      console.log(`[API] Webhooks: Processing PUT request for webhook ID: ${params.id}, user ID: ${userId}`)

      // Clone the request to read the body
      const clonedReq = req.clone()
      const body = await clonedReq.json()
      console.log("[API] Webhooks: Request body:", body)

      // Validate URL if provided
      if (body.url) {
        try {
          new URL(body.url)
        } catch (e) {
          console.error("[API] Webhooks: Invalid URL provided:", body.url)
          return NextResponse.json({ error: "Invalid URL. Provide a complete and valid URL." }, { status: 400 })
        }
      }

      // Validate events if provided
      if (body.events) {
        if (!Array.isArray(body.events)) {
          console.error("[API] Webhooks: Events is not an array:", body.events)
          return NextResponse.json({ error: "Events must be an array." }, { status: 400 })
        }

        const validEvents: WebhookEvent[] = [
          "contact.created",
          "contact.updated",
          "contact.deleted",
          "contact.status_changed",
          "all",
        ]

        for (const event of body.events) {
          if (!validEvents.includes(event as WebhookEvent)) {
            console.error("[API] Webhooks: Invalid event:", event)
            return NextResponse.json(
              { error: `Invalid event: ${event}. Valid events: ${validEvents.join(", ")}` },
              { status: 400 },
            )
          }
        }
      }

      console.log(`[API] Webhooks: Updating webhook ID: ${params.id}`)
      const updatedWebhook = await updateWebhook(params.id, body, userId)

      if (!updatedWebhook) {
        console.error(`[API] Webhooks: Webhook not found, ID: ${params.id}`)
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
      }

      console.log("[API] Webhooks: Webhook updated successfully:", updatedWebhook.id)
      return NextResponse.json(updatedWebhook)
    } catch (error) {
      console.error("[API] Webhooks: Error updating webhook:", error)
      return NextResponse.json(
        { error: `Error updating webhook: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 },
      )
    }
  })
}

// DELETE /api/webhooks/[id] - Remove um webhook
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const success = await deleteWebhook(params.id, userId)

      if (!success) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error deleting webhook:", error)
      return NextResponse.json({ error: "Error deleting webhook" }, { status: 500 })
    }
  })
}
