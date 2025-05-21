import { type NextRequest, NextResponse } from "next/server"
import { getWebhookById, updateWebhook, getWebhookLogs, type WebhookEvent } from "@/lib/webhook-db"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import prisma from "@/lib/prisma"

// GET /api/webhooks/[id] - Obtém detalhes de um webhook específico
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id

  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url)
      const logs = searchParams.get("logs") === "true"

      const webhook = await getWebhookById(id, userId)

      if (!webhook) {
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
      }

      if (logs) {
        const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
        const webhookLogs = await getWebhookLogs(id, limit)
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
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id
  console.log(`[API] Webhooks: PUT request received for webhook ID: ${id}`)

  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      console.log(`[API] Webhooks: Processing PUT request for webhook ID: ${id}, user ID: ${userId}`)

      // Clone the request to read the body
      const clonedReq = req.clone()
      const body = await clonedReq.json()
      console.log("[API] Webhooks: Request body:", body)

      // Mapear isActive para active se estiver presente
      if (body.isActive !== undefined) {
        body.active = body.isActive
        console.log(`[API] Webhooks: Mapped isActive (${body.isActive}) to active (${body.active})`)
      }

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

      console.log(`[API] Webhooks: Updating webhook ID: ${id}`)
      const updatedWebhook = await updateWebhook(id, body, userId)

      if (!updatedWebhook) {
        console.error(`[API] Webhooks: Webhook not found, ID: ${id}`)
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
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id
  console.log(`[API] Webhooks: DELETE request received for webhook ID: ${id}`)

  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      console.log(`[API] Webhooks: Processing DELETE request for webhook ID: ${id}, user ID: ${userId}`)

      // Verificar se o webhook existe antes de tentar excluir
      const webhook = await prisma.webhook.findFirst({
        where: {
          id: id,
          userId,
        },
      })

      if (!webhook) {
        console.log(`[API] Webhooks: Webhook not found, ID: ${id}`)
        return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
      }

      console.log(`[API] Webhooks: Found webhook, proceeding with deletion`)

      // Excluir diretamente o webhook sem tentar excluir logs
      try {
        await prisma.webhook.delete({
          where: {
            id: id,
          },
        })

        console.log(`[API] Webhooks: Successfully deleted webhook, ID: ${id}`)
        return NextResponse.json({ success: true })
      } catch (deleteError) {
        console.error("[API] Webhooks: Error in Prisma delete operation:", deleteError)

        // Se falhar com o método direto, tentar com deleteMany
        try {
          const result = await prisma.webhook.deleteMany({
            where: {
              id: id,
              userId: userId,
            },
          })

          if (result.count > 0) {
            console.log(`[API] Webhooks: Successfully deleted webhook with deleteMany, ID: ${id}`)
            return NextResponse.json({ success: true })
          } else {
            console.log(`[API] Webhooks: No webhook deleted with deleteMany, ID: ${id}`)
            return NextResponse.json({ error: "Webhook could not be deleted" }, { status: 500 })
          }
        } catch (secondError) {
          console.error("[API] Webhooks: Error in second delete attempt:", secondError)
          return NextResponse.json(
            {
              error: "Webhook could not be deleted",
              details: secondError instanceof Error ? secondError.message : String(secondError),
            },
            { status: 500 },
          )
        }
      }
    } catch (error) {
      console.error("[API] Webhooks: Error deleting webhook:", error)
      return NextResponse.json(
        {
          error: "Error deleting webhook",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  })
}
