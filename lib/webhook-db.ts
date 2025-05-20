import prisma from "./prisma"

// Types
export type WebhookEvent = "contact.created" | "contact.updated" | "contact.deleted" | "contact.status_changed" | "all"

export interface Webhook {
  id: string
  name: string
  url: string
  events: WebhookEvent[]
  secret?: string
  createdAt: string | Date
  active: boolean // Alterado de isActive para active para corresponder ao schema
  lastTriggered?: string | Date
  lastStatus?: number
  userId: string
}

export interface WebhookLog {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: any
  status?: number
  response?: string
  createdAt: string | Date
}

// Database access functions
export async function getAllWebhooks(userId: string): Promise<Webhook[]> {
  const webhooks = await prisma.webhook.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  return webhooks.map((webhook) => ({
    ...webhook,
    events: JSON.parse(webhook.events) as WebhookEvent[],
    createdAt: webhook.createdAt.toISOString(),
    lastTriggered: webhook.lastTriggered?.toISOString(),
    active: Boolean(webhook.active), // Alterado de isActive para active
  }))
}

export async function getWebhookById(id: string, userId: string): Promise<Webhook | null> {
  const webhook = await prisma.webhook.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!webhook) return null

  return {
    ...webhook,
    events: JSON.parse(webhook.events) as WebhookEvent[],
    createdAt: webhook.createdAt.toISOString(),
    lastTriggered: webhook.lastTriggered?.toISOString(),
    active: Boolean(webhook.active), // Alterado de isActive para active
  }
}

export async function getWebhooksByEvent(event: WebhookEvent, userId: string): Promise<Webhook[]> {
  // Get all active webhooks for this user
  const webhooks = await prisma.webhook.findMany({
    where: {
      active: true, // Alterado de isActive para active
      userId,
    },
  })

  // Filter webhooks that contain the event or 'all'
  return webhooks
    .map((webhook) => ({
      ...webhook,
      events: JSON.parse(webhook.events) as WebhookEvent[],
      createdAt: webhook.createdAt.toISOString(),
      lastTriggered: webhook.lastTriggered?.toISOString(),
      active: Boolean(webhook.active), // Alterado de isActive para active
    }))
    .filter((webhook) => webhook.events.includes(event) || webhook.events.includes("all"))
}

export async function createWebhook(
  webhook: Omit<Webhook, "id" | "createdAt" | "active" | "lastTriggered" | "lastStatus">, // Alterado de isActive para active
  userId: string,
): Promise<Webhook> {
  console.log("Criando webhook com dados:", webhook)

  try {
    const newWebhook = await prisma.webhook.create({
      data: {
        name: webhook.name,
        url: webhook.url,
        events: JSON.stringify(webhook.events),
        secret: webhook.secret || null,
        active: true, // Alterado de isActive para active
        userId,
      },
    })

    console.log("Webhook criado com sucesso:", newWebhook)

    return {
      ...newWebhook,
      events: JSON.parse(newWebhook.events) as WebhookEvent[],
      createdAt: newWebhook.createdAt.toISOString(),
      lastTriggered: newWebhook.lastTriggered?.toISOString(),
      active: Boolean(newWebhook.active), // Alterado de isActive para active
    }
  } catch (error) {
    console.error("Erro ao criar webhook no banco de dados:", error)
    throw error
  }
}

export async function updateWebhook(
  id: string,
  webhook: Partial<Omit<Webhook, "id" | "createdAt">>,
  userId: string,
): Promise<Webhook | null> {
  try {
    // Prepare update data
    const updateData: any = {}

    if (webhook.name !== undefined) updateData.name = webhook.name
    if (webhook.url !== undefined) updateData.url = webhook.url
    if (webhook.events !== undefined) updateData.events = JSON.stringify(webhook.events)
    if (webhook.secret !== undefined) updateData.secret = webhook.secret
    if (webhook.active !== undefined) updateData.active = webhook.active // Alterado de isActive para active
    if (webhook.lastTriggered !== undefined) updateData.lastTriggered = webhook.lastTriggered
    if (webhook.lastStatus !== undefined) updateData.lastStatus = webhook.lastStatus

    const updatedWebhook = await prisma.webhook.update({
      where: {
        id,
        userId,
      },
      data: updateData,
    })

    return {
      ...updatedWebhook,
      events: JSON.parse(updatedWebhook.events) as WebhookEvent[],
      createdAt: updatedWebhook.createdAt.toISOString(),
      lastTriggered: updatedWebhook.lastTriggered?.toISOString(),
      active: Boolean(updatedWebhook.active), // Alterado de isActive para active
    }
  } catch (error) {
    console.error("Error updating webhook:", error)
    return null
  }
}

export async function deleteWebhook(id: string, userId: string): Promise<boolean> {
  try {
    // Delete related webhook logs first
    await prisma.webhookLog.deleteMany({
      where: { webhookId: id },
    })

    // Then delete the webhook
    await prisma.webhook.delete({
      where: {
        id,
        userId,
      },
    })

    return true
  } catch (error) {
    console.error("Error deleting webhook:", error)
    return false
  }
}

export async function logWebhookCall(log: Omit<WebhookLog, "id" | "createdAt">): Promise<WebhookLog> {
  const newLog = await prisma.webhookLog.create({
    data: {
      webhookId: log.webhookId,
      event: log.event,
      payload: JSON.stringify(log.payload),
      status: log.status || null,
      response: log.response || null,
    },
  })

  return {
    ...newLog,
    payload: JSON.parse(newLog.payload),
    createdAt: newLog.createdAt.toISOString(),
  }
}

export async function getWebhookLogs(webhookId: string, limit = 50): Promise<WebhookLog[]> {
  const logs = await prisma.webhookLog.findMany({
    where: { webhookId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return logs.map((log) => ({
    ...log,
    payload: JSON.parse(log.payload),
    createdAt: log.createdAt.toISOString(),
  }))
}

// Function to trigger webhooks
export async function triggerWebhooks(event: WebhookEvent, payload: any, userId: string): Promise<void> {
  console.log(`[Webhook] Triggering webhooks for event: ${event}, userId: ${userId}`)

  try {
    const webhooks = await getWebhooksByEvent(event, userId)

    // If there are no webhooks for this event, return
    if (webhooks.length === 0) {
      console.log(`[Webhook] No webhooks found for event: ${event}`)
      return
    }

    console.log(`[Webhook] Found ${webhooks.length} webhooks for event: ${event}`)

    // For each webhook, make the HTTP call
    for (const webhook of webhooks) {
      try {
        console.log(`[Webhook] Processing webhook: ${webhook.id} (${webhook.name}) to URL: ${webhook.url}`)

        // Prepare the request body
        const body = JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
          webhookId: webhook.id,
        })

        // Prepare headers
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        // Add signature header if there's a secret
        if (webhook.secret) {
          // In a real implementation, you would use a cryptography library
          // to create an HMAC signature of the body with the secret
          headers["X-Webhook-Signature"] = `sha256=${webhook.secret}`
          console.log(`[Webhook] Added signature header for webhook: ${webhook.id}`)
        }

        console.log(`[Webhook] Sending webhook to: ${webhook.url}`)

        // Make the HTTP call
        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body,
        })

        // Record the result
        const status = response.status
        let responseText = ""

        try {
          responseText = await response.text()
        } catch (textError) {
          console.error(`[Webhook] Error reading response text:`, textError)
          responseText = "Error reading response"
        }

        console.log(
          `[Webhook] Response: Status ${status}, Body: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`,
        )

        // Update the webhook with the last status
        await updateWebhook(
          webhook.id,
          {
            lastTriggered: new Date().toISOString(),
            lastStatus: status,
          },
          userId,
        )

        // Log the call
        await logWebhookCall({
          webhookId: webhook.id,
          event,
          payload,
          status,
          response: responseText,
        })

        console.log(`[Webhook] Webhook ${webhook.id} processed successfully`)
      } catch (error) {
        console.error(`[Webhook] Error triggering webhook ${webhook.id} to ${webhook.url}:`, error)

        // Log the error
        await logWebhookCall({
          webhookId: webhook.id,
          event,
          payload,
          status: 0,
          response: error instanceof Error ? error.message : String(error),
        })

        // Update the webhook with the error status
        await updateWebhook(
          webhook.id,
          {
            lastTriggered: new Date().toISOString(),
            lastStatus: 0,
          },
          userId,
        )
      }
    }
  } catch (error) {
    console.error(`[Webhook] Error in triggerWebhooks function:`, error)
  }
}
