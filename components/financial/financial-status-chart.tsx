"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface FinancialStatusChartProps {
  data: Record<string, number>
}

export function FinancialStatusChart({ data }: FinancialStatusChartProps) {
  // Transformar os dados para o formato esperado pelo Recharts
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }))

  // Filtrar para mostrar apenas valores maiores que zero
  const filteredData = chartData.filter((item) => item.value > 0)

  // Cores para cada status
  const COLORS = {
    Novo: "#3b82f6", // blue-500
    Conversando: "#8b5cf6", // violet-500
    Interessado: "#f59e0b", // amber-500
    Fechado: "#10b981", // emerald-500
    Perdido: "#ef4444", // red-500
  }

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Componente personalizado para o tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-md shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valor por Status</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#888888"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado financial disponível
          </div>
        )}
      </CardContent>
    </Card>
  )
}
