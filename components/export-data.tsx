"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Tipos
type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"
type ContactSource = "WhatsApp" | "Instagram" | "Outro"

interface Contact {
  id: string
  name: string
  contact: string
  source: ContactSource
  status: ContactStatus
  createdAt: Date
  notes?: string
}

interface ExportDataProps {
  contacts?: Contact[]
}

export function ExportData({ contacts }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Usar os contatos fornecidos ou um array vazio
  const dataToExport = contacts || []

  const exportToCSV = () => {
    setIsExporting(true)

    try {
      // Cabeçalhos do CSV
      const headers = ["Nome", "Contato", "Origem", "Status", "Data de Criação", "Observações"]

      // Converter dados para linhas CSV
      const rows = dataToExport.map((contact) => [
        contact.name,
        contact.contact,
        contact.source,
        contact.status,
        new Date(contact.createdAt).toLocaleDateString("pt-BR"),
        contact.notes || "",
      ])

      // Combinar cabeçalhos e linhas
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map(
              (cell) =>
                // Escapar aspas e adicionar aspas ao redor de cada célula
                `"${String(cell).replace(/"/g, '""')}"`,
            )
            .join(","),
        ),
      ].join("\n")

      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      // Configurar e simular clique no link
      link.setAttribute("href", url)
      link.setAttribute("download", `contatos_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      alert("Ocorreu um erro ao exportar os dados. Por favor, tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = () => {
    setIsExporting(true)

    try {
      // Criar blob e link para download
      const jsonContent = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      // Configurar e simular clique no link
      link.setAttribute("href", url)
      link.setAttribute("download", `contatos_${new Date().toISOString().split("T")[0]}.json`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      alert("Ocorreu um erro ao exportar os dados. Por favor, tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {isExporting ? "Exportando..." : "Exportar Contatos"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>Exportar como CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>Exportar como JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
