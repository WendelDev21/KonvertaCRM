"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, FilterIcon, X } from "lucide-react"
import { format, subDays, startOfYear, isValid } from "date-fns"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"

// Tipos
export type ContactSource = "WhatsApp" | "Instagram" | "Outro" | "Todos"
export type DateRange = "7dias" | "30dias" | "90dias" | "ano" | "personalizado"

export interface DashboardFilters {
  dateRange: DateRange
  startDate: Date | null
  endDate: Date | null
}

interface DashboardFiltersProps {
  onFilterChange?: (filters: DashboardFilters) => void
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const today = new Date()
  const isMobile = useIsMobile()

  // Obter valores iniciais dos parâmetros de URL
  const getInitialDateRange = (): DateRange => {
    const range = searchParams.get("dateRange")
    return (range as DateRange) || "30dias"
  }

  const getInitialStartDate = (): Date | null => {
    const startDateStr = searchParams.get("startDate")
    if (startDateStr) {
      const date = new Date(startDateStr)
      return isValid(date) ? date : subDays(today, 29) // Mudança: era 30, agora é 29
    }
    return subDays(today, 29) // Mudança: era 30, agora é 29
  }

  const getInitialEndDate = (): Date | null => {
    const endDateStr = searchParams.get("endDate")
    if (endDateStr) {
      const date = new Date(endDateStr)
      return isValid(date) ? date : today
    }
    return today
  }

  const getInitialSource = (): ContactSource => {
    const source = searchParams.get("source")
    return (source as ContactSource) || "Todos"
  }

  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: getInitialDateRange(),
    startDate: getInitialStartDate(),
    endDate: getInitialEndDate(),
  })

  const [showCustomDateRange, setShowCustomDateRange] = useState(filters.dateRange === "personalizado")
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Atualizar filtros quando os parâmetros de URL mudarem
  useEffect(() => {
    const newFilters = {
      dateRange: getInitialDateRange(),
      startDate: getInitialStartDate(),
      endDate: getInitialEndDate(),
    }

    setFilters(newFilters)
    setShowCustomDateRange(newFilters.dateRange === "personalizado")

    // Evitar loop infinito - só notificar mudanças se realmente houver mudanças
    if (JSON.stringify(newFilters) !== JSON.stringify(filters) && onFilterChange) {
      onFilterChange(newFilters)
    }
  }, [searchParams])

  // Melhorar a função updateFilters para evitar atualizações desnecessárias
  const updateFilters = useCallback(
    (newFilters: Partial<DashboardFilters>) => {
      const updatedFilters = { ...filters, ...newFilters }

      // Verificar se realmente houve mudanças antes de atualizar
      if (
        updatedFilters.dateRange === filters.dateRange &&
        (updatedFilters.startDate?.getTime() === filters.startDate?.getTime() ||
          (!updatedFilters.startDate && !filters.startDate)) &&
        (updatedFilters.endDate?.getTime() === filters.endDate?.getTime() ||
          (!updatedFilters.endDate && !filters.endDate))
      ) {
        return
      }

      setFilters(updatedFilters)

      // Atualizar a URL com os novos filtros
      const params = new URLSearchParams(searchParams.toString())

      params.set("dateRange", updatedFilters.dateRange)

      if (updatedFilters.startDate) {
        params.set("startDate", updatedFilters.startDate.toISOString())
      } else {
        params.delete("startDate")
      }

      if (updatedFilters.endDate) {
        params.set("endDate", updatedFilters.endDate.toISOString())
      } else {
        params.delete("endDate")
      }

      router.push(`${pathname}?${params.toString()}`)
      if (onFilterChange) {
        onFilterChange(updatedFilters)
      }
    },
    [filters, router, pathname, searchParams, onFilterChange],
  )

  // Função para atualizar o período com base na seleção
  const handleDateRangeChange = useCallback(
    (range: DateRange) => {
      let startDate = null
      const endDate = today

      switch (range) {
        case "7dias":
          startDate = subDays(today, 6) // Mudança: era 7, agora é 6
          break
        case "30dias":
          startDate = subDays(today, 29) // Mudança: era 30, agora é 29
          break
        case "90dias":
          startDate = subDays(today, 89) // Mudança: era 90, agora é 89
          break
        case "ano":
          startDate = startOfYear(today)
          break
        case "personalizado":
          setShowCustomDateRange(true)
          updateFilters({ dateRange: range })
          return
      }

      setShowCustomDateRange(range === "personalizado")
      updateFilters({ dateRange: range, startDate, endDate })
    },
    [today, updateFilters],
  )

  // Função para formatar a exibição do período
  const formatDateRange = useCallback(() => {
    if (!filters.startDate) return "Selecione um período"

    if (filters.dateRange !== "personalizado") {
      switch (filters.dateRange) {
        case "7dias":
          return "Últimos 7 dias"
        case "30dias":
          return "Últimos 30 dias"
        case "90dias":
          return "Últimos 90 dias"
        case "ano":
          return "Este ano"
      }
    }

    return `${format(filters.startDate, "dd/MM/yyyy")} - ${
      filters.endDate ? format(filters.endDate, "dd/MM/yyyy") : "Hoje"
    }`
  }, [filters.startDate, filters.endDate, filters.dateRange])

  // Função para limpar todos os filtros
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      dateRange: "30dias" as DateRange,
      startDate: subDays(today, 29),
      endDate: today,
    }
    setFilters(defaultFilters)
    setShowCustomDateRange(false)

    // Limpar parâmetros da URL
    router.push(pathname)

    if (onFilterChange) {
      onFilterChange(defaultFilters)
    }
  }, [router, pathname, onFilterChange, today])

  // Verificar se há filtros ativos (apenas para personalizado com datas selecionadas)
  const hasActiveFilters = filters.dateRange === "personalizado" && filters.startDate && filters.endDate

  return (
    <Card className={`p-2 mb-4 animate-slide-in ${isMobile ? "px-2" : "p-3"}`}>
      <div className={`flex ${isMobile ? "flex-col gap-2" : "flex-row gap-2 items-center justify-between"}`}>
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Período:</span>
        </div>

        <div className={`flex flex-row gap-2 items-center ${isMobile ? "w-full" : "flex-1 justify-end"}`}>
          <select
            className={`${isMobile ? "flex-1" : ""} h-9 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
            value={filters.dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value as DateRange)}
          >
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="90dias">Últimos 90 dias</option>
            <option value="ano">Este ano</option>
            <option value="personalizado">Personalizado</option>
          </select>

          {showCustomDateRange && (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 justify-start text-left font-normal border-dashed hover:border-solid ${isMobile ? "flex-1" : ""}`}
                >
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  {isMobile ? <span className="truncate max-w-[120px]">{formatDateRange()}</span> : formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.startDate || undefined,
                    to: filters.endDate || undefined,
                  }}
                  onSelect={(range) => {
                    updateFilters({
                      startDate: range?.from || null,
                      endDate: range?.to || null,
                    })
                    if (range?.from && range?.to) {
                      setDatePickerOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Botão para limpar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className={isMobile ? "self-end" : ""}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  )
}
