"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DollarSign, Phone } from "lucide-react"
import type { Contact } from "./kanban-board"

interface ContactCardProps {
  contact: Contact
  onClick?: () => void
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const formattedDate = formatDistanceToNow(new Date(contact.createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  // Formatar valor em reais
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === 0) return ""
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  // Determinar a cor do badge com base na origem
  const getBadgeVariant = (source: string) => {
    switch (source) {
      case "WhatsApp":
        return "green"
      case "Instagram":
        return "purple"
      default:
        return "secondary"
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm truncate flex-1">{contact.name}</h3>
          <Badge variant={getBadgeVariant(contact.source) as any} className="ml-2 text-xs">
            {contact.source}
          </Badge>
        </div>

        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Phone className="h-3 w-3 mr-1" />
          <span className="truncate">{contact.contact}</span>
        </div>

        {contact.value && contact.value > 0 && (
          <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>{formatCurrency(contact.value)}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2">{formattedDate}</div>
      </CardContent>
    </Card>
  )
}
