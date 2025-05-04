"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, FilterIcon, X } from "lucide-react"
import { format, subDays, startOfYear, isValid } from "date-fns"
import { pt } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

// Tipos
export type ContactSource = "WhatsApp" | "Instagram" | "Outro" | "Todos"
export type DateRange = "7dias" | "30dias" | "90dias" | "ano" | "personalizado"

export interface DashboardFilters {
  dateRange: DateRange
  startDate: Date | null
  endDate: Date | null
  source: ContactSource
}

interface DashboardFiltersProps {
  onFilterChange?: (filters: DashboardFilters) => void
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const today = new Date()

  // Obter valores iniciais dos parâmetros de URL
  const getInitialDateRange = (): DateRange => {
    const range = searchParams.get("dateRange")
    return (range as DateRange) || "30dias"
  }

  const getInitialStartDate = (): Date | null => {
    const startDateStr = searchParams.get("startDate")
    if (startDateStr) {
      const date = new Date(startDateStr)
      return isValid(date) ? date : subDays(today, 30)
    }
    return subDays(today, 30)
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
    source: getInitialSource(),
  })

  const [showCustomDateRange, setShowCustomDateRange] = useState(filters.dateRange === "personalizado")
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Atualizar filtros quando os parâmetros de URL mudarem
  useEffect(() => {
    const newFilters = {
      dateRange: getInitialDateRange(),
      startDate: getInitialStartDate(),
      endDate: getInitialEndDate(),
      source: getInitialSource(),
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
        updatedFilters.source === filters.source &&
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

      if (updatedFilters.source !== "Todos") {
        params.set("source", updatedFilters.source)
      } else {
        params.delete("source")
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
          startDate = subDays(today, 7)
          break
        case "30dias":
          startDate = subDays(today, 30)
          break
        case "90dias":
          startDate = subDays(today, 90)
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
      startDate: subDays(today, 30),
      endDate: today,
      source: "Todos" as ContactSource,
    }
    setFilters(defaultFilters)
    setShowCustomDateRange(false)

    // Limpar parâmetros da URL
    router.push(pathname)

    if (onFilterChange) {
      onFilterChange(defaultFilters)
    }
  }, [router, pathname, onFilterChange, today])

  // Verificar se há filtros ativos
  const hasActiveFilters = filters.dateRange !== "30dias" || filters.source !== "Todos"

  return (
    <Card className="p-4 mb-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {/* Filtro de Período - Implementação simplificada */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Período:</span>
            <div className="flex-1 flex gap-2">
              <select
                className="w-full sm:w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                    <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateRange()}
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
                      locale={pt}
                      disabled={(date) => date > today}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* Filtro de Origem - Implementação simplificada */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Origem:</span>
            <select
              className="w-full sm:w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={filters.source}
              onChange={(e) => updateFilters({ source: e.target.value as ContactSource })}
            >
              <option value="Todos">Todas as origens</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>

        {/* Botão para limpar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Badges para mostrar filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary" className="text-xs">
            Período: {formatDateRange()}
          </Badge>

          {filters.source !== "Todos" && (
            <Badge variant="secondary" className="text-xs">
              Origem: {filters.source}
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}
