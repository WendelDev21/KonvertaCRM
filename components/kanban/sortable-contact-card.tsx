"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContactCard } from "./contact-card"
import type { Contact } from "./kanban-board"

interface SortableContactCardProps {
  contact: Contact
  onCardClick: (contact: Contact) => void
  isUpdating?: boolean
  isDragging?: boolean
}

export function SortableContactCard({ contact, onCardClick, isUpdating, isDragging }: SortableContactCardProps) {
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
    touchAction: "none",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-manipulation select-none ${isSortableDragging ? "z-50 opacity-75 scale-105" : ""} transition-all duration-200`}
    >
      <ContactCard
        contact={contact}
        onClick={() => !isSortableDragging && onCardClick(contact)}
        isUpdating={isUpdating}
        isDragging={isDragging || isSortableDragging}
      />
    </div>
  )
}
