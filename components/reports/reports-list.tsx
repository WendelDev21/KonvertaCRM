"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Download, Loader2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Report } from "@/lib/types/report"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface ReportsListProps {
  reports: Report[]
  isLoading: boolean
  onDeleteReport: (id: string) => Promise<void>
  onDeleteAllReports: () => Promise<void>
}

export function ReportsList({ reports, isLoading, onDeleteReport, onDeleteAllReports }: ReportsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)

  // Baixar um relatório
  const handleDownloadReport = async (report: Report) => {
    try {
      setIsDownloading(report.id)

      const response = await fetch(`/api/reports/${report.id}/download`)

      if (!response.ok) {
        throw new Error("Falha ao baixar relatório")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = report.fileName || `relatorio_${report.id}.${report.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao baixar relatório:", error)
    } finally {
      setIsDownloading(null)
    }
  }

  // Excluir um relatório
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDeleteReport(id)
    setDeletingId(null)
  }

  // Renderizar o tipo de relatório
  const renderReportType = (report: Report) => {
    if (report.includeContacts && report.includeFinancial) {
      return "Contatos e Financeiro"
    } else if (report.includeContacts) {
      return "Contatos"
    } else if (report.includeFinancial) {
      return "Financeiro"
    }
    return "Desconhecido"
  }

  // Renderizar o período do relatório
  const renderPeriod = (report: Report) => {
    switch (report.period) {
      case "7d":
        return "Últimos 7 dias"
      case "30d":
        return "Últimos 30 dias"
      case "90d":
        return "Últimos 90 dias"
      case "1y":
        return "Último ano"
      case "custom":
        if (report.startDate && report.endDate) {
          const start = format(new Date(report.startDate), "dd/MM/yyyy")
          const end = format(new Date(report.endDate), "dd/MM/yyyy")
          return `${start} até ${end}`
        }
        return "Personalizado"
      default:
        return "Desconhecido"
    }
  }

  // Renderizar o formato do relatório
  const renderFormat = (format: string) => {
    return (
      <Badge variant="outline" className="uppercase">
        {format}
      </Badge>
    )
  }

  // Renderizar o conteúdo da tabela
  const renderTableContent = () => {
    if (isLoading) {
      return Array(3)
        .fill(0)
        .map((_, index) => (
          <TableRow key={`skeleton-${index}`}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-20" />
            </TableCell>
          </TableRow>
        ))
    }

    if (reports.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
            Nenhum relatório gerado ainda
          </TableCell>
        </TableRow>
      )
    }

    return reports.map((report) => (
      <TableRow key={report.id}>
        <TableCell>{format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
        <TableCell>{renderReportType(report)}</TableCell>
        <TableCell>{renderPeriod(report)}</TableCell>
        <TableCell>{renderFormat(report.format)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadReport(report)}
              disabled={isDownloading === report.id}
            >
              {isDownloading === report.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(report.id)}
              disabled={deletingId === report.id}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              {deletingId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Relatórios Gerados</h3>

        {reports.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Todos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir todos os relatórios?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os relatórios serão permanentemente excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAllReports}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir Todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableContent()}</TableBody>
        </Table>
      </div>
    </div>
  )
}
