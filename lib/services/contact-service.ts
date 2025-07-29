import { prisma, dbAction } from "../db-client"

export type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"
export type ContactSource = "WhatsApp" | "Instagram" | "Outro"

export type ContactInput = {
  name: string
  contact: string
  source: ContactSource
  status: ContactStatus
  notes?: string | null
  value?: number | null
}

export async function getAllContacts(userId: string) {
  return dbAction(() =>
    prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  )
}

export async function getContactById(id: string, userId: string) {
  console.log(`Getting contact by ID: ${id} for user: ${userId}`)
  return dbAction(() =>
    prisma.contact.findFirst({
      where: {
        id,
        userId,
      },
    }),
  )
}

export async function getContactsByStatus(status: ContactStatus, userId: string) {
  return dbAction(() =>
    prisma.contact.findMany({
      where: {
        status,
        userId,
      },
      orderBy: { createdAt: "desc" },
    }),
  )
}

export async function createContact(data: ContactInput, userId: string) {
  return dbAction(() =>
    prisma.contact.create({
      data: {
        ...data,
        userId,
      },
    }),
  )
}

export async function updateContact(id: string, data: Partial<ContactInput>, userId: string) {
  console.log(`Updating contact ${id} for user ${userId} with data:`, data)

  // Verificar se o contato existe antes de atualizar
  return dbAction(async () => {
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingContact) {
      console.log(`Contact ${id} not found for user ${userId}`)
      throw new Error(`Contact not found`)
    }

    console.log(`Found existing contact:`, existingContact)

    // Realizar a atualização
    const updated = await prisma.contact.update({
      where: {
        id,
        userId,
      },
      data,
    })

    console.log(`Contact updated successfully:`, updated)
    return updated
  })
}

export async function deleteContact(id: string, userId: string) {
  return dbAction(async () => {
    await prisma.contact.delete({
      where: {
        id,
        userId,
      },
    })
    return true
  })
}

export async function getContactStats(userId: string) {
  const [statusCounts] = await dbAction(async () => {
    const counts = await prisma.contact.groupBy({
      by: ["status"],
      where: { userId },
      _count: {
        status: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactStatus, number> = {
      Novo: 0,
      Conversando: 0,
      Interessado: 0,
      Fechado: 0,
      Perdido: 0,
    }

    // Fill with actual results
    counts.forEach((count) => {
      result[count.status as ContactStatus] = count._count.status
    })

    return result
  })

  const [sourceCounts] = await dbAction(async () => {
    const counts = await prisma.contact.groupBy({
      by: ["source"],
      where: { userId },
      _count: {
        source: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactSource, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Outro: 0,
    }

    // Fill with actual results
    counts.forEach((count) => {
      result[count.source as ContactSource] = count._count.source
    })

    return result
  })

  return { statusCounts: statusCounts || {}, sourceCounts: sourceCounts || {} }
}

// Adicionar função para verificar o limite de contatos
export async function checkContactLimit(userId: string) {
  return dbAction(async () => {
    // Obter o plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const contactCount = await prisma.contact.count({
      where: { userId },
    })

    // Verificar limites baseados no plano
    if (user.plan === "Starter") {
      return {
        plan: user.plan,
        count: contactCount,
        limit: 100,
        hasReachedLimit: contactCount >= 100,
      }
    } else if (user.plan === "Pro") {
      return {
        plan: user.plan,
        count: contactCount,
        limit: 500,
        hasReachedLimit: contactCount >= 500,
      }
    }

    // Para plano Business, não há limite
    return {
      plan: user.plan,
      count: contactCount,
      limit: null, // Sem limite
      hasReachedLimit: false,
    }
  })
}

// Funções para dados financials
export async function getFinancialDataByStatus(userId: string) {
  return dbAction(async () => {
    const contacts = await prisma.contact.findMany({
      where: { userId },
      select: {
        status: true,
        value: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactStatus, number> = {
      Novo: 0,
      Conversando: 0,
      Interessado: 0,
      Fechado: 0,
      Perdido: 0,
    }

    // Sum values by status
    contacts.forEach((contact) => {
      const status = contact.status as ContactStatus
      result[status] += contact.value || 0
    })

    return result
  })
}

export async function getFinancialDataBySource(userId: string) {
  return dbAction(async () => {
    const contacts = await prisma.contact.findMany({
      where: { userId },
      select: {
        source: true,
        value: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactSource, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Outro: 0,
    }

    // Sum values by source
    contacts.forEach((contact) => {
      const source = contact.source as ContactSource
      result[source] += contact.value || 0
    })

    return result
  })
}

export async function getTotalFinancialValue(userId: string) {
  return dbAction(async () => {
    const result = await prisma.contact.aggregate({
      where: { userId },
      _sum: {
        value: true,
      },
    })

    return result._sum.value || 0
  })
}
