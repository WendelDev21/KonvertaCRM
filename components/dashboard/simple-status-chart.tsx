"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ChartDetailModal } from "@/components/dashboard/chart-detail-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SimpleStatusChartProps {
  data: Record<string, number>
}

export function SimpleStatusChart({ data }: SimpleStatusChartProps) {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedData, setSelectedData] = useState<{ name: string; value: number } | null>(null)

  // Formatar dados para o gráfico
  const chartData = Object.entries(data || {}).map(([status, count]) => ({
    name: status,
    value: count,
  }))

  // Calcular o total para porcentagens
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  // Cores para cada status
  const statusColors: Record<string, string> = {
    Novo: "#3b82f6", // Azul
    Conversando: "#eab308", // Amarelo
    Interessado: "#a855f7", // Roxo
    Fechado: "#22c55e", // Verde
    Perdido: "#ef4444", // Vermelho
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-lg">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p style={{ color: payload[0].fill }}>{payload[0].value} contatos</p>
          <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
        </div>
      )
    }
    return null
  }

  const handleBarClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedStatus(data.name)
      setSelectedData(data)
      setIsDataModalOpen(true)
    }
  }, [])

  const closeDataModal = useCallback(() => {
    setIsDataModalOpen(false)
    setSelectedStatus(null)
    setSelectedData(null)
  }, [])

  // Encontrar o valor máximo para definir o domínio do eixo Y
  const maxValue = Math.max(...chartData.map((item) => item.value), 0)
  // Calcular o número de ticks baseado no valor máximo (para garantir apenas inteiros)
  const tickCount = Math.min(maxValue + 1, 10) // Limitar a no máximo 10 ticks

  if (chartData.length === 0) {
    return (
      <Card className="border shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Nenhum dado disponível</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              onClick={(data) => data && handleBarClick(data.activePayload?.[0]?.payload)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis tickCount={tickCount} domain={[0, maxValue]} allowDecimals={false} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={statusColors[entry.name] || "#8884d8"}
                    stroke={entry.name === selectedStatus ? "#000" : "transparent"}
                    strokeWidth={entry.name === selectedStatus ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Modal para detalhes do item clicado */}
      <ChartDetailModal
        isOpen={isDataModalOpen}
        onClose={closeDataModal}
        title="Detalhes do Status"
        description={selectedStatus ? `Informações detalhadas sobre contatos com status ${selectedStatus}` : ""}
      >
        {selectedData && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: statusColors[selectedData.name] || "#8884d8" }}
              />
              <h3 className="text-xl font-semibold">{selectedData.name}</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Total de contatos</TableCell>
                        <TableCell>{selectedData.value}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Porcentagem</TableCell>
                        <TableCell>{((selectedData.value / total) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Comparativo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{selectedData.name}</span>
                      <span className="font-medium">{selectedData.value}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full"
                        style={{
                          width: `${(selectedData.value / total) * 100}%`,
                          backgroundColor: statusColors[selectedData.name] || "#8884d8",
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Outros status</span>
                      <span className="font-medium">{total - selectedData.value}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-gray-400"
                        style={{ width: `${((total - selectedData.value) / total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Todos os Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Contatos</TableHead>
                      <TableHead>Porcentagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((item) => (
                      <TableRow key={item.name} className={item.name === selectedData.name ? "bg-muted/50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: statusColors[item.name] || "#8884d8" }}
                            />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell>{item.value}</TableCell>
                        <TableCell>{((item.value / total) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </ChartDetailModal>
    </>
  )
}
