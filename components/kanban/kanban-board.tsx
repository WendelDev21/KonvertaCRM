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
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
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
  const [scrollLocked, setScrollLocked] = useState(false)
  const [originalContacts, setOriginalContacts] = useState<Contact[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 150,
        tolerance: 5,
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
      setOriginalContacts(data) // Salvar estado original
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
      // Salvar o estado original antes de começar o drag
      setOriginalContacts([...contacts])
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, activatorEvent } = event

    // Detectar se está próximo às bordas para travar o scroll
    if (activatorEvent && "clientX" in activatorEvent) {
      const containerElement = document.querySelector("[data-kanban-container]")
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect()
        const pointerX = activatorEvent.clientX
        const edgeThreshold = 100 // pixels da borda

        const isNearLeftEdge = pointerX - containerRect.left < edgeThreshold
        const isNearRightEdge = containerRect.right - pointerX < edgeThreshold

        if (isNearLeftEdge || isNearRightEdge) {
          setScrollLocked(true)
        } else {
          setScrollLocked(false)
        }
      }
    }

    // Limpar o estado se não estiver sobre nada
    if (!over) {
      setColumnOver(null)
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    // Encontrar o contato ativo
    const activeContact = contacts.find((c) => c.id === activeId)
    if (!activeContact) return

    // Verificar se está sobre uma coluna
    if (["Novo", "Conversando", "Interessado", "Fechado", "Perdido"].includes(overId)) {
      const newStatus = overId as ContactStatus
      setColumnOver(newStatus)

      // Se mudou de coluna, atualizar imediatamente
      if (activeContact.status !== newStatus) {
        setContacts((prevContacts) =>
          prevContacts.map((contact) => (contact.id === activeId ? { ...contact, status: newStatus } : contact)),
        )
      }
      return
    }

    // Se estiver sobre outro contato
    const overContact = contacts.find((c) => c.id === overId)
    if (overContact) {
      setColumnOver(overContact.status)

      // Reordenar contatos
      setContacts((prevContacts) => {
        const activeIndex = prevContacts.findIndex((c) => c.id === activeId)
        const overIndex = prevContacts.findIndex((c) => c.id === overId)

        if (activeIndex === -1 || overIndex === -1) return prevContacts

        // Se estão na mesma coluna, apenas reordenar
        if (activeContact.status === overContact.status) {
          return arrayMove(prevContacts, activeIndex, overIndex)
        }

        // Se estão em colunas diferentes, mover para a nova coluna
        const updatedContacts = [...prevContacts]
        updatedContacts[activeIndex] = { ...activeContact, status: overContact.status }

        // Reordenar na nova posição
        return arrayMove(updatedContacts, activeIndex, overIndex)
      })
    } else {
      setColumnOver(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // Limpar estados de arrastar
    setActiveId(null)
    setActiveContact(null)
    setColumnOver(null)
    setScrollLocked(false)

    // Se não houver destino, reverter para o estado original
    if (!over) {
      setContacts(originalContacts)
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    // Encontrar o contato que está sendo arrastado no estado original
    const originalContact = originalContacts.find((c) => c.id === activeId)
    const currentContact = contacts.find((c) => c.id === activeId)

    if (!originalContact || !currentContact) {
      setContacts(originalContacts)
      return
    }

    let targetStatus: ContactStatus = currentContact.status
    let statusChanged = false

    // Verificar se o destino é uma coluna (status)
    if (["Novo", "Conversando", "Interessado", "Fechado", "Perdido"].includes(overId)) {
      targetStatus = overId as ContactStatus
      statusChanged = originalContact.status !== targetStatus
    } else {
      // Se soltar em outro card
      const overContact = contacts.find((c) => c.id === overId)
      if (overContact) {
        targetStatus = overContact.status
        statusChanged = originalContact.status !== targetStatus
      }
    }

    // Se o status mudou, atualizar no servidor
    if (statusChanged) {
      console.log(`Status changed from ${originalContact.status} to ${targetStatus}`)
      await updateContactStatus(activeId, targetStatus)
    } else {
      // Se não mudou o status, mas pode ter mudado a posição, ainda assim confirmar no servidor
      // Para simplificar, vamos apenas manter a mudança local se não houve mudança de status
      console.log("No status change detected, keeping local changes")
    }
  }

  const updateContactStatus = async (contactId: string, newStatus: ContactStatus) => {
    // Marcar o contato como sendo atualizado
    setUpdatingContactId(contactId)

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

      // Atualizar o estado local com a resposta do servidor
      setContacts((prevContacts) =>
        prevContacts.map((contact) => (contact.id === contactId ? { ...contact, status: newStatus } : contact)),
      )

      // Atualizar também o estado original para futuras comparações
      setOriginalContacts((prevContacts) =>
        prevContacts.map((contact) => (contact.id === contactId ? { ...contact, status: newStatus } : contact)),
      )
    } catch (error) {
      console.error("Erro ao atualizar status do contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do contato. Tente novamente.",
        variant: "destructive",
      })

      // Reverter para o estado original em caso de erro
      setContacts(originalContacts)
    } finally {
      setUpdatingContactId(null)
    }
  }

  const handleCardClick = (contact: Contact) => {
    // Prevent opening dialog during drag operations
    if (activeId) return

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
        <h1 className="text-2xl font-bold"></h1>
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
          autoScroll={
            scrollLocked
              ? false
              : {
                  enabled: true,
                  threshold: {
                    x: 0.15,
                    y: 0.15,
                  },
                  acceleration: 0.3,
                  interval: 8,
                }
          }
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
                          width: container.rect.width + 60,
                          height: container.rect.height + 60,
                          left: container.rect.left - 30,
                          top: container.rect.top - 30,
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
          <div
            data-kanban-container
            className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory touch-pan-x overscroll-x-contain"
            style={{
              scrollBehavior: scrollLocked ? "auto" : "smooth",
            }}
          >
            {Object.entries(contactsByStatus).map(([status, statusContacts]) => (
              <KanbanColumn
                key={status}
                status={status as ContactStatus}
                contacts={statusContacts}
                onCardClick={handleCardClick}
                onAddContact={handleAddContact}
                isOver={columnOver === status}
                updatingContactId={updatingContactId}
                activeId={activeId ? String(activeId) : null}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId && activeContact ? (
              <div className="transform-gpu scale-105 opacity-90 shadow-lg rotate-1 w-[280px]">
                <ContactCard className="touch-none" contact={activeContact} onClick={() => {}} isDragging={true} />
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
