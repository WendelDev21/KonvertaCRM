import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getContactById, updateContact, deleteContact } from "@/lib/services/contact-service"
import { triggerWebhooks } from "@/lib/webhook-db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const [contact, error] = await getContactById(params.id, userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error fetching contact:", error)
    return NextResponse.json({ error: "Error fetching contact" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`PUT request received for contact ID: ${params.id}`)

    const currentUser = await getCurrentUser()

    if (!currentUser) {
      console.log("Unauthorized: No current user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    console.log(`User ID: ${userId}`)

    const body = await request.json()
    console.log("Request body:", body)

    // Get the original contact for comparison
    const [originalContact, getError] = await getContactById(params.id, userId)

    if (getError) {
      console.error("Error fetching original contact:", getError)
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    if (!originalContact) {
      console.log("Contact not found")
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    console.log("Original contact:", originalContact)

    const updateData = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.contact !== undefined) updateData.contact = body.contact
    if (body.source !== undefined) updateData.source = body.source
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    console.log("Update data:", updateData)

    const [updatedContact, updateError] = await updateContact(params.id, updateData, userId)

    if (updateError) {
      console.error("Error updating contact:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (!updatedContact) {
      console.log("Contact not found after update")
      return NextResponse.json({ error: "Contact not found or update failed" }, { status: 404 })
    }

    console.log("Updated contact:", updatedContact)

    // Verificar se o status foi alterado para disparar o evento específico
    if (originalContact.status !== updatedContact.status) {
      console.log(`Status changed from ${originalContact.status} to ${updatedContact.status}`)
      await triggerWebhooks(
        "contact.status_changed",
        {
          contact: updatedContact,
          previousStatus: originalContact.status,
          newStatus: updatedContact.status,
        },
        userId,
      )
    }

    // Disparar o webhook para o evento contact.updated
    await triggerWebhooks("contact.updated", updatedContact, userId)

    // Return the updated contact
    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json({ error: "Error updating contact" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    // Get the contact before deleting it
    const [contact, getError] = await getContactById(params.id, userId)

    if (getError) {
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const [success, deleteError] = await deleteContact(params.id, userId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Disparar o webhook para o evento contact.deleted
    await triggerWebhooks("contact.deleted", contact, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json({ error: "Error deleting contact" }, { status: 500 })
  }
}

// Add this to prevent Next.js from attempting to statically optimize this route
export const dynamic = "force-dynamic"
