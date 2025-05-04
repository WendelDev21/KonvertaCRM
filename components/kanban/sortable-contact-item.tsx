"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContactCard } from "./contact-card"
import type { Contact } from "./kanban-board"
import { Loader2 } from "lucide-react"

interface SortableContactItemProps {
  contact: Contact
  isUpdating?: boolean
  onClick?: () => void
}

export function SortableContactItem({ contact, isUpdating = false, onClick }: SortableContactItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: contact.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-manipulation ${isDragging ? "z-10" : ""} relative hover:z-10`}
      onClick={(e) => {
        // Evitar que o clique no card inicie um drag
        if (onClick && !isDragging) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <ContactCard
        contact={contact}
        className={`${
          isDragging ? "shadow-lg" : "shadow-sm hover:shadow-md"
        } transition-all duration-200 transform ${isDragging ? "" : "hover:-translate-y-0.5"}`}
      />
      {isUpdating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
