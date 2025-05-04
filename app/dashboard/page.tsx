"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { StatusCards } from "@/components/status-cards"
import { DashboardFilters, type DashboardFilters as FilterType } from "@/components/dashboard/dashboard-filters"
import { SimpleStatusChart } from "@/components/dashboard/simple-status-chart"
import { SimpleSourceChart } from "@/components/dashboard/simple-source-chart"
import { useSearchParams } from "next/navigation"
import { subDays } from "date-fns"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { ActivityTimelineChart } from "@/components/dashboard/activity-timeline-chart"

export default function DashboardPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const today = useMemo(() => new Date(), [])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const { toast } = useToast()

  // Timestamp da última atualização
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

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

  // Carregar dados do dashboard
  const fetchDashboardData = useCallback(
    async (showRefreshIndicator = true) => {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const startDateParam = filters.startDate ? filters.startDate.toISOString() : ""
        const endDateParam = filters.endDate ? filters.endDate.toISOString() : ""
        const sourceParam = filters.source !== "Todos" ? filters.source : ""

        // Adicionar um parâmetro de timestamp para evitar cache
        const timestamp = new Date().getTime()

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
          throw new Error("Falha ao carregar dados do dashboard")
        }

        const data = await response.json()
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
        console.error("Erro ao carregar dados do dashboard:", error)
        setError("Não foi possível carregar os dados do dashboard. Tente novamente.")
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
    setFilters(newFilters)
    // Carregar dados com os novos filtros
    fetchDashboardData(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Removemos fetchDashboardData das dependências para evitar ciclos

  // Formatar a hora da última atualização
  const formattedLastUpdated = useMemo(() => {
    return lastUpdated.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [lastUpdated])

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Cabeçalho da página */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Bem-vindo, {session?.user?.name?.split(" ")[0] || "Usuário"}! Aqui está o resumo dos seus contatos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Atualizado às {formattedLastUpdated}</div>
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
            </div>
          </div>

          {/* Filtros */}
          <DashboardFilters onFilterChange={handleFilterChange} />

          {/* Cards de status */}
          <StatusCards startDate={filters.startDate} endDate={filters.endDate} source={filters.source} />

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
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  className="mt-4"
                  disabled={!canRefresh || refreshing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          ) : dashboardData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="dashboard-card">
                  <CardContent className="pt-6">
                    <SimpleStatusChart data={dashboardData.statusCounts} />
                  </CardContent>
                </Card>

                <Card className="dashboard-card">
                  <CardContent className="pt-6">
                    <SimpleSourceChart data={dashboardData.sourceCounts} />
                  </CardContent>
                </Card>
              </div>

              <ActivityTimelineChart startDate={filters.startDate} endDate={filters.endDate} source={filters.source} />
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
