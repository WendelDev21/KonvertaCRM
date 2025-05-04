import { type NextRequest, NextResponse } from "next/server"
import { getWebhookById, updateWebhook, deleteWebhook, getWebhookLogs, type WebhookEvent } from "@/lib/webhook-db"
import { getCurrentUser } from "@/lib/session"

// GET /api/webhooks/[id] - Get a specific webhook
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const { searchParams } = new URL(request.url)
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
}

// PUT /api/webhooks/[id] - Update a webhook
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const body = await request.json()

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url)
      } catch (e) {
        return NextResponse.json({ error: "Invalid URL. Provide a complete and valid URL." }, { status: 400 })
      }
    }

    // Validate events if provided
    if (body.events) {
      if (!Array.isArray(body.events)) {
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
          return NextResponse.json(
            { error: `Invalid event: ${event}. Valid events: ${validEvents.join(", ")}` },
            { status: 400 },
          )
        }
      }
    }

    const updatedWebhook = await updateWebhook(params.id, body, userId)

    if (!updatedWebhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    return NextResponse.json(updatedWebhook)
  } catch (error) {
    console.error("Error updating webhook:", error)
    return NextResponse.json({ error: "Error updating webhook" }, { status: 500 })
  }
}

// DELETE /api/webhooks/[id] - Delete a webhook
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const success = await deleteWebhook(params.id, userId)

    if (!success) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting webhook:", error)
    return NextResponse.json({ error: "Error deleting webhook" }, { status: 500 })
  }
}
