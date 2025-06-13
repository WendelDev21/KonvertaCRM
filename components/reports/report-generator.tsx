"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "./date-picker"
import { FileDown, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Report } from "@/lib/types/report"

interface ReportGeneratorProps {
  onReportGenerated: (report: Report) => void
}

export function ReportGenerator({ onReportGenerated }: ReportGeneratorProps) {
  const [format, setFormat] = useState<"pdf" | "csv">("pdf")
  const [period, setPeriod] = useState<string>("7d")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [includeContacts, setIncludeContacts] = useState<boolean>(true)
  const [includeFinancial, setIncludeFinancial] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const { toast } = useToast()

  // Verificar se o formulário é válido
  const isFormValid = () => {
    if (period === "custom" && (!startDate || !endDate)) {
      return false
    }
    if (!includeContacts && !includeFinancial) {
      return false
    }
    return true
  }

  // Gerar o relatório
  const handleGenerateReport = async () => {
    if (!isFormValid()) {
      toast({
        title: "Formulário inválido",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)

      // Preparar os dados para a requisição
      const reportData = {
        format,
        period,
        startDate: period === "custom" ? startDate?.toISOString() : undefined,
        endDate: period === "custom" ? endDate?.toISOString() : undefined,
        includeContacts,
        includeFinancial,
      }

      // Enviar requisição para gerar o relatório
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })

      if (!response.ok) {
        throw new Error("Falha ao gerar relatório")
      }

      // Obter o blob do relatório
      const blob = await response.blob()

      // Criar URL para download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")

      // Definir nome do arquivo baseado no período e formato
      const dateStr = new Date().toISOString().split("T")[0]
      const periodLabel = getPeriodLabel(period)
      const fileName = `relatorio_${periodLabel}_${dateStr}.${format}`

      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      // Limpar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Obter metadados do relatório
      const reportMetadata = await fetch("/api/reports/last").then((res) => res.json())

      // Notificar o componente pai
      if (reportMetadata) {
        onReportGenerated(reportMetadata)
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Obter label para o período selecionado
  const getPeriodLabel = (periodValue: string): string => {
    switch (periodValue) {
      case "7d":
        return "7_dias"
      case "30d":
        return "30_dias"
      case "90d":
        return "90_dias"
      case "1y":
        return "1_ano"
      case "custom":
        return "personalizado"
      default:
        return "periodo"
    }
  }

  // Renderizar campos de data personalizada
  const renderCustomDateFields = () => {
    if (period !== "custom") return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data inicial</Label>
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Selecione a data inicial" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Data final</Label>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="Selecione a data final" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Formato do Relatório</h3>
          <p className="text-sm text-muted-foreground">Escolha o formato em que deseja receber o relatório</p>
        </div>

        <RadioGroup
          value={format}
          onValueChange={(value) => setFormat(value as "pdf" | "csv")}
          className="flex flex-row space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf">PDF</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="csv" id="csv" />
            <Label htmlFor="csv">CSV</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Período</h3>
          <p className="text-sm text-muted-foreground">Selecione o período de tempo para o relatório</p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {renderCustomDateFields()}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Tipo de Dados</h3>
          <p className="text-sm text-muted-foreground">Selecione quais dados deseja incluir no relatório</p>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="contacts"
              checked={includeContacts}
              onCheckedChange={(checked) => setIncludeContacts(checked === true)}
            />
            <Label htmlFor="contacts">Dados de Contatos</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="financial"
              checked={includeFinancial}
              onCheckedChange={(checked) => setIncludeFinancial(checked === true)}
            />
            <Label htmlFor="financial">Dados Financeiros</Label>
          </div>
        </div>
      </div>

      <Button onClick={handleGenerateReport} disabled={isGenerating || !isFormValid()} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando relatório...
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-4 w-4" />
            Gerar e Baixar Relatório
          </>
        )}
      </Button>
    </div>
  )
}
