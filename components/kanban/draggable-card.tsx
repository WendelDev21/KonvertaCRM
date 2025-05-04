"use client"

import { useDraggable } from "@dnd-kit/core"
import { ContactCard } from "./contact-card"

// Tipos
interface Contact {
  id: string
  name: string
  contact: string
  source: string
  status: string
  createdAt: string | Date
  notes?: string
}

interface DraggableCardProps {
  contact: Contact
}

export function DraggableCard({ contact }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 999 : "auto",
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-manipulation transition-all duration-200"
    >
      <ContactCard
        contact={contact}
        className={`${isDragging ? "shadow-lg" : "hover:shadow-md hover:-translate-y-0.5"} transition-all duration-200`}
      />
    </div>
  )
}
