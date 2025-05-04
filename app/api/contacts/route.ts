import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getContactById, createContact } from "@/lib/services/contact-service"
import prisma from "@/lib/prisma"
import { triggerWebhooks } from "@/lib/webhook-db"

// Tell Next.js this route should not be statically optimized
export const dynamic = "force-dynamic"

// Helper function to normalize strings for comparison
function normalizeString(str: string): string {
  return str.toLowerCase().trim()
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const { searchParams } = new URL(request.url)
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

    // Fetch all contacts first
    const allContacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    console.log(`Found ${allContacts.length} total contacts for user`)

    // Apply filters manually for better control
    let filteredContacts = allContacts

    // Filter by status
    if (status && status !== "todos") {
      filteredContacts = filteredContacts.filter(
        (contact) => normalizeString(contact.status) === normalizeString(status),
      )
      console.log(`After status filter (${status}): ${filteredContacts.length} contacts`)
    }

    // Filter by source
    if (source && source !== "todas") {
      filteredContacts = filteredContacts.filter(
        (contact) => normalizeString(contact.source) === normalizeString(source),
      )
      console.log(`After source filter (${source}): ${filteredContacts.length} contacts`)
    }

    // Filter by query
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

    // Log results for debugging
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
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const body = await request.json()

    // Validate data
    if (!body.name || !body.contact || !body.source || !body.status) {
      return NextResponse.json(
        { error: "Incomplete data. Name, contact, source, and status are required." },
        { status: 400 },
      )
    }

    const contactData = {
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

    // Trigger webhook for the contact.created event
    await triggerWebhooks("contact.created", newContact, userId)

    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json({ error: "Error creating contact" }, { status: 500 })
  }
}
