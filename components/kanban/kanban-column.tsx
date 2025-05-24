"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableContactCard } from "./sortable-contact-card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Contact, ContactStatus } from "./kanban-board"

interface KanbanColumnProps {
  status: ContactStatus
  contacts: Contact[]
  onCardClick: (contact: Contact) => void
  onAddContact: (status: ContactStatus) => void
  isOver?: boolean
  updatingContactId?: string | null
  activeId?: string | null // Novo: ID do contato sendo arrastado
}

export function KanbanColumn({
  status,
  contacts,
  onCardClick,
  onAddContact,
  isOver,
  updatingContactId,
  activeId, // Novo: receber o activeId
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: status,
  })

  // Determinar a cor do cabeçalho com base no status
  const getHeaderClass = (status: ContactStatus) => {
    switch (status) {
      case "Novo":
        return "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/50"
      case "Conversando":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50"
      case "Interessado":
        return "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/50"
      case "Fechado":
        return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50"
      case "Perdido":
        return "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50"
      default:
        return "bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/50"
    }
  }

  // Determinar a cor do badge com base no status
  const getBadgeClass = (status: ContactStatus) => {
    switch (status) {
      case "Novo":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400"
      case "Conversando":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
      case "Interessado":
        return "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400"
      case "Fechado":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
      case "Perdido":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  // Determinar a cor da borda quando estiver arrastando
  const getColumnClass = (status: ContactStatus, isOver: boolean) => {
    if (!isOver) return ""

    switch (status) {
      case "Novo":
        return "ring-4 ring-sky-300/50 dark:ring-sky-700/50"
      case "Conversando":
        return "ring-4 ring-amber-300/50 dark:ring-amber-700/50"
      case "Interessado":
        return "ring-4 ring-violet-300/50 dark:ring-violet-700/50"
      case "Fechado":
        return "ring-4 ring-emerald-300/50 dark:ring-emerald-700/50"
      case "Perdido":
        return "ring-4 ring-rose-300/50 dark:ring-rose-700/50"
      default:
        return "ring-4 ring-slate-300/50 dark:ring-slate-700/50"
    }
  }

  // Verificar se a coluna está sendo alvo de um arrasto
  const isColumnOver = isOver || isOverDroppable

  return (
    <div
      ref={setNodeRef}
      className={`
        touch-none
        flex flex-col h-[calc(100vh-12rem)] min-h-[500px] rounded-lg border bg-card 
        transition-all duration-200 ${isColumnOver ? `${getColumnClass(status, true)} scale-[1.02]` : ""}
        snap-center
      `}
      style={{
        padding: isColumnOver ? "4px" : "0px",
        minWidth: "280px",
        width: "min(100vw - 2rem, 350px)",
        flexShrink: 0,
      }}
    >

      <div className={`p-3 border-b rounded-t-lg ${getHeaderClass(status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{status}</h3>
            <Badge className={getBadgeClass(status)}>{contacts.length}</Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onAddContact(status)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`flex-1 p-2 overflow-y-auto ${isColumnOver ? "bg-muted/30" : ""}`}>
        <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {contacts.map((contact) => (
            <SortableContactCard
              key={contact.id}
              contact={contact}
              onCardClick={onCardClick}
              isUpdating={updatingContactId === contact.id}
              isDragging={activeId === contact.id} // Passar se este card está sendo arrastado
            />
          ))}
        </SortableContext>

        {contacts.length === 0 && (
          <div
            className={`
    flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground
    ${isColumnOver ? "border-2 border-dashed border-primary/40 rounded-md bg-primary/5" : "border border-dashed border-muted-foreground/20 rounded-md"}
  `}
          >
            {isColumnOver ? (
              <div className="p-8 w-full h-full flex items-center justify-center">
                <span className="font-medium">Solte aqui</span>
              </div>
            ) : (
              "Nenhum contato"
            )}
          </div>
        )}
      </div>
    </div>
  )
}
