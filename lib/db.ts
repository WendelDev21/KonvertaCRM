import prisma from "./prisma"

// Types
export type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"
export type ContactSource = "WhatsApp" | "Instagram" | "Outro"

export interface Contact {
  id: string
  name: string
  contact: string
  source: ContactSource
  status: ContactStatus
  createdAt: string | Date
  notes?: string
  userId: string
  value?: number
}

// Functions to access the database
export async function getAllContacts(userId: string): Promise<Contact[]> {
  const contacts = await prisma.contact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return contacts.map(formatContact)
}

export async function getContactById(id: string, userId: string): Promise<Contact | null> {
  const contact = await prisma.contact.findFirst({
    where: {
      id,
      userId,
    },
  })
  return contact ? formatContact(contact) : null
}

export async function getContactsByStatus(status: ContactStatus, userId: string): Promise<Contact[]> {
  const contacts = await prisma.contact.findMany({
    where: {
      status,
      userId,
    },
    orderBy: { createdAt: "desc" },
  })
  return contacts.map(formatContact)
}

export async function getContactsBySource(source: ContactSource, userId: string): Promise<Contact[]> {
  const contacts = await prisma.contact.findMany({
    where: {
      source,
      userId,
    },
    orderBy: { createdAt: "desc" },
  })
  return contacts.map(formatContact)
}

export async function createContact(
  contact: Omit<Contact, "id" | "createdAt"> & { id?: string },
  userId: string,
): Promise<Contact> {
  const newContact = await prisma.contact.create({
    data: {
      id: contact.id || undefined,
      name: contact.name,
      contact: contact.contact,
      source: contact.source,
      status: contact.status,
      notes: contact.notes || null,
      value: contact.value || 0,
      userId,
    },
  })
  return formatContact(newContact)
}

export async function updateContact(
  id: string,
  contact: Partial<Omit<Contact, "id" | "createdAt">>,
  userId: string,
): Promise<Contact | null> {
  try {
    const updatedContact = await prisma.contact.update({
      where: {
        id,
        userId,
      },
      data: {
        name: contact.name,
        contact: contact.contact,
        source: contact.source as ContactSource | undefined,
        status: contact.status as ContactStatus | undefined,
        notes: contact.notes,
        value: contact.value,
      },
    })
    return formatContact(updatedContact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return null
  }
}

export async function deleteContact(id: string, userId: string): Promise<boolean> {
  try {
    await prisma.contact.delete({
      where: {
        id,
        userId,
      },
    })
    return true
  } catch (error) {
    console.error("Error deleting contact:", error)
    return false
  }
}

// Functions for statistics and dashboard
export async function getContactCountByStatus(userId: string): Promise<Record<ContactStatus, number>> {
  const counts = await prisma.contact.groupBy({
    by: ["status"],
    where: { userId },
    _count: {
      status: true,
    },
  })

  // Initialize with zeros to ensure all statuses are present
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
}

export async function getContactCountBySource(userId: string): Promise<Record<ContactSource, number>> {
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
}

export async function getContactsCreatedByPeriod(
  startDate: string,
  endDate: string,
  userId: string,
  groupBy: "day" | "week" | "month" = "day",
): Promise<{ date: string; count: number }[]> {
  const contacts = await prisma.contact.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      userId,
    },
    select: {
      createdAt: true,
    },
  })

  // Process results to group by period
  const counts: Record<string, number> = {}

  contacts.forEach(({ createdAt }) => {
    const date = new Date(createdAt)
    let key: string

    if (groupBy === "day") {
      key = date.toISOString().split("T")[0] // YYYY-MM-DD
    } else if (groupBy === "week") {
      // Get the start of the week (Sunday)
      const day = date.getUTCDay()
      const diff = date.getUTCDate() - day
      const startOfWeek = new Date(date)
      startOfWeek.setUTCDate(diff)
      key = startOfWeek.toISOString().split("T")[0]
    } else {
      // Month (YYYY-MM)
      key = date.toISOString().split("T")[0].substring(0, 7)
    }

    counts[key] = (counts[key] || 0) + 1
  })

  // Convert to expected array format
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

// Helper function to format contact dates
function formatContact(contact: any): Contact {
  return {
    ...contact,
    createdAt: contact.createdAt instanceof Date ? contact.createdAt.toISOString() : contact.createdAt,
  }
}

// Funções para dados financials
export async function getFinancialDataByStatus(userId: string): Promise<Record<ContactStatus, number>> {
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
}

export async function getFinancialDataBySource(userId: string): Promise<Record<ContactSource, number>> {
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
}

export async function getTotalFinancialValue(userId: string): Promise<number> {
  const result = await prisma.contact.aggregate({
    where: { userId },
    _sum: {
      value: true,
    },
  })

  return result._sum.value || 0
}
