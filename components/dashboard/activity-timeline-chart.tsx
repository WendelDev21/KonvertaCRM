"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
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
  LineChart,
  Line,
  type TooltipProps,
} from "recharts"
import { format, isValid, subDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { RefreshCw, BarChart3, LineChartIcon, HelpCircle, AreaChartIcon, Calendar, Info } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ContactSource } from "./dashboard-filters"
import { ChartDetailModal } from "./chart-detail-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Modificar a interface para incluir a opção de receber dados diretamente
interface ActivityTimelineChartProps {
  startDate?: Date | null
  endDate?: Date | null
  source?: ContactSource
  data?: TimelineData[] // Opcional, para permitir passar dados diretamente
  refreshKey?: number // Adicionado para forçar atualização
}

interface TimelineData {
  date: string
  Novo: number
  Conversando: number
  Interessado: number
  Fechado: number
  Perdido: number
  [key: string]: string | number
}

const statusColors = {
  Novo: "#3b82f6", // Azul
  Conversando: "#eab308", // Amarelo
  Interessado: "#a855f7", // Roxo
  Fechado: "#22c55e", // Verde
  Perdido: "#ef4444", // Vermelho
}

// Dados de exemplo para quando não há dados reais
const generateSampleData = () => {
  const sampleData = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStr = date.toISOString().split("T")[0]
    sampleData.push({
      date: dateStr,
      Novo: Math.floor(Math.random() * 5),
      Conversando: Math.floor(Math.random() * 5),
      Interessado: Math.floor(Math.random() * 5),
      Fechado: Math.floor(Math.random() * 3),
      Perdido: Math.floor(Math.random() * 2),
    })
  }
  return sampleData
}

export function ActivityTimelineChart({
  startDate,
  endDate,
  source,
  data: initialData,
  refreshKey = 0, // Valor padrão para evitar undefined
}: ActivityTimelineChartProps) {
  console.log("[ActivityTimelineChart] Rendering with props:", {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    source,
    initialDataLength: initialData?.length,
    refreshKey,
  })

  // Usar dados de exemplo se não houver dados iniciais
  const [data, setData] = useState<TimelineData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastQueryParamsRef = useRef<string>("")
  const [internalRefreshKey, setInternalRefreshKey] = useState<number>(0)
  const [viewType, setViewType] = useState<"area" | "bar" | "line">("area")
  const lastFetchTime = useRef<number>(0)
  const componentMountedRef = useRef<boolean>(false)
  const initialRenderRef = useRef<boolean>(true)

  // Estado para controlar quais status estão visíveis
  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>({
    Novo: true,
    Conversando: true,
    Interessado: true,
    Fechado: true,
    Perdido: true,
  })

  // Estados para o modal de detalhes
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedData, setSelectedData] = useState<TimelineData | null>(null)

  // Efeito para inicializar os dados
  useEffect(() => {
    // Inicializar com dados de exemplo para evitar gráfico vazio
    setData(generateSampleData())
  }, [])

  // Efeito para atualizar os dados quando initialData muda
  useEffect(() => {
    console.log("[ActivityTimelineChart] initialData changed:", initialData?.length)
    if (initialData && initialData.length > 0) {
      console.log("[ActivityTimelineChart] Setting data from initialData:", initialData)

      // Verificar se os dados têm o formato correto
      const validData = initialData.map((item) => ({
        date: item.date || "",
        Novo: Number(item.Novo || item.novos || 0),
        Conversando: Number(item.Conversando || item.conversando || 0),
        Interessado: Number(item.Interessado || item.interessado || 0),
        Fechado: Number(item.Fechado || item.fechados || 0),
        Perdido: Number(item.Perdido || item.perdidos || 0),
      }))

      console.log("[ActivityTimelineChart] Processed data:", validData)
      setData(validData)
      setIsLoading(false)
    } else if (!initialData && initialRenderRef.current) {
      // Se não há dados iniciais na primeira renderização, buscar dados
      console.log("[ActivityTimelineChart] No initial data, will fetch from API")
      initialRenderRef.current = false
    }
  }, [initialData])

  // Função para forçar atualização
  const refreshData = useCallback(() => {
    console.log("[ActivityTimelineChart] Manual refresh triggered")
    setInternalRefreshKey((prev) => prev + 1)
    setIsLoading(true)
  }, [])

  // Efeito para atualizar quando refreshKey externo muda
  useEffect(() => {
    if (componentMountedRef.current && refreshKey > 0) {
      console.log("[ActivityTimelineChart] External refresh triggered", refreshKey)
      refreshData()
    }
  }, [refreshKey, refreshData])

  // Marcar o componente como montado após a primeira renderização
  useEffect(() => {
    componentMountedRef.current = true
    return () => {
      componentMountedRef.current = false
    }
  }, [])

  // Memoize the query params to prevent unnecessary re-renders
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams()

    if (startDate) {
      params.append("startDate", startDate.toISOString())
    }

    if (endDate) {
      params.append("endDate", endDate.toISOString())
    }

    if (source && source !== "Todos") {
      params.append("source", source)
    }

    // Adicionar um parâmetro de cache-busting para evitar cache do navegador
    params.append("_t", Date.now().toString())

    return params.toString()
  }, [startDate, endDate, source])

  // Função para normalizar os parâmetros de consulta (remover o timestamp)
  const normalizeQueryParams = useCallback((queryParams: string) => {
    const params = new URLSearchParams(queryParams)
    params.delete("_t") // Remover o timestamp
    return params.toString()
  }, [])

  // Fetch data when query params change or refreshKey changes
  useEffect(() => {
    // Se dados iniciais foram fornecidos e não houve atualização forçada, não buscar da API
    if (initialData && initialData.length > 0 && internalRefreshKey === 0 && initialRenderRef.current) {
      console.log("[ActivityTimelineChart] Using initial data", initialData.length)

      // Verificar se os dados têm o formato correto
      const validData = initialData.map((item) => ({
        date: item.date || "",
        Novo: Number(item.Novo || item.novos || 0),
        Conversando: Number(item.Conversando || item.conversando || 0),
        Interessado: Number(item.Interessado || item.interessado || 0),
        Fechado: Number(item.Fechado || item.fechados || 0),
        Perdido: Number(item.Perdido || item.perdidos || 0),
      }))

      setData(validData)
      setIsLoading(false)
      return
    }

    const queryParams = getQueryParams()
    const normalizedQueryParams = normalizeQueryParams(queryParams)
    const normalizedLastParams = normalizeQueryParams(lastQueryParamsRef.current)
    const currentTime = Date.now()
    const timeSinceLastFetch = currentTime - lastFetchTime.current

    console.log("[ActivityTimelineChart] Checking if fetch is needed:", {
      paramsChanged: normalizedQueryParams !== normalizedLastParams,
      timeSinceLastFetch,
      internalRefreshKey,
      initialDataProvided: !!initialData,
    })

    // Verificar se já se passaram pelo menos 2 segundos desde a última atualização
    // ou se os parâmetros de consulta mudaram ou se houve uma atualização forçada
    if (normalizedQueryParams !== normalizedLastParams || timeSinceLastFetch > 2000 || internalRefreshKey > 0) {
      console.log("[ActivityTimelineChart] Fetching new data")
      lastFetchTime.current = currentTime
      lastQueryParamsRef.current = queryParams

      const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
          console.log("[Chart] Fetching timeline data with params:", queryParams)

          const response = await fetch(`/api/dashboard/timeline?${queryParams}`, {
            // Adicionar cabeçalhos para evitar cache
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const responseData = await response.json()
          console.log("[Chart] Received response:", responseData)

          // Verificar se a resposta tem o formato esperado
          if (!responseData.timeline || !Array.isArray(responseData.timeline)) {
            console.error("[Chart] Invalid response format:", responseData)
            throw new Error("Invalid data format: timeline property is missing or not an array")
          }

          // Transformar os dados para o formato esperado pelo gráfico
          const formattedData = responseData.timeline.map((item: any) => ({
            date: item.date || "",
            Novo: Number(item.novos || 0),
            Conversando: Number(item.conversando || 0),
            Interessado: Number(item.interessado || 0),
            Fechado: Number(item.fechados || 0),
            Perdido: Number(item.perdidos || 0),
          }))

          console.log("[Chart] Formatted data:", formattedData)

          // Filtrar para garantir que não haja datas futuras
          const today = new Date()
          today.setHours(0, 0, 0, 0) // Início do dia atual
          const todayStr = today.toISOString().split("T")[0]

          const filteredData = formattedData.filter((item) => {
            return item.date <= todayStr
          })

          // Se não houver dados, gerar dados de exemplo para os últimos 7 dias
          if (filteredData.length === 0) {
            console.log("[Chart] No data available, generating sample data")
            setData(generateSampleData())
          } else {
            console.log("[Chart] Setting filtered data:", filteredData)
            setData(filteredData)
          }
        } catch (err) {
          console.error("[Chart] Error fetching timeline data:", err)
          setError(`Failed to load activity timeline data: ${err instanceof Error ? err.message : String(err)}`)
          // Usar dados de exemplo em caso de erro
          setData(generateSampleData())
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [getQueryParams, internalRefreshKey, initialData, normalizeQueryParams, startDate, endDate, source])

  const formatXAxis = useCallback((tickItem: string) => {
    try {
      // Garantir que a data seja interpretada corretamente
      const date = new Date(tickItem + "T00:00:00")
      if (!isValid(date)) return tickItem
      return format(date, "dd/MM", { locale: ptBR })
    } catch (e) {
      return tickItem
    }
  }, [])

  // Manipulador de clique na legenda
  const handleLegendClick = useCallback(
    (dataKey: string) => {
      // Se todos os status estão invisíveis exceto o clicado, restaurar todos
      const currentlyVisible = Object.values(visibleStatuses).filter(Boolean).length

      if (currentlyVisible === 1 && visibleStatuses[dataKey]) {
        // Se o único visível for clicado, mostrar todos
        setVisibleStatuses({
          Novo: true,
          Conversando: true,
          Interessado: true,
          Fechado: true,
          Perdido: true,
        })
      } else {
        // Caso contrário, mostrar apenas o clicado
        const newVisibleStatuses = {
          Novo: false,
          Conversando: false,
          Interessado: false,
          Fechado: false,
          Perdido: false,
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
      Novo: true,
      Conversando: true,
      Interessado: true,
      Fechado: true,
      Perdido: true,
    })
  }, [])

  // Manipulador de clique no gráfico
  const handleChartClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedData = data.activePayload[0].payload
      setSelectedDate(clickedData.date)
      setSelectedData(clickedData)
      setIsModalOpen(true)
    }
  }, [])

  // Função para fechar o modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setSelectedData(null)
  }, [])

  // Renderizador personalizado para a legenda
  const renderCustomizedLegend = useCallback(
    (props: any) => {
      const { payload } = props

      return (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          {payload.map((entry: any, index: number) => {
            const isActive = visibleStatuses[entry.dataKey]

            return (
              <div
                key={`item-${index}`}
                className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition-colors ${
                  isActive ? "opacity-100" : "opacity-40"
                }`}
                onClick={() => handleLegendClick(entry.dataKey)}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium">{entry.value}</span>
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

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      try {
        // Garantir que a data seja interpretada corretamente
        const date = new Date(label + "T00:00:00")
        if (!isValid(date)) return null

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

              return (
                <div key={`item-${index}`} className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">{entry.name}:</span>
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

            <div className="mt-2 text-xs text-muted-foreground text-center">Clique para ver detalhes</div>
          </div>
        )
      } catch (e) {
        return null
      }
    }
    return null
  }

  // Verificar se há dados válidos para renderizar o gráfico
  const hasValidData =
    data &&
    data.length > 0 &&
    data.some(
      (item) => item.Novo > 0 || item.Conversando > 0 || item.Interessado > 0 || item.Fechado > 0 || item.Perdido > 0,
    )

  if (isLoading) {
    return (
      <Card className="border shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Atividade ao Longo do Tempo</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Evolução de contatos por status</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="h-32 w-32 rounded-full border-4 border-t-transparent border-blue-500 animate-spin"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Atividade ao Longo do Tempo</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Evolução de contatos por status</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center gap-4">
          <div className="text-red-500">{error}</div>
          <Button variant="outline" onClick={refreshData}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!hasValidData) {
    return (
      <Card className="border shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Atividade ao Longo do Tempo</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Evolução de contatos por status</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Nenhum dado disponível para o período selecionado</div>
        </CardContent>
      </Card>
    )
  }

  console.log("[ActivityTimelineChart] Rendering chart with data:", data.length)

  // Formatar a data selecionada para exibição no modal
  const formattedSelectedDate = selectedDate
    ? format(parseISO(selectedDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : ""

  return (
    <>
      <Card className="border shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-base font-medium">Atividade ao Longo do Tempo</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Evolução de contatos por status
              </CardDescription>
            </div>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Este gráfico mostra a evolução dos contatos ao longo do tempo, agrupados por status.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Clique em um status na legenda para filtrar.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Clique no gráfico para ver detalhes do dia.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Tabs defaultValue="area" value={viewType} onValueChange={(v) => setViewType(v as any)}>
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === "area" ? (
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
                stackOffset="expand"
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} tickMargin={8} />
                <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomizedLegend} />
                {visibleStatuses.Novo && (
                  <Area
                    type="monotone"
                    dataKey="Novo"
                    stackId="1"
                    stroke={statusColors.Novo}
                    fill={statusColors.Novo}
                    fillOpacity={0.8}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Conversando && (
                  <Area
                    type="monotone"
                    dataKey="Conversando"
                    stackId="1"
                    stroke={statusColors.Conversando}
                    fill={statusColors.Conversando}
                    fillOpacity={0.8}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Interessado && (
                  <Area
                    type="monotone"
                    dataKey="Interessado"
                    stackId="1"
                    stroke={statusColors.Interessado}
                    fill={statusColors.Interessado}
                    fillOpacity={0.8}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Fechado && (
                  <Area
                    type="monotone"
                    dataKey="Fechado"
                    stackId="1"
                    stroke={statusColors.Fechado}
                    fill={statusColors.Fechado}
                    fillOpacity={0.8}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Perdido && (
                  <Area
                    type="monotone"
                    dataKey="Perdido"
                    stackId="1"
                    stroke={statusColors.Perdido}
                    fill={statusColors.Perdido}
                    fillOpacity={0.8}
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            ) : viewType === "line" ? (
              <LineChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} tickMargin={8} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomizedLegend} />
                {visibleStatuses.Novo && (
                  <Line
                    type="monotone"
                    dataKey="Novo"
                    stroke={statusColors.Novo}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Conversando && (
                  <Line
                    type="monotone"
                    dataKey="Conversando"
                    stroke={statusColors.Conversando}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Interessado && (
                  <Line
                    type="monotone"
                    dataKey="Interessado"
                    stroke={statusColors.Interessado}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Fechado && (
                  <Line
                    type="monotone"
                    dataKey="Fechado"
                    stroke={statusColors.Fechado}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Perdido && (
                  <Line
                    type="monotone"
                    dataKey="Perdido"
                    stroke={statusColors.Perdido}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} tickMargin={8} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomizedLegend} />
                {visibleStatuses.Novo && (
                  <Bar dataKey="Novo" stackId="a" fill={statusColors.Novo} isAnimationActive={false} />
                )}
                {visibleStatuses.Conversando && (
                  <Bar dataKey="Conversando" stackId="a" fill={statusColors.Conversando} isAnimationActive={false} />
                )}
                {visibleStatuses.Interessado && (
                  <Bar dataKey="Interessado" stackId="a" fill={statusColors.Interessado} isAnimationActive={false} />
                )}
                {visibleStatuses.Fechado && (
                  <Bar dataKey="Fechado" stackId="a" fill={statusColors.Fechado} isAnimationActive={false} />
                )}
                {visibleStatuses.Perdido && (
                  <Bar dataKey="Perdido" stackId="a" fill={statusColors.Perdido} isAnimationActive={false} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <ChartDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Detalhes do Dia"
        description={formattedSelectedDate}
      >
        {selectedData && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">{formattedSelectedDate}</h3>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Distribuição de contatos por status
              </h4>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Porcentagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(selectedData)
                    .filter(([key]) => key !== "date")
                    .map(([status, value]) => {
                      // Calcular o total
                      const total = Object.entries(selectedData)
                        .filter(([key]) => key !== "date")
                        .reduce((sum, [, val]) => sum + (Number(val) || 0), 0)

                      const percentage = total > 0 ? Math.round((Number(value) / total) * 100) : 0

                      return (
                        <TableRow key={status}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: statusColors[status as keyof typeof statusColors] || "#888" }}
                              />
                              {status}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{value}</TableCell>
                          <TableCell className="text-right">{percentage}%</TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total de contatos:{" "}
                {Object.entries(selectedData)
                  .filter(([key]) => key !== "date")
                  .reduce((sum, [, value]) => sum + (Number(value) || 0), 0)}
              </div>
              <Button variant="outline" onClick={closeModal}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </ChartDetailModal>
    </>
  )
}
