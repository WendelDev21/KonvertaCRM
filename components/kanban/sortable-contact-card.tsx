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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: contact.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContactCard 
        contact={contact} 
        onClick={() => onCardClick(contact)}
        isUpdating={isUpdating}
        isDragging={isDragging}
      />
    </div>
  )
}