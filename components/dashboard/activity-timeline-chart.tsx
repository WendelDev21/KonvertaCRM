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
import {
  RefreshCw,
  BarChart3,
  LineChartIcon,
  HelpCircle,
  AreaChartIcon,
  Calendar,
  Info,
  TrendingUp,
  Activity,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
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

// Cores melhoradas com gradientes para cada status
const statusColors = {
  Novo: {
    primary: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    light: "#dbeafe",
    shadow: "rgba(59, 130, 246, 0.3)",
  },
  Conversando: {
    primary: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    light: "#fef3c7",
    shadow: "rgba(245, 158, 11, 0.3)",
  },
  Interessado: {
    primary: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    light: "#ede9fe",
    shadow: "rgba(139, 92, 246, 0.3)",
  },
  Fechado: {
    primary: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    light: "#d1fae5",
    shadow: "rgba(16, 185, 129, 0.3)",
  },
  Perdido: {
    primary: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    light: "#fee2e2",
    shadow: "rgba(239, 68, 68, 0.3)",
  },
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
  refreshKey = 0,
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
    const queryParams = getQueryParams()
    const normalizedQueryParams = normalizeQueryParams(queryParams)
    const normalizedLastParams = normalizeQueryParams(lastQueryParamsRef.current)

    console.log("[ActivityTimelineChart] Checking if fetch is needed:", {
      paramsChanged: normalizedQueryParams !== normalizedLastParams,
      internalRefreshKey,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      source,
    })

    // Sempre buscar dados quando os parâmetros mudarem ou houver refresh forçado
    if (normalizedQueryParams !== normalizedLastParams || internalRefreshKey > 0) {
      console.log("[ActivityTimelineChart] Fetching new data")
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
  }, [startDate, endDate, source, internalRefreshKey, getQueryParams, normalizeQueryParams])

  // Efeito específico para reagir às mudanças dos filtros
  useEffect(() => {
    console.log("[ActivityTimelineChart] Filter props changed:", {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      source,
    })

    // Forçar atualização quando os filtros mudarem
    if (componentMountedRef.current) {
      setInternalRefreshKey((prev) => prev + 1)
    }
  }, [startDate, endDate, source])

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
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {payload.map((entry: any, index: number) => {
            const isActive = visibleStatuses[entry.dataKey]
            const statusInfo = statusColors[entry.dataKey as keyof typeof statusColors]

            return (
              <div
                key={`item-${index}`}
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 border ${
                  isActive
                    ? "opacity-100 shadow-md bg-background/80 dark:bg-muted/20 border-border/50"
                    : "opacity-40 hover:opacity-70 bg-transparent border-transparent"
                }`}
                onClick={() => handleLegendClick(entry.dataKey)}
              >
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{
                    background: statusInfo?.gradient || entry.color,
                  }}
                />
                <span className="text-sm font-medium text-foreground">{entry.value}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    isActive ? "bg-muted/50 dark:bg-muted/80 text-foreground border-border/30" : ""
                  }`}
                >
                  {data.reduce((sum, item) => sum + (item[entry.dataKey] || 0), 0)}
                </Badge>
              </div>
            )
          })}

          {Object.values(visibleStatuses).some((v) => !v) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetVisibleStatuses}
              className="h-8 text-xs flex items-center gap-1 hover:bg-primary/10"
            >
              <RefreshCw className="h-3 w-3" />
              Mostrar todos
            </Button>
          )}
        </div>
      )
    },
    [visibleStatuses, handleLegendClick, resetVisibleStatuses, data],
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
          <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <p className="font-semibold text-sm">{formattedDate}</p>
            </div>

            <div className="space-y-2">
              {payload.map((entry, index) => {
                if (!entry.value) return null

                const dataKey = entry.dataKey as string
                // Mostrar apenas os status visíveis no tooltip
                if (!visibleStatuses[dataKey]) return null

                const percentage = total > 0 ? Math.round(((entry.value as number) / total) * 100) : 0
                const statusInfo = statusColors[dataKey as keyof typeof statusColors]

                return (
                  <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ background: statusInfo?.gradient || entry.color }}
                      />
                      <span className="text-sm font-medium">{entry.name}:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: statusInfo?.light,
                          color: statusInfo?.primary,
                        }}
                      >
                        {entry.value}
                      </Badge>
                      <span className="text-xs text-muted-foreground">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {total > 0 && (
              <div className="mt-3 pt-2 border-t border-border/50 flex justify-between items-center">
                <span className="text-sm font-medium">Total:</span>
                <Badge variant="outline" className="font-bold">
                  {total} contatos
                </Badge>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">💡 Clique para ver detalhes</p>
            </div>
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

  // Calcular estatísticas para o header
  const totalContacts = data.reduce((sum, item) => {
    return sum + item.Novo + item.Conversando + item.Interessado + item.Fechado + item.Perdido
  }, 0)

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Atividade ao Longo do Tempo</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Evolução de contatos por status
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-primary animate-spin mx-auto"></div>
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-transparent border-primary/30 animate-pulse mx-auto"></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Carregando dados...</p>
              <p className="text-xs text-muted-foreground">Aguarde enquanto processamos as informações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Activity className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Atividade ao Longo do Tempo</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Evolução de contatos por status
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col items-center justify-center gap-4">
          <div className="text-center space-y-3">
            <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto">
              <Activity className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-destructive font-medium">Erro ao carregar dados</div>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          </div>
          <Button variant="outline" onClick={refreshData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!hasValidData) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Atividade ao Longo do Tempo</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Evolução de contatos por status
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-muted-foreground font-medium">Nenhum dado disponível</div>
            <p className="text-sm text-muted-foreground/70">Nenhum dado encontrado para o período selecionado</p>
          </div>
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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Atividade ao Longo do Tempo</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Evolução de {totalContacts} contatos por status
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
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                {data.length} dias
              </Badge>
              <Tabs defaultValue="area" value={viewType} onValueChange={(v) => setViewType(v as any)}>
                <TabsList className="h-9 bg-muted/50">
                  <TabsTrigger value="area" className="h-7 w-8 p-0">
                    <AreaChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="line" className="h-7 w-8 p-0">
                    <LineChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="h-7 w-8 p-0">
                    <BarChart3 className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === "area" ? (
              <AreaChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
                stackOffset="expand"
                onClick={handleChartClick}
              >
                <defs>
                  {Object.entries(statusColors).map(([status, colors]) => (
                    <linearGradient key={status} id={`gradient-${status}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0.3} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#94a3b8" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomizedLegend} />
                {visibleStatuses.Novo && (
                  <Area
                    type="monotone"
                    dataKey="Novo"
                    stackId="1"
                    stroke={statusColors.Novo.primary}
                    fill={`url(#gradient-Novo)`}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Conversando && (
                  <Area
                    type="monotone"
                    dataKey="Conversando"
                    stackId="1"
                    stroke={statusColors.Conversando.primary}
                    fill={`url(#gradient-Conversando)`}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Interessado && (
                  <Area
                    type="monotone"
                    dataKey="Interessado"
                    stackId="1"
                    stroke={statusColors.Interessado.primary}
                    fill={`url(#gradient-Interessado)`}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Fechado && (
                  <Area
                    type="monotone"
                    dataKey="Fechado"
                    stackId="1"
                    stroke={statusColors.Fechado.primary}
                    fill={`url(#gradient-Fechado)`}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Perdido && (
                  <Area
                    type="monotone"
                    dataKey="Perdido"
                    stackId="1"
                    stroke={statusColors.Perdido.primary}
                    fill={`url(#gradient-Perdido)`}
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            ) : viewType === "line" ? (
              <LineChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#94a3b8" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomizedLegend} />
                {visibleStatuses.Novo && (
                  <Line
                    type="monotone"
                    dataKey="Novo"
                    stroke={statusColors.Novo.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: statusColors.Novo.primary, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: statusColors.Novo.primary, strokeWidth: 2, stroke: "#fff" }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Conversando && (
                  <Line
                    type="monotone"
                    dataKey="Conversando"
                    stroke={statusColors.Conversando.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: statusColors.Conversando.primary, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: statusColors.Conversando.primary, strokeWidth: 2, stroke: "#fff" }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Interessado && (
                  <Line
                    type="monotone"
                    dataKey="Interessado"
                    stroke={statusColors.Interessado.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: statusColors.Interessado.primary, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: statusColors.Interessado.primary, strokeWidth: 2, stroke: "#fff" }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Fechado && (
                  <Line
                    type="monotone"
                    dataKey="Fechado"
                    stroke={statusColors.Fechado.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: statusColors.Fechado.primary, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: statusColors.Fechado.primary, strokeWidth: 2, stroke: "#fff" }}
                    isAnimationActive={false}
                  />
                )}
                {visibleStatuses.Perdido && (
                  <Line
                    type="monotone"
                    dataKey="Perdido"
                    stroke={statusColors.Perdido.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: statusColors.Perdido.primary, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: statusColors.Perdido.primary, strokeWidth: 2, stroke: "#fff" }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
                onClick={handleChartClick}
              >
                <defs>
                  {Object.entries(statusColors).map(([status, colors]) => (
                    <linearGradient key={status} id={`bar-gradient-${status}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#94a3b8" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomizedLegend} />
                {visibleStatuses.Novo && (
                  <Bar
                    dataKey="Novo"
                    stackId="a"
                    fill={`url(#bar-gradient-Novo)`}
                    isAnimationActive={false}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {visibleStatuses.Conversando && (
                  <Bar
                    dataKey="Conversando"
                    stackId="a"
                    fill={`url(#bar-gradient-Conversando)`}
                    isAnimationActive={false}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {visibleStatuses.Interessado && (
                  <Bar
                    dataKey="Interessado"
                    stackId="a"
                    fill={`url(#bar-gradient-Interessado)`}
                    isAnimationActive={false}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {visibleStatuses.Fechado && (
                  <Bar
                    dataKey="Fechado"
                    stackId="a"
                    fill={`url(#bar-gradient-Fechado)`}
                    isAnimationActive={false}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {visibleStatuses.Perdido && (
                  <Bar
                    dataKey="Perdido"
                    stackId="a"
                    fill={`url(#bar-gradient-Perdido)`}
                    isAnimationActive={false}
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Modal melhorado para detalhes */}
      <ChartDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Detalhes do Dia"
        description={formattedSelectedDate}
      >
        {selectedData && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-background border">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{formattedSelectedDate}</h3>
                <p className="text-muted-foreground">Distribuição de contatos por status</p>
              </div>
            </div>

            <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Estatísticas do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Quantidade</TableHead>
                      <TableHead className="font-semibold text-right">Porcentagem</TableHead>
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
                        const statusInfo = statusColors[status as keyof typeof statusColors]

                        return (
                          <TableRow key={status} className="border-muted/30 hover:bg-muted/20">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full shadow-sm"
                                  style={{
                                    background: statusInfo?.gradient || "#888",
                                  }}
                                />
                                <span className="font-medium">{status}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="secondary"
                                className="bg-muted/50 dark:bg-muted/80 text-foreground border-border/30"
                              >
                                {value}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{percentage}%</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total de contatos:{" "}
                <Badge variant="outline" className="ml-1">
                  {Object.entries(selectedData)
                    .filter(([key]) => key !== "date")
                    .reduce((sum, [, value]) => sum + (Number(value) || 0), 0)}
                </Badge>
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
