import { type NextRequest, NextResponse } from "next/server"
import { getContactById, createContact, type ContactInput } from "@/lib/services/contact-service"
import prisma from "@/lib/prisma"
import { triggerWebhooks } from "@/lib/webhook-db"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// Função auxiliar para normalizar strings para comparação
function normalizeString(str: string): string {
  return str.toLowerCase().trim()
}

// GET /api/contacts - Lista todos os contatos
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get("status")
      const source = searchParams.get("source")
      const query = searchParams.get("q")
      const id = searchParams.get("id")

      console.log("Received filter params:", { status, source, query, id })

      if (id) {
        const [contact, error] = await getContactById(id, userId)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!contact) {
          return NextResponse.json({ error: "Contact not found" }, { status: 404 })
        }

        return NextResponse.json(contact)
      }

      // Buscar todos os contatos primeiro
      const allContacts = await prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })

      console.log(`Found ${allContacts.length} total contacts for user`)

      // Aplicar filtros manualmente para maior controle
      let filteredContacts = allContacts

      // Filtrar por status
      if (status && status !== "todos") {
        filteredContacts = filteredContacts.filter(
          (contact) => normalizeString(contact.status) === normalizeString(status),
        )
        console.log(`After status filter (${status}): ${filteredContacts.length} contacts`)
      }

      // Filtrar por source
      if (source && source !== "todas") {
        filteredContacts = filteredContacts.filter(
          (contact) => normalizeString(contact.source) === normalizeString(source),
        )
        console.log(`After source filter (${source}): ${filteredContacts.length} contacts`)
      }

      // Filtrar por query
      if (query) {
        const searchLower = normalizeString(query)
        filteredContacts = filteredContacts.filter(
          (contact) =>
            normalizeString(contact.name).includes(searchLower) ||
            normalizeString(contact.contact).includes(searchLower) ||
            (contact.notes && normalizeString(contact.notes).includes(searchLower)),
        )
        console.log(`After query filter (${query}): ${filteredContacts.length} contacts`)
      }

      // Log dos resultados para debugging
      if (filteredContacts.length > 0) {
        console.log("Sample filtered contact:", {
          id: filteredContacts[0].id,
          name: filteredContacts[0].name,
          status: filteredContacts[0].status,
          source: filteredContacts[0].source,
        })
      }

      return NextResponse.json(filteredContacts)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      return NextResponse.json({ error: "Error fetching contacts" }, { status: 500 })
    }
  })
}

// Modificar a função POST para verificar o limite de contatos baseado no plano do usuário
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const body = await req.json()

      // Validate data
      if (!body.name || !body.contact || !body.source || !body.status) {
        return NextResponse.json(
          { error: "Incomplete data. Name, contact, source, and status are required." },
          { status: 400 },
        )
      }

      // Verificar o plano do usuário e aplicar limites
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Verificar limite de contatos para o plano Starter
      if (user.plan === "Starter") {
        const contactCount = await prisma.contact.count({
          where: { userId },
        })

        if (contactCount >= 100) {
          return NextResponse.json(
            {
              error: "Limite de contatos atingido",
              message:
                "Você atingiu o limite de 100 contatos do plano Starter. Faça upgrade para o plano Pro ou Business para adicionar mais contatos.",
              limit: 100,
              current: contactCount,
              plan: "Starter",
            },
            { status: 403 },
          )
        }
      }

      const contactData: ContactInput = {
        name: body.name,
        contact: body.contact,
        source: body.source,
        status: body.status,
        notes: body.notes || null,
      }

      const [newContact, error] = await createContact(contactData, userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Disparar o webhook para o evento contact.created
      await triggerWebhooks("contact.created", newContact, userId)

      return NextResponse.json(newContact, { status: 201 })
    } catch (error) {
      console.error("Error creating contact:", error)
      return NextResponse.json({ error: "Error creating contact" }, { status: 500 })
    }
  })
}
