import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react"

interface FinancialSummaryCardsProps {
  summary: {
    total: number
    fechado: number
    emNegociacao: number
    perdido: number
  }
}

export function FinancialSummaryCards({ summary }: FinancialSummaryCardsProps) {
  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
          <p className="text-xs text-muted-foreground">Valor total de todos os contatos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fechado</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.fechado)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.total > 0 ? `${((summary.fechado / summary.total) * 100).toFixed(1)}% do total` : "0% do total"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(summary.emNegociacao)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.total > 0
              ? `${((summary.emNegociacao / summary.total) * 100).toFixed(1)}% do total`
              : "0% do total"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Perdido</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.perdido)}</div>
          <p className="text-xs text-muted-foreground">
            {summary.total > 0 ? `${((summary.perdido / summary.total) * 100).toFixed(1)}% do total` : "0% do total"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
