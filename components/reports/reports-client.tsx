"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportGenerator } from "./report-generator"
import { ReportsList } from "./reports-list"
import { useToast } from "@/components/ui/use-toast"
import type { Report } from "@/lib/types/report"

export function ReportsClient() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Carregar relatórios ao montar o componente
  useEffect(() => {
    fetchReports()
  }, [])

  // Buscar relatórios do usuário
  const fetchReports = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/reports")
      if (!response.ok) throw new Error("Falha ao carregar relatórios")

      const data = await response.json()
      setReports(data)
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus relatórios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Excluir um relatório
  const handleDeleteReport = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Falha ao excluir relatório")

      // Atualizar a lista de relatórios
      setReports(reports.filter((report) => report.id !== id))

      toast({
        title: "Relatório excluído",
        description: "O relatório foi excluído com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir relatório:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o relatório",
        variant: "destructive",
      })
    }
  }

  // Excluir todos os relatórios
  const handleDeleteAllReports = async () => {
    try {
      const response = await fetch("/api/reports", {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Falha ao excluir relatórios")

      // Limpar a lista de relatórios
      setReports([])

      toast({
        title: "Relatórios excluídos",
        description: "Todos os relatórios foram excluídos com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir relatórios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir os relatórios",
        variant: "destructive",
      })
    }
  }

  // Adicionar um novo relatório à lista após geração
  const handleReportGenerated = (report: Report) => {
    setReports([report, ...reports])
    toast({
      title: "Relatório gerado",
      description: "Seu relatório foi gerado com sucesso",
    })
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Novo Relatório</CardTitle>
              <CardDescription>Configure as opções do relatório e clique em gerar para baixar</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportGenerator onReportGenerated={handleReportGenerated} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios</CardTitle>
              <CardDescription>Visualize e gerencie seus relatórios gerados anteriormente</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportsList
                reports={reports}
                isLoading={isLoading}
                onDeleteReport={handleDeleteReport}
                onDeleteAllReports={handleDeleteAllReports}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
