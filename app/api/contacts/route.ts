// Corrigir as importações incorretas
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

// POST /api/contacts - Cria um ou múltiplos contatos
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const body = await req.json()

      // Detectar se é operação em lote ou individual
      const isBatch = Array.isArray(body)
      const contacts = isBatch ? body : [body]

      // Verificar o plano do usuário e aplicar limites
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Verificar limite de contatos para o plano Starter
      const currentContactCount = await prisma.contact.count({
        where: { userId },
      })

      const results = []
      const errors = []

      for (let i = 0; i < contacts.length; i++) {
        const contactData = contacts[i]

        try {
          // Validate data
          if (!contactData.name || !contactData.contact || !contactData.source || !contactData.status) {
            errors.push({
              index: i,
              error: "Incomplete data. Name, contact, source, and status are required.",
            })
            continue
          }

          // Verificar limite para plano Starter
          if (user.plan === "Starter") {
            const totalContactsAfterCreation = currentContactCount + results.length + 1

            if (totalContactsAfterCreation > 100) {
              errors.push({
                index: i,
                error: "Limite de contatos atingido",
                message:
                  "Você atingiu o limite de 100 contatos do plano Starter. Faça upgrade para o plano Pro ou Business para adicionar mais contatos.",
                limit: 100,
                current: currentContactCount + results.length,
                plan: "Starter",
              })
              continue
            }
          }

          const contactInput: ContactInput = {
            name: contactData.name,
            contact: contactData.contact,
            source: contactData.source,
            status: contactData.status,
            notes: contactData.notes || null,
          }

          const [newContact, error] = await createContact(contactInput, userId)

          if (error) {
            errors.push({ index: i, error: error.message })
            continue
          }

          // Disparar o webhook para o evento contact.created
          await triggerWebhooks("contact.created", newContact, userId)

          results.push(newContact)
        } catch (error) {
          console.error(`Error creating contact ${i + 1}:`, error)
          errors.push({ index: i, error: "Error creating contact" })
        }
      }

      // Retornar resultado apropriado
      if (isBatch) {
        return NextResponse.json(
          {
            success: results.length > 0,
            created: results.length,
            total: contacts.length,
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
              error: error?.error || "Error creating contact",
              message: error?.message,
              limit: error?.limit,
              current: error?.current,
              plan: error?.plan,
            },
            { status: error?.plan ? 403 : 400 },
          )
        }
      }
    } catch (error) {
      console.error("Error creating contact(s):", error)
      return NextResponse.json({ error: "Error creating contact(s)" }, { status: 500 })
    }
  })
}
