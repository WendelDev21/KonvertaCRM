import { type NextRequest, NextResponse } from "next/server"
import { getAllWebhooks, getWebhookById, createWebhook, type WebhookEvent } from "@/lib/webhook-db"
import { getCurrentUser } from "@/lib/session"

// GET /api/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const webhook = await getWebhookById(id, userId)
      if (!webhook) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
      }
      return NextResponse.json(webhook)
    }

    const webhooks = await getAllWebhooks(userId)
    return NextResponse.json(webhooks)
  } catch (error) {
    console.error("Error fetching webhooks:", error)
    return NextResponse.json({ error: "Error fetching webhooks" }, { status: 500 })
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    const body = await request.json()

    // Validate data
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json({ error: "Incomplete data. Name, URL, and events are required." }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(body.url)
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL. Provide a complete and valid URL." }, { status: 400 })
    }

    // Validate events
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

    const newWebhook = await createWebhook(
      {
        name: body.name,
        url: body.url,
        events: body.events,
        secret: body.secret,
        userId,
      },
      userId,
    )

    return NextResponse.json(newWebhook, { status: 201 })
  } catch (error) {
    console.error("Error creating webhook:", error)
    return NextResponse.json({ error: "Error creating webhook" }, { status: 500 })
  }
}
