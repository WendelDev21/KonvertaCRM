import { prisma } from "@/lib/prisma"

export interface CreateWhatsAppInstanceData {
  instanceName: string
  userId: string
  status: string
  qrCode?: string | null
}

export interface UpdateWhatsAppInstanceData {
  status?: string
  qrCode?: string | null
}

export interface CreateWhatsAppMessageData {
  instanceId: string
  messageId: string
  fromNumber: string
  toNumber: string
  messageType: string
  content: string
  timestamp: Date
  userId: string
}

// WhatsApp Instance functions
export async function createWhatsAppInstance(data: CreateWhatsAppInstanceData) {
  console.log("[WhatsApp DB] Creating instance:", data.instanceName)
  try {
    const instance = await prisma.whatsAppInstance.create({
      data: {
        instanceName: data.instanceName,
        userId: data.userId,
        status: data.status,
        qrCode: data.qrCode,
      },
    })
    console.log("[WhatsApp DB] Instance created successfully:", instance.id)
    return instance
  } catch (error) {
    console.error("[WhatsApp DB] Error creating instance:", error)
    throw error
  }
}

export async function getWhatsAppInstance(instanceName: string, userId: string) {
  console.log(`[WhatsApp DB] Getting instance: ${instanceName} for user: ${userId}`)
  try {
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        instanceName,
        userId,
      },
    })
    console.log("[WhatsApp DB] Instance found:", instance ? "Yes" : "No")
    return instance
  } catch (error) {
    console.error("[WhatsApp DB] Error getting instance:", error)
    throw error
  }
}

export async function getWhatsAppInstanceByName(instanceName: string) {
  console.log(`[WhatsApp DB] Getting instance by name: ${instanceName}`)
  try {
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        instanceName,
      },
    })
    console.log("[WhatsApp DB] Instance found by name:", instance ? "Yes" : "No")
    return instance
  } catch (error) {
    console.error("[WhatsApp DB] Error getting instance by name:", error)
    throw error
  }
}

export async function getAllWhatsAppInstances(userId: string) {
  console.log(`[WhatsApp DB] Getting all instances for user: ${userId}`)
  try {
    const instances = await prisma.whatsAppInstance.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    console.log(`[WhatsApp DB] Found ${instances.length} instances`)
    return instances
  } catch (error) {
    console.error("[WhatsApp DB] Error getting instances:", error)
    throw error
  }
}

export async function updateWhatsAppInstance(instanceName: string, userId: string, data: UpdateWhatsAppInstanceData) {
  console.log(`[WhatsApp DB] Updating instance: ${instanceName} for user: ${userId}`)
  console.log(`[WhatsApp DB] Update data:`, data)
  try {
    const result = await prisma.whatsAppInstance.updateMany({
      where: {
        instanceName,
        userId,
      },
      data,
    })
    console.log(`[WhatsApp DB] Updated ${result.count} instances`)
    return result
  } catch (error) {
    console.error("[WhatsApp DB] Error updating instance:", error)
    throw error
  }
}

export async function deleteWhatsAppInstance(instanceName: string, userId: string) {
  console.log(`[WhatsApp DB] Deleting instance: ${instanceName} for user: ${userId}`)
  try {
    // First get the instance to get its ID
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        instanceName,
        userId,
      },
    })

    if (!instance) {
      console.log(`[WhatsApp DB] Instance not found: ${instanceName}`)
      return { count: 0 }
    }

    // Delete all messages for this instance using instanceId
    const messagesDeleted = await prisma.whatsAppMessage.deleteMany({
      where: {
        instanceId: instance.id,
      },
    })
    console.log(`[WhatsApp DB] Deleted ${messagesDeleted.count} associated messages`)

    // Then delete the instance
    const instanceDeleted = await prisma.whatsAppInstance.deleteMany({
      where: {
        instanceName,
        userId,
      },
    })
    console.log(`[WhatsApp DB] Deleted ${instanceDeleted.count} instances`)

    return instanceDeleted
  } catch (error) {
    console.error("[WhatsApp DB] Error deleting instance:", error)
    throw error
  }
}

// WhatsApp Message functions
export async function createWhatsAppMessage(data: CreateWhatsAppMessageData) {
  console.log("[WhatsApp DB] Creating message:", data.messageId)
  try {
    const message = await prisma.whatsAppMessage.create({
      data: {
        instanceId: data.instanceId,
        fromMe: data.fromNumber === "self", // Ajuste conforme necessário
        remoteJid: data.toNumber,
        messageId: data.messageId,
        messageType: data.messageType,
        messageText: data.content,
        rawPayload: {}, // Ajuste conforme necessário
      },
    })
    console.log("[WhatsApp DB] Message created successfully")
    return message
  } catch (error) {
    console.error("[WhatsApp DB] Error creating message:", error)
    throw error
  }
}

export async function getWhatsAppMessages(instanceName: string, userId: string) {
  console.log(`[WhatsApp DB] Getting messages for instance: ${instanceName}`)
  try {
    // First get the instance to get its ID
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        instanceName,
        userId,
      },
    })

    if (!instance) {
      console.log(`[WhatsApp DB] Instance not found: ${instanceName}`)
      return []
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        instanceId: instance.id,
      },
      orderBy: {
        timestamp: "desc",
      },
    })
    console.log(`[WhatsApp DB] Found ${messages.length} messages`)
    return messages
  } catch (error) {
    console.error("[WhatsApp DB] Error getting messages:", error)
    throw error
  }
}
