import { type NextRequest, NextResponse } from "next/server"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import { createWebhook, getAllWebhooks, getWebhookById } from "@/lib/webhook-db"
import { prisma } from "@/lib/prisma"

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

// POST /api/webhooks - Cria um ou múltiplos webhooks
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const body = await req.json()
      console.log("Recebido POST /api/webhooks com body:", body)

      // Detectar se é operação em lote ou individual
      const isBatch = Array.isArray(body)
      const webhooks = isBatch ? body : [body]

      // Obter o usuário para verificar o plano
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Contar webhooks existentes
      const existingWebhooks = await prisma.webhook.count({
        where: { userId },
      })

      const results = []
      const errors = []

      for (let i = 0; i < webhooks.length; i++) {
        const webhookData = webhooks[i]

        try {
          // Validate data
          if (!webhookData.name || !webhookData.url || !webhookData.events || !Array.isArray(webhookData.events)) {
            console.log("Dados incompletos:", webhookData)
            errors.push({ index: i, error: "Incomplete data. Name, URL, and events are required." })
            continue
          }

          // Validate URL
          try {
            new URL(webhookData.url)
          } catch (e) {
            console.log("URL inválida:", webhookData.url)
            errors.push({ index: i, error: "Invalid URL. Provide a complete and valid URL." })
            continue
          }

          // Validate events
          const validEvents: WebhookEvent[] = [
            "contact.created",
            "contact.updated",
            "contact.deleted",
            "contact.status_changed",
            "all",
          ]

          let hasInvalidEvent = false
          for (const event of webhookData.events) {
            if (!validEvents.includes(event as WebhookEvent)) {
              console.log("Evento inválido:", event)
              errors.push({ index: i, error: `Invalid event: ${event}. Valid events: ${validEvents.join(", ")}` })
              hasInvalidEvent = true
              break
            }
          }

          if (hasInvalidEvent) continue

          // Verificar limites baseados no plano (considerando webhooks já criados + os que serão criados)
          const totalWebhooksAfterCreation = existingWebhooks + results.length + 1

          if (user.plan === "Starter" && totalWebhooksAfterCreation > 1) {
            errors.push({
              index: i,
              error: "Limite de 1 webhook atingido! Faça o upgrade para mais webhooks",
              plan: user.plan,
              limit: 1,
              current: existingWebhooks + results.length,
            })
            continue
          }

          if (user.plan === "Pro" && totalWebhooksAfterCreation > 5) {
            errors.push({
              index: i,
              error: "Limite de 5 webhooks atingido! Faça o upgrade para mais webhooks",
              plan: user.plan,
              limit: 5,
              current: existingWebhooks + results.length,
            })
            continue
          }

          // Se passou pelas verificações, cria o webhook
          const newWebhook = await createWebhook(
            {
              name: webhookData.name,
              url: webhookData.url,
              events: webhookData.events,
              secret: webhookData.secret,
              userId,
            },
            userId,
          )

          console.log("Webhook criado com sucesso:", newWebhook)
          results.push(newWebhook)
        } catch (error) {
          console.error(`Erro ao criar webhook ${i + 1}:`, error)
          errors.push({
            index: i,
            error: "Error creating webhook",
            details: error instanceof Error ? error.message : String(error),
          })
        }
      }

      // Retornar resultado apropriado
      if (isBatch) {
        return NextResponse.json(
          {
            success: results.length > 0,
            created: results.length,
            total: webhooks.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
          },
          { status: results.length > 0 ? 201 : 400 },
        )
      } else {
        if (results.length > 0) {
          return NextResponse.json(results[0], { status: 201 })
        } else {
          const error = errors[0]
          return NextResponse.json(
            {
              error: error?.error || "Error creating webhook",
              details: error?.details,
              plan: error?.plan,
              limit: error?.limit,
              current: error?.current,
            },
            { status: error?.plan ? 403 : 400 },
          )
        }
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
