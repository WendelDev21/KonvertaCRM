import { type NextRequest, NextResponse } from "next/server"
import { getContactById, updateContact, deleteContact, type ContactInput } from "@/lib/services/contact-service"
import { triggerWebhooks } from "@/lib/webhook-db"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/contacts/[id] - Obtém detalhes de um contato específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
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
  })
}

// PUT /api/contacts/[id] - Atualiza um contato existente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      console.log(`[API] Contacts: PUT request received for contact ID: ${params.id}`)
      console.log(`[API] Contacts: User ID: ${userId}`)

      const body = await req.json()
      console.log("[API] Contacts: Request body:", body)

      // Get the original contact for comparison
      const [originalContact, getError] = await getContactById(params.id, userId)

      if (getError) {
        console.error("[API] Contacts: Error fetching original contact:", getError)
        return NextResponse.json({ error: getError.message }, { status: 500 })
      }

      if (!originalContact) {
        console.log("[API] Contacts: Contact not found")
        return NextResponse.json({ error: "Contact not found" }, { status: 404 })
      }

      console.log("[API] Contacts: Original contact:", originalContact)

      const updateData: Partial<ContactInput> = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.contact !== undefined) updateData.contact = body.contact
      if (body.source !== undefined) updateData.source = body.source
      if (body.status !== undefined) updateData.status = body.status
      if (body.notes !== undefined) updateData.notes = body.notes

      // Processar o campo value corretamente
      if (body.value !== undefined) {
        // Garantir que o valor seja um número
        let valueAsNumber = 0
        if (body.value !== null) {
          valueAsNumber = typeof body.value === "string" ? Number.parseFloat(body.value) : Number(body.value)

          // Se não for um número válido, definir como 0
          if (isNaN(valueAsNumber)) {
            valueAsNumber = 0
          }
        }
        updateData.value = valueAsNumber
      }

      console.log("[API] Contacts: Update data:", updateData)

      const [updatedContact, updateError] = await updateContact(params.id, updateData, userId)

      if (updateError) {
        console.error("[API] Contacts: Error updating contact:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      if (!updatedContact) {
        console.log("[API] Contacts: Contact not found after update")
        return NextResponse.json({ error: "Contact not found or update failed" }, { status: 404 })
      }

      console.log("[API] Contacts: Updated contact:", updatedContact)

      // Verificar se o status foi alterado para disparar o evento específico
      if (originalContact.status !== updatedContact.status) {
        console.log(`[API] Contacts: Status changed from ${originalContact.status} to ${updatedContact.status}`)
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
      console.error("[API] Contacts: Error updating contact:", error)
      return NextResponse.json(
        { error: `Error updating contact: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 },
      )
    }
  })
}

// DELETE /api/contacts/[id] - Remove um contato
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
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
  })
}
