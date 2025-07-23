const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

// Base headers for Evolution API requests
const getHeaders = () => ({
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
})

// Create a new WhatsApp instance
export async function createEvolutionInstance(instanceName: string) {
  console.log(`[Evolution API] Creating instance: ${instanceName}`)

  const webhookUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  const fullWebhookUrl = `${webhookUrl}/api/whatsapp/webhook`

  console.log(`[Evolution API] Using webhook URL: ${fullWebhookUrl}`)

  const payload = {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    webhook: {
      url: fullWebhookUrl,
      events: [
        "APPLICATION_STARTUP",
        "QRCODE_UPDATED",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONTACTS_SET",
        "CONTACTS_UPSERT",
        "CONTACTS_UPDATE",
        "PRESENCE_UPDATE",
        "CHATS_SET",
        "CHATS_UPSERT",
        "CHATS_UPDATE",
        "CHATS_DELETE",
        "GROUPS_UPSERT",
        "GROUP_UPDATE",
        "GROUP_PARTICIPANTS_UPDATE",
        "CONNECTION_UPDATE",
        "CALL",
        "NEW_JWT_TOKEN",
      ],
    },
    settings: {
      rejectCall: false,
      msgCall: "Desculpe, não posso atender chamadas no momento.",
      groupsIgnore: false,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
    },
  }

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log(`[Evolution API] Create response:`, data)

    if (!response.ok) {
      throw new Error(`Evolution API error: ${data.message || response.statusText}`)
    }

    return data
  } catch (error) {
    console.error("[Evolution API] Error creating instance:", error)
    throw error
  }
}

// Delete a WhatsApp instance
export async function deleteEvolutionInstance(instanceName: string) {
  console.log(`[Evolution API] Deleting instance: ${instanceName}`)

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Evolution API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Evolution API] Delete response:`, data)
    return data
  } catch (error) {
    console.error("[Evolution API] Error deleting instance:", error)
    throw error
  }
}

// Logout from WhatsApp instance
export async function logoutEvolutionInstance(instanceName: string) {
  console.log(`[Evolution API] Logging out instance: ${instanceName}`)

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Evolution API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Evolution API] Logout response:`, data)
    return data
  } catch (error) {
    console.error("[Evolution API] Error logging out instance:", error)
    throw error
  }
}

// Get instance status
export async function getEvolutionInstanceStatus(instanceName: string) {
  console.log(`[Evolution API] Getting status for instance: ${instanceName}`)

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: "GET",
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Evolution API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Evolution API] Status response:`, data)
    return data
  } catch (error) {
    console.error("[Evolution API] Error getting instance status:", error)
    throw error
  }
}

// Get QR code for instance
export async function getEvolutionInstanceQrCode(instanceName: string) {
  console.log(`[Evolution API] Getting QR code for instance: ${instanceName}`)

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Evolution API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Evolution API] QR code response:`, data)
    return data
  } catch (error) {
    console.error("[Evolution API] Error getting QR code:", error)
    throw error
  }
}

// Send a message
export async function sendEvolutionMessage(instanceName: string, number: string, message: string) {
  console.log(`[Evolution API] Sending message to ${number} via instance: ${instanceName}`)

  const payload = {
    number,
    options: {
      delay: 1200,
      presence: "composing",
      linkPreview: false,
    },
    textMessage: {
      text: message,
    },
  }

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Evolution API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Evolution API] Send message response:`, data)
    return data
  } catch (error) {
    console.error("[Evolution API] Error sending message:", error)
    throw error
  }
}

// Get instance connection state
export async function getEvolutionConnectionState(instanceName: string) {
  console.log(`[Evolution API] Getting connection state for instance: ${instanceName}`)

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Evolution API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Evolution API] Connection state response:`, data)
    return data
  } catch (error) {
    console.error("[Evolution API] Error getting connection state:", error)
    throw error
  }
}
