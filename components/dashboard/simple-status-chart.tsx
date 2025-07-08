"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ChartDetailModal } from "@/components/dashboard/chart-detail-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, BarChart3, TrendingDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SimpleStatusChartProps {
  data: Record<string, number>
}

export function SimpleStatusChart({ data }: SimpleStatusChartProps) {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedData, setSelectedData] = useState<{ name: string; value: number } | null>(null)
  const [viewType, setViewType] = useState<"bar" | "funnel">("bar")

  // Formatar dados para o gráfico
  const chartData = Object.entries(data || {}).map(([status, count]) => ({
    name: status,
    value: count,
  }))

  // Calcular o total para porcentagens
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  // Cores melhoradas com gradientes para cada status
  const statusColors: Record<string, { primary: string; gradient: string; light: string }> = {
    Novo: {
      primary: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      light: "#dbeafe",
    },
    Conversando: {
      primary: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      light: "#fef3c7",
    },
    Interessado: {
      primary: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      light: "#ede9fe",
    },
    Fechado: {
      primary: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      light: "#d1fae5",
    },
    Perdido: {
      primary: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      light: "#fee2e2",
    },
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl min-w-[6rem] max-w-[90vw]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors[data.name]?.primary || "#8884d8" }}
            />
            <p className="font-semibold text-sm">{data.name}</p>
          </div>
          <p className="text-lg font-bold" style={{ color: statusColors[data.name]?.primary }}>
            {data.value} contatos
          </p>
          <p className="text-xs text-muted-foreground">{percentage}% do total</p>
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">💡 Clique para ver detalhes</p>
          </div>
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
  const tickCount = Math.min(maxValue + 1, 10)

  if (chartData.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-muted/10 px-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold">Distribuição por Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[400px] flex items-center justify-center px-3 sm:px-6">
          <div className="text-center space-y-3">
            <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">Nenhum dado disponível</div>
            <p className="text-sm text-muted-foreground/70">Os dados aparecerão aqui quando disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-muted/10 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
            <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold">Distribuição por Status</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total de {total} contatos distribuídos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end ml-0 sm:ml-3">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm flex-shrink-0"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {chartData.length} status
              </Badge>
              <Tabs defaultValue="bar" value={viewType} onValueChange={(v) => setViewType(v as any)}>
                <TabsList className="h-8 sm:h-9 bg-muted/50">
                  <TabsTrigger value="bar" className="h-6 sm:h-7 w-7 sm:w-8 p-0">
                    <BarChart3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="funnel" className="h-6 sm:h-7 w-7 sm:w-8 p-0">
                    <TrendingDown className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[400px] pt-4 px-2 sm:px-6">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 5, left: 0, bottom: 10 }}
                onClick={(data) => data && handleBarClick(data.activePayload?.[0]?.payload)}
              >
                <defs>
                  {Object.entries(statusColors).map(([status, colors]) => (
                    <linearGradient key={status} id={`gradient-${status}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  horizontal={true}
                  opacity={0.1}
                  stroke="#94a3b8"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  dy={5}
                />
                <YAxis
                  tickCount={tickCount}
                  domain={[0, maxValue]}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  dx={-5}
                  width={25}
                />
                <Tooltip content={customTooltip} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  className="transition-all duration-200 hover:opacity-80"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradient-${entry.name})`}
                      stroke={entry.name === selectedStatus ? statusColors[entry.name]?.primary : "transparent"}
                      strokeWidth={entry.name === selectedStatus ? 3 : 0}
                      className="transition-all duration-200 hover:brightness-110"
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center p-2 sm:p-4">
                {/* Funil customizado */}
                <div className="w-full max-w-md space-y-2">
                  {/* Ordenar dados para o funil: Novo -> Conversando -> Interessado -> Fechado -> Perdido */}
                  {["Novo", "Conversando", "Interessado", "Fechado", "Perdido"]
                    .map((status) => chartData.find((item) => item.name === status))
                    .filter(Boolean)
                    .map((item, index, array) => {
                      const maxWidth = Math.max(...array.map((i) => i!.value))
                      const widthPercentage = (item!.value / maxWidth) * 100
                      const percentage = ((item!.value / total) * 100).toFixed(1)

                      return (
                        <div
                          key={item!.name}
                          className="flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-105"
                          onClick={() => handleBarClick(item)}
                        >
                          <div className="w-full flex justify-center mb-1">
                            <div
                              className="h-12 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-sm transition-all duration-300 hover:brightness-110"
                              style={{
                                width: `${Math.max(widthPercentage, 20)}%`,
                                background: statusColors[item!.name]?.gradient || "#8884d8",
                                minWidth: "120px",
                              }}
                            >
                              <span className="text-center px-2">
                                {item!.name}: {item!.value}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{percentage}% do total</div>
                        </div>
                      )
                    })}
                </div>

                {/* Setas conectoras */}
                <style jsx>{`
                  .funnel-item:not(:last-child)::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 8px solid #94a3b8;
                    opacity: 0.5;
                  }
                `}</style>
              </div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Modal melhorado para detalhes do item clicado */}
      <ChartDetailModal
        isOpen={isDataModalOpen}
        onClose={closeDataModal}
        title="Detalhes do Status"
        description={selectedStatus ? `Informações detalhadas sobre contatos com status ${selectedStatus}` : ""}
      >
        {selectedData && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-background border">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-xl shadow-lg"
                  style={{
                    background: statusColors[selectedData.name]?.gradient || "#8884d8",
                  }}
                />
                <div className="absolute inset-0 rounded-xl bg-white/20" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedData.name}</h3>
                <p className="text-muted-foreground">Status selecionado</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="font-medium">Total de contatos</span>
                      <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                        {selectedData.value}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="font-medium">Porcentagem</span>
                      <Badge
                        variant="secondary"
                        className="text-lg font-bold px-3 py-1"
                        style={{
                          backgroundColor: statusColors[selectedData.name]?.light,
                          color: statusColors[selectedData.name]?.primary,
                        }}
                      >
                        {((selectedData.value / total) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Comparativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{selectedData.name}</span>
                        <span className="font-bold">{selectedData.value}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${(selectedData.value / total) * 100}%`,
                            background: statusColors[selectedData.name]?.gradient,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Outros status</span>
                        <span className="font-bold">{total - selectedData.value}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-500 ease-out"
                          style={{ width: `${((total - selectedData.value) / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Todos os Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Contatos</TableHead>
                      <TableHead className="font-semibold">Porcentagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((item) => (
                      <TableRow
                        key={item.name}
                        className={`border-muted/30 transition-colors ${
                          item.name === selectedData.name
                            ? "bg-gradient-to-r from-muted/50 to-transparent border-l-4"
                            : "hover:bg-muted/20"
                        }`}
                        style={{
                          borderLeftColor:
                            item.name === selectedData.name ? statusColors[item.name]?.primary : "transparent",
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: statusColors[item.name]?.primary || "#8884d8" }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {item.value}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: statusColors[item.name]?.light,
                              color: statusColors[item.name]?.primary,
                            }}
                          >
                            {((item.value / total) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
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
