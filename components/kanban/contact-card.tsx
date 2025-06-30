"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MessageCircle, Instagram, Globe, Loader2, Eye } from "lucide-react"
import type { Contact } from "./kanban-board"

interface ContactCardProps {
  contact: Contact
  onClick?: () => void
  className?: string
  isDragging?: boolean
  isUpdating?: boolean
}

export function ContactCard({
  contact,
  onClick,
  className = "",
  isDragging = false,
  isUpdating = false,
}: ContactCardProps) {
  const formattedDate = formatDistanceToNow(new Date(contact.createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  // Formatar data para exibir apenas dia/mês
  const formatShortDate = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  // Formatar valor em reais
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === 0) return ""
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  // Determinar o ícone e cor do badge com base na origem
  const getSourceConfig = (source: string) => {
    switch (source) {
      case "WhatsApp":
        return {
          icon: MessageCircle,
          bgColor: "bg-green-500/10 dark:bg-green-500/20",
          textColor: "text-green-700 dark:text-green-400",
          borderColor: "border-green-500/20 dark:border-green-500/30",
        }
      case "Instagram":
        return {
          icon: Instagram,
          bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
          textColor: "text-pink-700 dark:text-pink-400",
          borderColor: "border-pink-500/20 dark:border-pink-500/30",
        }
      default:
        return {
          icon: Globe,
          bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
          textColor: "text-slate-700 dark:text-slate-400",
          borderColor: "border-slate-500/20 dark:border-slate-500/30",
        }
    }
  }

  // Determinar a cor da barra vertical com base no status
  const getStatusBarColor = (status: string) => {
    switch (status) {
      case "Novo":
        return "bg-sky-500"
      case "Conversando":
        return "bg-amber-500"
      case "Interessado":
        return "bg-violet-500"
      case "Fechado":
        return "bg-emerald-500"
      case "Perdido":
        return "bg-rose-500"
      default:
        return "bg-slate-500"
    }
  }

  const sourceConfig = getSourceConfig(contact.source)
  const SourceIcon = sourceConfig.icon

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClick && !isDragging) {
      onClick()
    }
  }

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    // Previne qualquer comportamento de drag
    if (e.currentTarget) {
      e.currentTarget.setAttribute("draggable", "false")
    }

    if (onClick && !isDragging) {
      onClick()
    }
  }

  return (
    <Card
      className={`
        group cursor-pointer transition-all duration-200 
        border border-border/50 bg-card backdrop-blur-sm rounded-xl
        hover:bg-card/90 hover:scale-[1.02] hover:border-border
        hover:shadow-md
        active:scale-95
        ${isDragging ? "shadow-2xl scale-105 rotate-1 border-border" : ""}
        ${isUpdating ? "opacity-50" : ""}
        ${className}
      `}
      onClick={handleCardClick}
      style={{
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <CardContent className="p-0 relative overflow-hidden rounded-xl">
        {/* Barra vertical colorida */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusBarColor(contact.status)} rounded-l-xl`} />

        {/* Ícone de visualização - posicionado no topo direito */}
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={handleViewClick}
            onMouseDown={handleViewClick}
            onTouchStart={handleViewClick}
            className={`
              p-2 rounded-full transition-all duration-200
              bg-background/80 backdrop-blur-sm border border-border/50
              hover:bg-background hover:border-border hover:scale-110
              active:scale-95 shadow-sm hover:shadow-md
              opacity-0 group-hover:opacity-100
              ${isUpdating ? "opacity-0 pointer-events-none" : ""}
            `}
            title="Ver detalhes do contato"
            draggable={false}
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              pointerEvents: isUpdating ? "none" : "auto",
            }}
          >
            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* Indicador de carregamento */}
        {isUpdating && (
          <div className="absolute top-2 right-2 z-30">
            <div className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div className="p-3 pl-4 pr-12">
          {/* Header com nome e badge */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground">{contact.name}</h3>
            </div>

            {/* Badge da fonte */}
            <Badge
              variant="outline"
              className={`
                ml-2 flex items-center gap-1 px-2 py-0.5
                ${sourceConfig.bgColor} ${sourceConfig.textColor} ${sourceConfig.borderColor}
                font-medium text-xs rounded-md
              `}
            >
              <SourceIcon className="h-2.5 w-2.5" />
              {contact.source}
            </Badge>
          </div>

          {/* Contato */}
          <div className="mb-2">
            <p className="text-xs text-muted-foreground font-mono">{contact.contact}</p>
          </div>

          {/* Valor */}
          {contact.value && contact.value > 0 && (
            <div className="mb-2">
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(contact.value)}
              </p>
            </div>
          )}

          {/* Footer com data e notas */}
          <div className="flex justify-between items-end">
            <div className="text-xs text-muted-foreground">{formatShortDate(contact.createdAt)}</div>

            {contact.notes && (
              <div className="text-xs text-muted-foreground max-w-[100px] truncate">{contact.notes}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
