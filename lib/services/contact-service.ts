import { prisma, dbAction } from "../db-client"

export type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"
export type ContactSource = "WhatsApp" | "Instagram" | "Outro"

export type ContactInput = {
  name: string
  contact: string
  source: ContactSource
  status: ContactStatus
  notes?: string | null
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
