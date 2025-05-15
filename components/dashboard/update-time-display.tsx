"use client"

import { useState, useEffect } from "react"

interface UpdateTimeDisplayProps {
  lastUpdated: Date
}

export function UpdateTimeDisplay({ lastUpdated }: UpdateTimeDisplayProps) {
  const [formattedTime, setFormattedTime] = useState<string>("")

  // Formatar a hora apenas no cliente para evitar problemas de hidratação
  useEffect(() => {
    setFormattedTime(
      lastUpdated.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    )
  }, [lastUpdated])

  // Usar um placeholder até que o componente seja montado no cliente
  if (!formattedTime) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>
  }

  return <div className="text-sm text-muted-foreground">Atualizado às {formattedTime}</div>
}
