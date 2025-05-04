"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContactCard } from "./contact-card"
import type { Contact } from "./kanban-board"
import { Loader2 } from "lucide-react"

interface SortableContactCardProps {
  contact: Contact
  onCardClick: (contact: Contact) => void
  isUpdating?: boolean
  isDragging?: boolean // Nova prop
}

export function SortableContactCard({
  contact,
  onCardClick,
  isUpdating = false,
  isDragging = false,
}: SortableContactCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: contact.id,
    data: {
      type: "contact",
      contact,
    },
  })

  // Usar isDragging da prop ou do useSortable
  const isBeingDragged = isDragging || isSortableDragging

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isBeingDragged ? 0.4 : 1,
    cursor: isBeingDragged ? "grabbing" : "grab",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-manipulation ${isBeingDragged ? "z-10" : ""} relative hover:z-10 mb-2`}
      onClick={(e) => {
        // Evitar que o clique no card inicie um drag
        if (onCardClick && !isBeingDragged) {
          e.preventDefault()
          onCardClick(contact)
        }
      }}
    >
      <ContactCard
        contact={contact}
        className={`${
          isBeingDragged ? "shadow-lg" : "shadow-sm hover:shadow-md"
        } transition-all duration-200 transform ${isBeingDragged ? "" : "hover:-translate-y-0.5"}`}
      />
      {isUpdating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
