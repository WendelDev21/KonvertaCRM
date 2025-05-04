"use client"

import { useState, useCallback, useEffect } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from "recharts"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, LineChartIcon, AreaChartIcon, HelpCircle, RefreshCw } from "lucide-react"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

interface TimelineData {
  date: string
  novos: number
  conversando: number
  interessado: number
  fechados: number
  perdidos: number
  [key: string]: string | number
}

interface SimpleTimelineChartProps {
  data: TimelineData[]
}

const statusColors = {
  novos: "#3b82f6", // Azul
  conversando: "#8b5cf6", // Roxo
  interessado: "#f59e0b", // Âmbar/Laranja
  fechados: "#22c55e", // Verde
  perdidos: "#ef4444", // Vermelho
}

const statusNames = {
  novos: "Novos",
  conversando: "Conversando",
  interessado: "Interessado",
  fechados: "Fechados",
  perdidos: "Perdidos",
}

// Lista de todos os status disponíveis
const allStatuses = ["novos", "conversando", "interessado", "fechados", "perdidos"]

export function SimpleTimelineChart({ data }: SimpleTimelineChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area")
  const [chartData, setChartData] = useState<TimelineData[]>([])

  // Estado para controlar quais status estão visíveis
  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>({
    novos: true,
    conversando: true,
    interessado: true,
    fechados: true,
    perdidos: true,
  })

  // Atualizar os dados do gráfico sempre que os dados de entrada mudarem
  useEffect(() => {
    setChartData([...data])
  }, [data])

  const formatXAxis = useCallback((tickItem: string) => {
    try {
      // Usar parse em vez de parseISO para evitar problemas de fuso horário
      const date = parse(tickItem, "yyyy-MM-dd", new Date())
      return format(date, "dd/MM", { locale: ptBR })
    } catch (e) {
      return tickItem
    }
  }, [])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      try {
        // Usar parse em vez de parseISO para evitar problemas de fuso horário
        const date = parse(label, "yyyy-MM-dd", new Date())
        const formattedDate = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })

        // Calcular o total apenas dos status visíveis
        const total = payload.reduce((sum, entry) => {
          const dataKey = entry.dataKey as string
          if (visibleStatuses[dataKey]) {
            return sum + ((entry.value as number) || 0)
          }
          return sum
        }, 0)

        return (
          <div className="bg-background border rounded-md p-3 shadow-md">
            <p className="font-medium text-sm mb-2 border-b pb-1">{formattedDate}</p>

            {payload.map((entry, index) => {
              if (!entry.value) return null

              const dataKey = entry.dataKey as string
              // Mostrar apenas os status visíveis no tooltip
              if (!visibleStatuses[dataKey]) return null

              const percentage = total > 0 ? Math.round(((entry.value as number) / total) * 100) : 0
              const name = statusNames[dataKey as keyof typeof statusNames] || entry.name

              return (
                <div key={`item-${index}`} className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">{name}:</span>
                  </div>
                  <span className="text-sm font-medium">
                    {entry.value} ({percentage}%)
                  </span>
                </div>
              )
            })}

            {total > 0 && (
              <div className="mt-2 pt-1 border-t text-sm font-medium flex justify-between">
                <span>Total:</span>
                <span>{total} contatos</span>
              </div>
            )}
          </div>
        )
      } catch (e) {
        return null
      }
    }
    return null
  }

  // Manipulador de clique na legenda
  const handleLegendClick = useCallback(
    (dataKey: string) => {
      // Se todos os status estão invisíveis exceto o clicado, restaurar todos
      const currentlyVisible = Object.values(visibleStatuses).filter(Boolean).length

      if (currentlyVisible === 1 && visibleStatuses[dataKey]) {
        // Se o único visível for clicado, mostrar todos
        setVisibleStatuses({
          novos: true,
          conversando: true,
          interessado: true,
          fechados: true,
          perdidos: true,
        })
      } else {
        // Caso contrário, mostrar apenas o clicado
        const newVisibleStatuses = {
          novos: false,
          conversando: false,
          interessado: false,
          fechados: false,
          perdidos: false,
        }
        newVisibleStatuses[dataKey] = true
        setVisibleStatuses(newVisibleStatuses)
      }
    },
    [visibleStatuses],
  )

  // Função para restaurar todos os status
  const resetVisibleStatuses = useCallback(() => {
    setVisibleStatuses({
      novos: true,
      conversando: true,
      interessado: true,
      fechados: true,
      perdidos: true,
    })
  }, [])

  // Renderizador personalizado para a legenda
  const renderCustomizedLegend = useCallback(
    (props: any) => {
      const { payload } = props

      return (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          {payload.map((entry: any, index: number) => {
            const isActive = visibleStatuses[entry.dataKey]
            const statusName = statusNames[entry.dataKey as keyof typeof statusNames] || entry.value

            return (
              <div
                key={`item-${index}`}
                className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition-colors ${
                  isActive ? "opacity-100" : "opacity-40"
                }`}
                onClick={() => handleLegendClick(entry.dataKey)}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium">{statusName}</span>
              </div>
            )
          })}

          {Object.values(visibleStatuses).some((v) => !v) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetVisibleStatuses}
              className="h-6 text-xs flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Mostrar todos
            </Button>
          )}
        </div>
      )
    },
    [visibleStatuses, handleLegendClick, resetVisibleStatuses],
  )

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Atividade ao Longo do Tempo</h3>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Este gráfico mostra a evolução dos contatos ao longo do tempo, agrupados por status.</p>
                <p className="mt-1 text-xs text-muted-foreground">Clique em um status na legenda para filtrar.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <Tabs defaultValue="area" value={chartType} onValueChange={(v) => setChartType(v as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="area" className="h-7 w-7 p-0">
              <AreaChartIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="line" className="h-7 w-7 p-0">
              <LineChartIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="bar" className="h-7 w-7 p-0">
              <BarChart3 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        {chartType === "area" ? (
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} tickMargin={8} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomizedLegend} />
            {visibleStatuses.novos && (
              <Area
                type="monotone"
                dataKey="novos"
                name="Novos"
                stroke={statusColors.novos}
                fill={statusColors.novos}
                fillOpacity={0.6}
                stackId="1"
              />
            )}
            {visibleStatuses.conversando && (
              <Area
                type="monotone"
                dataKey="conversando"
                name="Conversando"
                stroke={statusColors.conversando}
                fill={statusColors.conversando}
                fillOpacity={0.6}
                stackId="1"
              />
            )}
            {visibleStatuses.interessado && (
              <Area
                type="monotone"
                dataKey="interessado"
                name="Interessado"
                stroke={statusColors.interessado}
                fill={statusColors.interessado}
                fillOpacity={0.6}
                stackId="1"
              />
            )}
            {visibleStatuses.fechados && (
              <Area
                type="monotone"
                dataKey="fechados"
                name="Fechados"
                stroke={statusColors.fechados}
                fill={statusColors.fechados}
                fillOpacity={0.6}
                stackId="1"
              />
            )}
            {visibleStatuses.perdidos && (
              <Area
                type="monotone"
                dataKey="perdidos"
                name="Perdidos"
                stroke={statusColors.perdidos}
                fill={statusColors.perdidos}
                fillOpacity={0.6}
                stackId="1"
              />
            )}
          </AreaChart>
        ) : chartType === "bar" ? (
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} tickMargin={8} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomizedLegend} />
            {visibleStatuses.novos && <Bar dataKey="novos" name="Novos" fill={statusColors.novos} stackId="a" />}
            {visibleStatuses.conversando && (
              <Bar dataKey="conversando" name="Conversando" fill={statusColors.conversando} stackId="a" />
            )}
            {visibleStatuses.interessado && (
              <Bar dataKey="interessado" name="Interessado" fill={statusColors.interessado} stackId="a" />
            )}
            {visibleStatuses.fechados && (
              <Bar dataKey="fechados" name="Fechados" fill={statusColors.fechados} stackId="a" />
            )}
            {visibleStatuses.perdidos && (
              <Bar dataKey="perdidos" name="Perdidos" fill={statusColors.perdidos} stackId="a" />
            )}
          </BarChart>
        ) : (
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} tickMargin={8} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomizedLegend} />
            {visibleStatuses.novos && (
              <Line
                type="monotone"
                dataKey="novos"
                name="Novos"
                stroke={statusColors.novos}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
            {visibleStatuses.conversando && (
              <Line
                type="monotone"
                dataKey="conversando"
                name="Conversando"
                stroke={statusColors.conversando}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
            {visibleStatuses.interessado && (
              <Line
                type="monotone"
                dataKey="interessado"
                name="Interessado"
                stroke={statusColors.interessado}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
            {visibleStatuses.fechados && (
              <Line
                type="monotone"
                dataKey="fechados"
                name="Fechados"
                stroke={statusColors.fechados}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
            {visibleStatuses.perdidos && (
              <Line
                type="monotone"
                dataKey="perdidos"
                name="Perdidos"
                stroke={statusColors.perdidos}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
