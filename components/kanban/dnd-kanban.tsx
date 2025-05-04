"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { AddContactDialog } from "./add-contact-dialog"
import { ContactCard } from "./contact-card"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"

// Tipos
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
  position?: number
}

const statusLabels: Record<ContactStatus, string> = {
  Novo: "Novos",
  Conversando: "Em Contato",
  Interessado: "Interessados",
  Fechado: "Fechados",
  Perdido: "Perdidos",
}

// Cores para as colunas
const columnColors: Record<ContactStatus, { bg: string; border: string; hoverBg: string }> = {
  Novo: {
    bg: "bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    hoverBg: "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40",
  },
  Conversando: {
    bg: "bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/30",
    border: "border-purple-200 dark:border-purple-800",
    hoverBg: "group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40",
  },
  Interessado: {
    bg: "bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    hoverBg: "group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40",
  },
  Fechado: {
    bg: "bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30",
    border: "border-green-200 dark:border-green-800",
    hoverBg: "group-hover:bg-green-100 dark:group-hover:bg-green-900/40",
  },
  Perdido: {
    bg: "bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30",
    border: "border-red-200 dark:border-red-800",
    hoverBg: "group-hover:bg-red-100 dark:group-hover:bg-red-900/40",
  },
}

export function DndKanban() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [recentlyMoved, setRecentlyMoved] = useState<string | null>(null)

  // Configurar sensores para o DndContext
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distância mínima para iniciar o arrasto
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Função para buscar contatos da API
  const fetchContacts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await fetch("/api/contacts")
      if (!response.ok) {
        throw new Error("Erro ao buscar contatos")
      }
      const data = await response.json()
      setContacts(data)
    } catch (error) {
      console.error("Erro ao buscar contatos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Carregar contatos ao montar o componente
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Função para adicionar um novo contato
  const handleAddContact = async (contactData: Omit<Contact, "id" | "createdAt">) => {
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar contato")
      }

      const newContact = await response.json()
      setContacts((prevContacts) => [...prevContacts, newContact])

      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao adicionar contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o contato.",
        variant: "destructive",
      })
    }
  }

  // Função para atualizar o status de um contato
  const handleUpdateContactStatus = async (contactId: string, newStatus: ContactStatus) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar status do contato")
      }
    } catch (error) {
      console.error("Erro ao atualizar status do contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do contato.",
        variant: "destructive",
      })

      // Reverter a mudança no estado local em caso de erro
      fetchContacts()
    }
  }

  // Filtrar contatos por status
  const getContactsByStatus = (status: ContactStatus) => {
    return contacts.filter((contact) => contact.status === status)
  }

  // Handlers para o DndContext
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeContactId = active.id as string
    const activeContact = contacts.find((contact) => contact.id === activeContactId)

    if (activeContact) {
      setActiveContact(activeContact)
      document.body.classList.add("dragging")
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    const activeContactId = active.id as string
    const overContactId = over.id as string

    // Ignorar se estamos sobre o mesmo contato
    if (activeContactId === overContactId) return

    const activeContact = contacts.find((contact) => contact.id === activeContactId)

    // Se não encontrarmos o contato ativo, retornar
    if (!activeContact) return

    // Se o over.id for um ID de coluna (começa com "column-")
    if (overContactId.startsWith("column-")) {
      const newStatus = overContactId.replace("column-", "") as ContactStatus

      // Se o status já for o mesmo, não fazer nada
      if (activeContact.status === newStatus) return

      // Atualizar o status do contato
      setContacts((prevContacts) =>
        prevContacts.map((contact) => (contact.id === activeContactId ? { ...contact, status: newStatus } : contact)),
      )

      return
    }

    const overContact = contacts.find((contact) => contact.id === overContactId)

    // Se não encontrarmos o contato sobre o qual estamos, retornar
    if (!overContact) return

    // Se estamos arrastando entre contatos da mesma coluna
    if (activeContact.status === overContact.status) {
      setContacts((prevContacts) => {
        const activeIndex = prevContacts.findIndex((c) => c.id === activeContactId)
        const overIndex = prevContacts.findIndex((c) => c.id === overContactId)

        return arrayMove(prevContacts, activeIndex, overIndex)
      })
    } else {
      // Se estamos arrastando para outra coluna
      setContacts((prevContacts) => {
        // Remover o contato ativo da lista
        const filteredContacts = prevContacts.filter((c) => c.id !== activeContactId)

        // Encontrar o índice do contato sobre o qual estamos
        const overIndex = filteredContacts.findIndex((c) => c.id === overContactId)

        // Criar uma cópia do contato ativo com o novo status
        const updatedActiveContact = { ...activeContact, status: overContact.status }

        // Inserir o contato ativo na nova posição
        filteredContacts.splice(overIndex, 0, updatedActiveContact)

        return filteredContacts
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveContact(null)
      document.body.classList.remove("dragging")
      return
    }

    const activeContactId = active.id as string
    const overContactId = over.id as string

    // Se o over.id for um ID de coluna (começa com "column-")
    if (overContactId.startsWith("column-")) {
      const newStatus = overContactId.replace("column-", "") as ContactStatus
      const activeContact = contacts.find((contact) => contact.id === activeContactId)

      if (activeContact && activeContact.status !== newStatus) {
        // Atualizar o status no servidor
        handleUpdateContactStatus(activeContactId, newStatus)

        // Marcar como recentemente movido para animação
        setRecentlyMoved(activeContactId)
        setTimeout(() => setRecentlyMoved(null), 1000)
      }
    } else {
      const activeContact = contacts.find((contact) => contact.id === activeContactId)
      const overContact = contacts.find((contact) => contact.id === overContactId)

      if (activeContact && overContact && activeContact.status !== overContact.status) {
        // Atualizar o status no servidor
        handleUpdateContactStatus(activeContactId, overContact.status)

        // Marcar como recentemente movido para animação
        setRecentlyMoved(activeContactId)
        setTimeout(() => setRecentlyMoved(null), 1000)
      }
    }

    setActiveContact(null)
    document.body.classList.remove("dragging")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando kanban...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Kanban de Contatos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchContacts(true)} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x kanban-container">
          {(Object.keys(statusLabels) as ContactStatus[]).map((status) => {
            const columnContacts = getContactsByStatus(status)

            return (
              <KanbanColumn
                key={status}
                id={`column-${status}`}
                status={status}
                contacts={columnContacts}
                columnColors={columnColors[status]}
                statusLabel={statusLabels[status]}
                onAddContact={() => setIsAddDialogOpen(true)}
                recentlyMoved={recentlyMoved}
              />
            )
          })}
        </div>

        {/* Overlay que mostra o card sendo arrastado */}
        <DragOverlay>
          {activeContact ? (
            <div className="w-[300px] opacity-90 rotate-1 shadow-xl">
              <ContactCard contact={activeContact} className="ring-2 ring-primary/50" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddContactDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddContact={handleAddContact} />
    </div>
  )
}
