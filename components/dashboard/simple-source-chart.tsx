"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts"
import { ChartDetailModal } from "@/components/dashboard/chart-detail-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SimpleSourceChartProps {
  data: Record<string, number>
}

export function SimpleSourceChart({ data }: SimpleSourceChartProps) {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedData, setSelectedData] = useState<{ name: string; value: number } | null>(null)

  // Formatar dados para o gráfico
  const chartData = Object.entries(data || {}).map(([source, count]) => ({
    name: source,
    value: count,
  }))

  // Calcular o total para porcentagens
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  // Cores para cada origem
  const sourceColors: Record<string, string> = {
    WhatsApp: "#25D366", // Verde WhatsApp
    Instagram: "#E1306C", // Rosa Instagram
    Outro: "#6B7280", // Cinza para outros
  }

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p style={{ color: payload[0].fill }}>{payload[0].value} contatos</p>
          <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
        </div>
      )
    }
    return null
  }

  const handlePieClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedSource(data.name)
      setSelectedData(data)
      setIsDataModalOpen(true)
    }
  }, [])

  const closeDataModal = useCallback(() => {
    setIsDataModalOpen(false)
    setSelectedSource(null)
    setSelectedData(null)
  }, [])

  // Renderiza o setor ativo (quando o usuário passa o mouse)
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.8}
        />
      </g>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="border shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Distribuição por Origem</CardTitle>
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
          <CardTitle className="text-base font-medium">Distribuição por Origem</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                activeIndex={chartData.findIndex((item) => item.name === selectedSource)}
                activeShape={renderActiveShape}
                onClick={handlePieClick}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={sourceColors[entry.name] || "#8884d8"}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend
                onClick={(data) => handlePieClick(data)}
                formatter={(value) => <span style={{ cursor: "pointer" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Modal para detalhes do item clicado */}
      <ChartDetailModal
        isOpen={isDataModalOpen}
        onClose={closeDataModal}
        title="Detalhes da Origem"
        description={selectedSource ? `Informações detalhadas sobre contatos de ${selectedSource}` : ""}
      >
        {selectedData && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: sourceColors[selectedData.name] || "#8884d8" }}
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
                          backgroundColor: sourceColors[selectedData.name] || "#8884d8",
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Outras origens</span>
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
                <CardTitle className="text-base">Todas as Origens</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origem</TableHead>
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
                              style={{ backgroundColor: sourceColors[item.name] || "#8884d8" }}
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
