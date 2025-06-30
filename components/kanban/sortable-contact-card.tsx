"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContactCard } from "./contact-card"
import type { Contact } from "./kanban-board"

interface SortableContactCardProps {
  contact: Contact
  onClick: () => void
  isUpdating?: boolean
  isDragging?: boolean
}

export function SortableContactCard({
  contact,
  onClick,
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
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
    scale: isDragging || isSortableDragging ? 1.05 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none ${isUpdating ? "animate-pulse" : ""}`}
    >
      <ContactCard
        contact={contact}
        onClick={onClick}
        isDragging={isDragging || isSortableDragging}
        className={`cursor-grab active:cursor-grabbing ${
          isDragging || isSortableDragging ? "shadow-lg ring-2 ring-primary/50" : ""
        }`}
      />
    </div>
  )
}
