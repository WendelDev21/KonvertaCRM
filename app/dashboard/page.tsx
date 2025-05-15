"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { StatusCards } from "@/components/status-cards"
import { DashboardFilters, type DashboardFilters as FilterType } from "@/components/dashboard/dashboard-filters"
import { SimpleStatusChart } from "@/components/dashboard/simple-status-chart"
import { SimpleSourceChart } from "@/components/dashboard/simple-source-chart"
import { useSearchParams } from "next/navigation"
import { subDays } from "date-fns"
import { Loader2, RefreshCw, AlertCircle, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { ActivityTimelineChart } from "@/components/dashboard/activity-timeline-chart"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function DashboardPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const today = useMemo(() => new Date(), [])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const { toast } = useToast()
  const refreshKeyRef = useRef<number>(0)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  // Timestamp da última atualização
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  // Formatação do horário - movida para o cliente
  const [formattedTime, setFormattedTime] = useState<string>("")

  // Controle de tempo entre atualizações manuais (5 segundos)
  const [canRefresh, setCanRefresh] = useState(true)

  // Função para obter os filtros iniciais dos parâmetros de URL
  const getInitialFilters = useCallback((): FilterType => {
    const dateRange = searchParams.get("dateRange") || "30dias"

    let startDate: Date | null = null
    const startDateStr = searchParams.get("startDate")
    if (startDateStr) {
      startDate = new Date(startDateStr)
    } else {
      // Valor padrão baseado no dateRange
      switch (dateRange) {
        case "7dias":
          startDate = subDays(today, 7)
          break
        case "30dias":
          startDate = subDays(today, 30)
          break
        case "90dias":
          startDate = subDays(today, 90)
          break
        case "ano":
          startDate = new Date(today.getFullYear(), 0, 1) // Primeiro dia do ano
          break
        default:
          startDate = subDays(today, 30) // Padrão: 30 dias
      }
    }

    let endDate: Date | null = null
    const endDateStr = searchParams.get("endDate")
    if (endDateStr) {
      endDate = new Date(endDateStr)
    } else {
      endDate = today
    }

    const source = searchParams.get("source") || "Todos"

    return {
      dateRange: dateRange as any,
      startDate,
      endDate,
      source: source as any,
    }
  }, [searchParams, today])

  const [filters, setFilters] = useState<FilterType>(getInitialFilters())

  // Atualizar filtros quando os parâmetros de URL mudarem
  useEffect(() => {
    setFilters(getInitialFilters())
  }, [getInitialFilters])

  // Formatar a hora apenas no cliente para evitar problemas de hidratação
  useEffect(() => {
    setFormattedTime(
      lastUpdated.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    )
  }, [lastUpdated])

  // Carregar dados do dashboard
  const fetchDashboardData = useCallback(
    async (showRefreshIndicator = true) => {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      setErrorDetails(null)

      try {
        const startDateParam = filters.startDate ? filters.startDate.toISOString() : ""
        const endDateParam = filters.endDate ? filters.endDate.toISOString() : ""
        const sourceParam = filters.source !== "Todos" ? filters.source : ""

        // Adicionar um parâmetro de timestamp para evitar cache
        const timestamp = new Date().getTime()

        console.log("[Dashboard] Fetching dashboard data with params:", {
          startDate: startDateParam,
          endDate: endDateParam,
          source: sourceParam,
          timestamp,
        })

        const response = await fetch(
          `/api/dashboard?startDate=${startDateParam}&endDate=${endDateParam}&source=${sourceParam}&_t=${timestamp}`,
          {
            // Adicionar cabeçalhos para evitar cache
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[Dashboard] API error response:", response.status, errorText)

          const errorMessage = `Falha ao carregar dados do dashboard: ${response.status} ${response.statusText}`
          let errorDetails = errorText

          try {
            // Tentar analisar o erro como JSON
            const errorJson = JSON.parse(errorText)
            if (errorJson.error) {
              errorDetails = errorJson.error
            }
          } catch (e) {
            // Se não for JSON, usar o texto bruto
          }

          throw new Error(errorMessage, { cause: errorDetails })
        }

        const data = await response.json()
        console.log("[Dashboard] Data received:", data)

        // Verificar se os dados têm o formato esperado
        if (!data.statusCounts || !data.sourceCounts) {
          console.error("[Dashboard] Invalid data format:", data)
          throw new Error("Formato de dados inválido")
        }

        // Incrementar o refreshKey para forçar a atualização dos componentes filhos
        refreshKeyRef.current += 1
        setRefreshTrigger(refreshKeyRef.current)

        // Atualizar os dados do dashboard
        setDashboardData(data)
        setLastUpdated(new Date())

        if (showRefreshIndicator && !loading) {
          toast({
            title: "Dados atualizados",
            description: "Os dados do dashboard foram atualizados com sucesso.",
            duration: 3000,
          })
        }
      } catch (error) {
        console.error("[Dashboard] Error fetching data:", error)
        setError(error instanceof Error ? error.message : String(error))
        setErrorDetails(error instanceof Error && error.cause ? String(error.cause) : null)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filters, loading, toast],
  )

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    fetchDashboardData(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Dependência vazia para executar apenas uma vez

  // Função para atualização manual com throttling
  const handleManualRefresh = useCallback(() => {
    if (!canRefresh || refreshing) return

    fetchDashboardData(true)
    setCanRefresh(false)

    // Reabilitar o botão após 5 segundos
    setTimeout(() => {
      setCanRefresh(true)
    }, 5000)
  }, [canRefresh, refreshing, fetchDashboardData])

  // Função para lidar com mudanças de filtro
  const handleFilterChange = useCallback((newFilters: FilterType) => {
    console.log("[Dashboard] Filter changed:", newFilters)
    setFilters(newFilters)
    // Carregar dados com os novos filtros
    fetchDashboardData(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Removemos fetchDashboardData das dependências para evitar ciclos

  // Verificar status do banco de dados
  const checkDatabaseStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/debug/db-status")
      const data = await response.json()
      alert(`Status do banco de dados: ${data.status}\n\nDetalhes: ${JSON.stringify(data.details, null, 2)}`)
    } catch (error) {
      alert(`Erro ao verificar status do banco de dados: ${error}`)
    }
  }, [])

  // Verificar dados do dashboard
  const checkDashboardData = useCallback(() => {
    console.log("Current dashboard data:", dashboardData)
    if (dashboardData) {
      alert(
        `Dados do Dashboard:\n\nStatus Counts: ${JSON.stringify(
          dashboardData.statusCounts,
        )}\n\nSource Counts: ${JSON.stringify(dashboardData.sourceCounts)}\n\nTimeline: ${
          dashboardData.timeline ? dashboardData.timeline.length : 0
        } items`,
      )
    } else {
      alert("Nenhum dado disponível")
    }
  }, [dashboardData])

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Cabeçalho da página */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              
              <p className="text-muted-foreground mt-1">
                Bem-vindo, {session?.user?.name?.split(" ")[0] || "Usuário"}! Aqui está o resumo dos seus contatos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Usar suppressHydrationWarning para evitar erros de hidratação */}
              <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                {formattedTime ? `Atualizado às ${formattedTime}` : "Carregando..."}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={!canRefresh || refreshing || loading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>{refreshing ? "Atualizando..." : "Atualizar"}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={checkDashboardData} className="flex items-center gap-1">
                <Bug className="h-4 w-4" />
                <span>Debug</span>
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <DashboardFilters onFilterChange={handleFilterChange} />

          {/* Cards de status */}
          <StatusCards
            startDate={filters.startDate}
            endDate={filters.endDate}
            source={filters.source}
            refreshKey={refreshTrigger}
          />

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando dados...</span>
            </div>
          ) : error ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                <p className="text-center text-muted-foreground">{error}</p>

                {errorDetails && (
                  <Accordion type="single" collapsible className="w-full max-w-md mt-4">
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-sm">Ver detalhes do erro</AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-40">
                          <pre>{errorDetails}</pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleManualRefresh} variant="outline" disabled={!canRefresh || refreshing}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar novamente
                  </Button>

                  <Button onClick={checkDatabaseStatus} variant="outline" className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Verificar BD
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : dashboardData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="dashboard-card">
                  <CardContent className="pt-6">
                    <SimpleStatusChart data={dashboardData.statusCounts} refreshKey={refreshTrigger} />
                  </CardContent>
                </Card>

                <Card className="dashboard-card">
                  <CardContent className="pt-6">
                    <SimpleSourceChart data={dashboardData.sourceCounts} refreshKey={refreshTrigger} />
                  </CardContent>
                </Card>
              </div>

              <ActivityTimelineChart
                key={`timeline-${refreshTrigger}`}
                startDate={filters.startDate}
                endDate={filters.endDate}
                source={filters.source}
                data={dashboardData.timeline}
                refreshKey={refreshTrigger}
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
