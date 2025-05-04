"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { ContactCard } from "./contact-card"
import { ContactDetailsDialog } from "./contact-details-dialog"
import { AddContactDialog } from "./add-contact-dialog"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"

export type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"

export interface Contact {
  id: string
  name: string
  contact: string
  source: string
  status: ContactStatus
  notes?: string
  createdAt: Date | string
  updatedAt?: Date | string
}

export function KanbanBoard() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogStatus, setAddDialogStatus] = useState<ContactStatus>("Novo")
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [columnOver, setColumnOver] = useState<ContactStatus | null>(null)
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Reduzir a distância de ativação para facilitar o arrasto
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const fetchContacts = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch("/api/contacts", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar contatos")
      }

      const data = await response.json()
      console.log("Contatos carregados:", data.length)
      setContacts(data)
    } catch (error) {
      console.error("Erro ao buscar contatos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id)

    const draggedContact = contacts.find((contact) => contact.id === active.id)
    if (draggedContact) {
      setActiveContact(draggedContact)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event

    // Limpar o estado se não estiver sobre nada
    if (!over) {
      setColumnOver(null)
      return
    }

    const overId = String(over.id)

    // Verificar se está sobre uma coluna
    if (["Novo", "Conversando", "Interessado", "Fechado", "Perdido"].includes(overId)) {
      setColumnOver(overId as ContactStatus)
    } else {
      // Se estiver sobre um card, identificar a coluna do card
      const overContact = contacts.find((c) => c.id === overId)
      if (overContact) {
        setColumnOver(overContact.status)
      } else {
        setColumnOver(null)
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // Limpar estados de arrastar
    setActiveId(null)
    setActiveContact(null)
    setColumnOver(null)

    // Se não houver destino, não fazer nada
    if (!over) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    // Encontrar o contato que está sendo arrastado
    const draggedContact = contacts.find((c) => c.id === activeId)
    if (!draggedContact) return

    // Verificar se o destino é uma coluna (status)
    const isColumnDrop = ["Novo", "Conversando", "Interessado", "Fechado", "Perdido"].includes(overId)

    let targetStatus: ContactStatus
    let targetPosition: number | null = null

    if (isColumnDrop) {
      // Se soltar diretamente na coluna
      targetStatus = overId as ContactStatus
    } else {
      // Se soltar em outro card
      const overContact = contacts.find((c) => c.id === overId)
      if (!overContact) return

      targetStatus = overContact.status

      // Determinar se deve inserir antes ou depois do card alvo
      // Usando a posição do cursor em relação ao centro do elemento
      const { over: overData } = event
      if (overData && overData.rect) {
        const overRect = overData.rect
        const overCenterY = overRect.top + overRect.height / 2

        // Se o cursor estiver acima do centro do card, inserir antes
        // Se estiver abaixo, inserir depois
        const isBefore = event.activatorEvent instanceof PointerEvent && event.activatorEvent.clientY < overCenterY

        // Encontrar a posição do card alvo na lista de sua coluna
        const contactsInColumn = contacts.filter((c) => c.status === targetStatus)
        const overIndex = contactsInColumn.findIndex((c) => c.id === overId)

        // Calcular a posição de inserção
        targetPosition = isBefore ? overIndex : overIndex + 1
      }
    }

    // Se o status mudou, atualizar no servidor
    if (draggedContact.status !== targetStatus) {
      await updateContactStatus(activeId, targetStatus)
    }

    // Reordenar localmente os contatos na coluna de destino
    if (targetPosition !== null) {
      setContacts((prevContacts) => {
        // Remover o contato arrastado da lista
        const withoutDragged = prevContacts.filter((c) => c.id !== activeId)

        // Encontrar todos os contatos na coluna de destino
        const contactsInTargetColumn = withoutDragged.filter((c) => c.status === targetStatus)

        // Inserir o contato arrastado na posição correta
        contactsInTargetColumn.splice(targetPosition, 0, {
          ...draggedContact,
          status: targetStatus,
        })

        // Combinar com os contatos de outras colunas
        const contactsInOtherColumns = withoutDragged.filter((c) => c.status !== targetStatus)
        return [...contactsInOtherColumns, ...contactsInTargetColumn]
      })
    }
  }

  const updateContactStatus = async (contactId: string, newStatus: ContactStatus) => {
    // Marcar o contato como sendo atualizado
    setUpdatingContactId(contactId)

    // Atualizar o estado local primeiro para feedback imediato
    setContacts((prevContacts) =>
      prevContacts.map((contact) => (contact.id === contactId ? { ...contact, status: newStatus } : contact)),
    )

    try {
      console.log(`Enviando atualização para contato ${contactId}: status=${newStatus}`)

      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const responseData = await response.json()
      console.log("Resposta da API:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar status do contato")
      }

      toast({
        title: "Status atualizado",
        description: `Contato movido para ${newStatus}`,
      })

      // Recarregar os contatos para garantir sincronização
      await fetchContacts(true)
    } catch (error) {
      console.error("Erro ao atualizar status do contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do contato. Tente novamente.",
        variant: "destructive",
      })

      // Reverter a mudança no estado local em caso de erro e recarregar os dados
      await fetchContacts()
    } finally {
      setUpdatingContactId(null)
    }
  }

  const handleCardClick = (contact: Contact) => {
    setSelectedContact(contact)
    setDetailsOpen(true)
  }

  const handleAddContact = (status: ContactStatus) => {
    setAddDialogStatus(status)
    setAddDialogOpen(true)
  }

  const handleContactAdded = async () => {
    await fetchContacts()
    setAddDialogOpen(false)
  }

  // Agrupar contatos por status
  const contactsByStatus = {
    Novo: contacts.filter((contact) => contact.status === "Novo"),
    Conversando: contacts.filter((contact) => contact.status === "Conversando"),
    Interessado: contacts.filter((contact) => contact.status === "Interessado"),
    Fechado: contacts.filter((contact) => contact.status === "Fechado"),
    Perdido: contacts.filter((contact) => contact.status === "Perdido"),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando kanban...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kanban de Contatos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchContacts(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden md:block"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden md:block"></div>

        <DndContext
          sensors={sensors}
          collisionDetection={(args) => {
            // Usar uma combinação de estratégias para melhor precisão
            const pointerCollisions = pointerWithin({
              ...args,
              droppableContainers: args.droppableContainers.map((container) => ({
                ...container,
                data: {
                  ...container.data,
                  value: {
                    ...container.data.value,
                    rect: container.rect
                      ? {
                          ...container.rect,
                          width: container.rect.width + 40,
                          height: container.rect.height + 40,
                          left: container.rect.left - 20,
                          top: container.rect.top - 20,
                        }
                      : undefined,
                  },
                },
              })),
            })

            if (pointerCollisions.length > 0) {
              return pointerCollisions
            }

            return rectIntersection(args)
          }}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory">
            {Object.entries(contactsByStatus).map(([status, statusContacts]) => (
              <KanbanColumn
                key={status}
                status={status as ContactStatus}
                contacts={statusContacts}
                onCardClick={handleCardClick}
                onAddContact={handleAddContact}
                isOver={columnOver === status}
                updatingContactId={updatingContactId}
                activeId={activeId ? String(activeId) : null} // Passar o activeId para a coluna
              />
            ))}
          </div>

          <DragOverlay>
            {activeId && activeContact ? (
              <div className="transform-gpu scale-105 opacity-90 shadow-lg rotate-1 w-[280px]">
                <ContactCard contact={activeContact} onClick={() => {}} isDragging={true} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ContactDetailsDialog
        contact={selectedContact}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onContactUpdated={() => fetchContacts(true)}
      />

      <AddContactDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialStatus={addDialogStatus}
        onContactAdded={handleContactAdded}
      />
    </div>
  )
}
