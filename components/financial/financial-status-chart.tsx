"use client"

import { useState } from "react"
import { ChartDetailModal } from "@/components/dashboard/chart-detail-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface FinancialStatusChartProps {
  data: Record<string, number>
}

export function FinancialStatusChart({ data }: FinancialStatusChartProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handlePieClick = (data: any) => {
    setSelectedStatus(data.name)
    setIsModalOpen(true)
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
                  onClick={handlePieClick}
                  style={{ cursor: "pointer" }}
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
      <ChartDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Detalhes - ${selectedStatus || "Status"}`}
        description={`Informações detalhadas sobre ${selectedStatus || "este status"}`}
      >
        {selectedStatus && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div
                className="w-6 h-6 rounded-full shadow-lg"
                style={{
                  backgroundColor: COLORS[selectedStatus as keyof typeof COLORS] || "#888888",
                  boxShadow: `0 2px 8px ${COLORS[selectedStatus as keyof typeof COLORS] || "#888888"}33`,
                }}
              />
              <div>
                <h3 className="font-semibold text-lg">{selectedStatus}</h3>
                <p className="text-sm text-muted-foreground">Status do contato</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Valor Total</h4>
                <p
                  className="text-2xl font-bold"
                  style={{ color: COLORS[selectedStatus as keyof typeof COLORS] || "#888888" }}
                >
                  {formatCurrency(data[selectedStatus] || 0)}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Percentual do Total</h4>
                <p className="text-2xl font-bold">
                  {(((data[selectedStatus] || 0) / Object.values(data).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição</h4>
              <p className="text-sm">
                {selectedStatus === "Novo" && "Contatos recém-adicionados que ainda não foram contatados."}
                {selectedStatus === "Conversando" && "Contatos em processo de negociação ativa."}
                {selectedStatus === "Interessado" && "Contatos que demonstraram interesse no produto/serviço."}
                {selectedStatus === "Fechado" && "Contatos que se tornaram clientes efetivos."}
                {selectedStatus === "Perdido" && "Contatos que não progrediram para venda."}
              </p>
            </div>
          </div>
        )}
      </ChartDetailModal>
    </Card>
  )
}
