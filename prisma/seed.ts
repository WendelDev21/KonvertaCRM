import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"
import type { ContactSource, ContactStatus } from "../lib/db"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create admin user if it doesn't exist
  const adminEmail = "admin@example.com"
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await hash("admin123", 10)
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
    })
    console.log("Admin user created")
  } else {
    console.log("Admin user already exists")
  }

  // Get the admin user
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!admin) {
    console.error("Failed to find or create admin user")
    return
  }

  // Check if contacts already exist
  const contactCount = await prisma.contact.count({
    where: { userId: admin.id },
  })

  if (contactCount > 0) {
    console.log(`Database already has ${contactCount} contacts, skipping seed.`)
    return
  }

  // Sample data
  const sampleContacts = [
    {
      name: "João Silva",
      contact: "+55 11 98765-4321",
      source: "WhatsApp" as ContactSource,
      status: "Novo" as ContactStatus,
      notes: "Cliente interessado em orçamento para serviço completo.",
    },
    {
      name: "Maria Oliveira",
      contact: "@maria.oliveira",
      source: "Instagram" as ContactSource,
      status: "Conversando" as ContactStatus,
      notes: "Enviou mensagem perguntando sobre disponibilidade.",
    },
    {
      name: "Pedro Santos",
      contact: "+55 21 98765-4321",
      source: "WhatsApp" as ContactSource,
      status: "Interessado" as ContactStatus,
      notes: "Solicitou orçamento detalhado.",
    },
    {
      name: "Ana Costa",
      contact: "@ana.costa",
      source: "Instagram" as ContactSource,
      status: "Fechado" as ContactStatus,
      notes: "Contrato assinado. Início do projeto em 15/05.",
    },
    {
      name: "Carlos Ferreira",
      contact: "+55 31 98765-4321",
      source: "WhatsApp" as ContactSource,
      status: "Perdido" as ContactStatus,
      notes: "Optou por outro fornecedor devido ao preço.",
    },
  ]

  // Create contacts with varied dates in the last 90 days
  const now = new Date()

  for (const contact of sampleContacts) {
    // Distribute dates over the last 90 days
    const daysAgo = Math.floor(Math.random() * 90)
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - daysAgo)

    await prisma.contact.create({
      data: {
        name: contact.name,
        contact: contact.contact,
        source: contact.source,
        status: contact.status,
        createdAt: createdAt,
        notes: contact.notes,
        userId: admin.id,
      },
    })
  }

  console.log(`Database initialized with ${sampleContacts.length} sample contacts.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
