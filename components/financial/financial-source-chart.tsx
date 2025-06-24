"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface FinancialSourceChartProps {
  data: Record<string, number>
}

// Cores consistentes com o gráfico do dashboard
const sourceColors: Record<string, { primary: string; gradient: string; light: string; shadow: string }> = {
  WhatsApp: {
    primary: "#25D366",
    gradient: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    light: "#dcfce7",
    shadow: "rgba(37, 211, 102, 0.3)",
  },
  Instagram: {
    primary: "#E1306C",
    gradient: "linear-gradient(135deg, #E1306C 0%, #C13584 100%)",
    light: "#fce7f3",
    shadow: "rgba(225, 48, 108, 0.3)",
  },
  Outro: {
    primary: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    light: "#e0e7ff",
    shadow: "rgba(99, 102, 241, 0.3)",
  },
}

export function FinancialSourceChart({ data }: FinancialSourceChartProps) {
  // Transformar os dados para o formato esperado pelo Recharts
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }))

  // Filtrar para mostrar apenas valores maiores que zero
  const filteredData = chartData.filter((item) => item.value > 0)

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Componente personalizado para o tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sourceInfo = sourceColors[label] || sourceColors["Outro"]
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full shadow-lg"
              style={{
                background: sourceInfo.gradient,
                boxShadow: `0 2px 8px ${sourceInfo.shadow}`,
              }}
            />
            <p className="font-semibold text-sm">{label}</p>
          </div>
          <p className="text-lg font-bold" style={{ color: sourceInfo.primary }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valor por Origem</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                  {filteredData.map((entry, index) => {
                    const sourceInfo = sourceColors[entry.name] || sourceColors["Outro"]
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={sourceInfo.primary}
                        style={{
                          filter: `drop-shadow(0 2px 4px ${sourceInfo.shadow})`,
                        }}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
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
