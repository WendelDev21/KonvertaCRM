"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { User, Calendar, ArrowRight } from "lucide-react"
import type { Contact } from "./kanban-board"

interface ContactCardProps {
  contact: Contact
  onClick: () => void
  isDragging?: boolean
  isUpdating?: boolean
}

export function ContactCard({ contact, onClick, isDragging, isUpdating }: ContactCardProps) {
  // Determinar a cor do card com base no status
  const getCardClass = (status: string) => {
    switch (status) {
      case "Novo":
        return "border-l-4 border-l-sky-500 dark:border-l-sky-400"
      case "Conversando":
        return "border-l-4 border-l-amber-500 dark:border-l-amber-400"
      case "Interessado":
        return "border-l-4 border-l-violet-500 dark:border-l-violet-400"
      case "Fechado":
        return "border-l-4 border-l-emerald-500 dark:border-l-emerald-400"
      case "Perdido":
        return "border-l-4 border-l-rose-500 dark:border-l-rose-400"
      default:
        return "border-l-4 border-l-slate-500 dark:border-l-slate-400"
    }
  }

  // Formatar a data de criação
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR })
    } catch (error) {
      return "Data desconhecida"
    }
  }

  return (
    <div className="w-full p-2 mb-2 bg-background rounded-md border shadow-sm hover:shadow transition-all duration-200 touch-none">
      <Card
        className={`
        ${getCardClass(contact.status)}
        ${isDragging ? "opacity-50" : ""}
        ${isUpdating ? "animate-pulse" : ""}
        hover:shadow-md transition-all duration-200 group
      `}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium truncate">{contact.name}</h3>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-3 w-3 mr-1" />
              <span className="truncate">{contact.contact}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDate(contact.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
