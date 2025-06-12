"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts"
import { ChartDetailModal } from "@/components/dashboard/chart-detail-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, PieChartIcon, Share2 } from "lucide-react"

interface SimpleSourceChartProps {
  data: Record<string, number>
}

export function SimpleSourceChart({ data }: SimpleSourceChartProps) {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedData, setSelectedData] = useState<{ name: string; value: number } | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Formatar dados para o gráfico
  const chartData = Object.entries(data || {}).map(([source, count]) => ({
    name: source,
    value: count,
  }))

  // Calcular o total para porcentagens
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  // Cores melhoradas com gradientes para cada origem
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

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.08) return null // Don't show label for small slices on mobile

    if (percent < 0.05) return null // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-bold text-xs sm:text-sm drop-shadow-lg"
        style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.8))" }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / total) * 100).toFixed(1)
      const sourceInfo = sourceColors[data.name]

      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl min-w-[6rem] max-w-[90vw]">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-4 h-4 rounded-full shadow-lg"
              style={{
                background: sourceInfo?.gradient || data.fill,
                boxShadow: `0 2px 8px ${sourceInfo?.shadow || "rgba(0,0,0,0.2)"}`,
              }}
            />
            <p className="font-semibold text-sm">{data.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold" style={{ color: sourceInfo?.primary || data.fill }}>
              {data.value} contatos
            </p>
            <p className="text-sm text-muted-foreground">{percentage}% do total</p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">💡 Clique para ver detalhes</p>
          </div>
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
    setActiveIndex(null)
  }, [])

  // Renderiza o setor ativo (quando o usuário passa o mouse)
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props
    const sourceInfo = sourceColors[payload.name]

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={sourceInfo?.primary || fill}
          opacity={0.9}
          style={{
            filter: `drop-shadow(0 4px 12px ${sourceInfo?.shadow || "rgba(0,0,0,0.3)"})`,
          }}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="url(#activeGradient)"
          opacity={0.3}
        />
      </g>
    )
  }

  const customLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-6 px-2 pb-2">
        {payload.map((entry: any, index: number) => {
          const sourceInfo = sourceColors[entry.value]
          const isSelected = selectedSource === entry.value
          return (
            <div
              key={`legend-${index}`}
              className={`flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                isSelected ? "bg-muted/50 shadow-md" : "hover:bg-muted/30"
              }`}
              onClick={() => handlePieClick({ name: entry.value })}
              style={{
                boxShadow: isSelected ? `0 2px 8px ${sourceInfo?.shadow}` : "none",
              }}
            >
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{
                  background: sourceInfo?.gradient || entry.color,
                }}
              />
              <span className="text-xs sm:text-sm font-medium">{entry.value}</span>
              <Badge variant="secondary" className="text-xs">
                {chartData.find((item) => item.name === entry.value)?.value || 0}
              </Badge>
            </div>
          )
        })}
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold">Distribuição por Origem</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
              <Share2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-muted-foreground font-medium">Nenhum dado disponível</div>
            <p className="text-sm text-muted-foreground/70">Os dados aparecerão aqui quando disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-muted/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <PieChartIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold">Distribuição por Origem</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total de {total} contatos por canal</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              {chartData.length} origens
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="h-[350px] sm:h-[400px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart cy="40%">
              <defs>
                <linearGradient id="activeGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
                </linearGradient>
                {Object.entries(sourceColors).map(([source, colors]) => (
                  <linearGradient key={source} id={`gradient-${source}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={isMobile ? 60 : 90}
                innerRadius={isMobile ? 20 : 30}
                fill="#8884d8"
                dataKey="value"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onClick={handlePieClick}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className="transition-all duration-300"
              >
                {chartData.map((entry, index) => {
                  const sourceInfo = sourceColors[entry.name]
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradient-${entry.name})`}
                      style={{
                        cursor: "pointer",
                        filter: `drop-shadow(0 2px 4px ${sourceInfo?.shadow || "rgba(0,0,0,0.2)"})`,
                      }}
                      className="transition-all duration-200 hover:brightness-110"
                    />
                  )
                })}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend content={customLegend} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Modal melhorado para detalhes do item clicado */}
      <ChartDetailModal
        isOpen={isDataModalOpen}
        onClose={closeDataModal}
        title="Detalhes da Origem"
        description={selectedSource ? `Informações detalhadas sobre contatos de ${selectedSource}` : ""}
      >
        {selectedData && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-background border">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-xl shadow-lg"
                  style={{
                    background: sourceColors[selectedData.name]?.gradient || "#8884d8",
                  }}
                />
                <div className="absolute inset-0 rounded-xl bg-white/20" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedData.name}</h3>
                <p className="text-muted-foreground">Origem selecionada</p>
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
                          backgroundColor: sourceColors[selectedData.name]?.light,
                          color: sourceColors[selectedData.name]?.primary,
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
                            background: sourceColors[selectedData.name]?.gradient,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Outras origens</span>
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
                  <Share2 className="h-4 w-4" />
                  Todas as Origens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="font-semibold">Origem</TableHead>
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
                            item.name === selectedData.name ? sourceColors[item.name]?.primary : "transparent",
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{
                                background: sourceColors[item.name]?.gradient || "#8884d8",
                              }}
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
                              backgroundColor: sourceColors[item.name]?.light,
                              color: sourceColors[item.name]?.primary,
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
