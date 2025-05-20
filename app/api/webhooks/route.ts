import { type NextRequest, NextResponse } from "next/server"
import { getAllWebhooks, getWebhookById, createWebhook, type WebhookEvent } from "@/lib/webhook-db"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/webhooks - Lista todos os webhooks configurados
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url)
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
  })
}

// POST /api/webhooks - Cria um novo webhook
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const body = await req.json()
      console.log("Recebido POST /api/webhooks com body:", body)

      // Validate data
      if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
        console.log("Dados incompletos:", body)
        return NextResponse.json({ error: "Incomplete data. Name, URL, and events are required." }, { status: 400 })
      }

      // Validate URL
      try {
        new URL(body.url)
      } catch (e) {
        console.log("URL inválida:", body.url)
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
          console.log("Evento inválido:", event)
          return NextResponse.json(
            { error: `Invalid event: ${event}. Valid events: ${validEvents.join(", ")}` },
            { status: 400 },
          )
        }
      }

      try {
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

        console.log("Webhook criado com sucesso:", newWebhook)
        return NextResponse.json(newWebhook, { status: 201 })
      } catch (error) {
        console.error("Erro ao criar webhook:", error)
        return NextResponse.json(
          {
            error: "Error creating webhook",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error("Erro no handler POST /api/webhooks:", error)
      return NextResponse.json(
        {
          error: "Error processing webhook request",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}
