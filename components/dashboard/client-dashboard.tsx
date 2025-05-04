"use client"

import { useState } from "react"
import type { DashboardFilters as FilterType } from "@/components/dashboard/dashboard-filters"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { StatusCards } from "@/components/status-cards"
import { ActivityTimelineChart } from "@/components/dashboard/activity-timeline-chart"
import { ConversionRateChart } from "@/components/dashboard/conversion-rate-chart"

export function ClientDashboard() {
  const [filters, setFilters] = useState<FilterType>({
    dateRange: "30dias",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    source: "Todos",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleFilterChange = (newFilters: FilterType) => {
    setIsLoading(true)
    setFilters(newFilters)
    // Simular um pequeno atraso para mostrar o estado de carregamento
    setTimeout(() => setIsLoading(false), 300)
  }

  return (
    <>
      <DashboardFilters onFilterChange={handleFilterChange} isLoading={isLoading} />

      <div className="space-y-6">
        <StatusCards startDate={filters.startDate} endDate={filters.endDate} source={filters.source} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityTimelineChart startDate={filters.startDate} endDate={filters.endDate} source={filters.source} />

          <ConversionRateChart startDate={filters.startDate} endDate={filters.endDate} source={filters.source} />
        </div>
      </div>
    </>
  )
}
