"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { ContactSource } from "./dashboard-filters"
import { ChartDetailModal } from "./chart-detail-modal"

interface StatusDistributionChartProps {
  startDate?: Date | null
  endDate?: Date | null
  source?: ContactSource
}

interface StatusData {
  name: string
  value: number
  color: string
}

export function StatusDistributionChart({ startDate, endDate, source }: StatusDistributionChartProps) {
  const [data, setData] = useState<StatusData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [queryParams, setQueryParams] = useState<string>("")

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

    return params.toString()
  }, [startDate, endDate, source])

  // Fetch data only when query params change
  useEffect(() => {
    const newQueryParams = getQueryParams()

    // Only fetch if the query params have changed
    if (newQueryParams !== queryParams) {
      setQueryParams(newQueryParams)

      const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const response = await fetch(`/api/dashboard?${newQueryParams}`)
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const responseData = await response.json()

          if (!responseData.statusCounts) {
            throw new Error("Invalid data format")
          }

          // Transform the data for the chart
          const chartData: StatusData[] = [
            {
              name: "Novo",
              value: responseData.statusCounts.Novo || 0,
              color: "#3b82f6", // blue-500
            },
            {
              name: "Conversando",
              value: responseData.statusCounts.Conversando || 0,
              color: "#eab308", // yellow-500
            },
            {
              name: "Interessado",
              value: responseData.statusCounts.Interessado || 0,
              color: "#a855f7", // purple-500
            },
            {
              name: "Fechado",
              value: responseData.statusCounts.Fechado || 0,
              color: "#22c55e", // green-500
            },
            {
              name: "Perdido",
              value: responseData.statusCounts.Perdido || 0,
              color: "#ef4444", // red-500
            },
          ].filter((item) => item.value > 0) // Remove items with zero value

          setData(chartData)
        } catch (err) {
          console.error("Error fetching dashboard data:", err)
          setError("Failed to load status distribution data")
          setData([])
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [getQueryParams, queryParams])

  const handleChartClick = useCallback(() => {
    setShowModal(true)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null
  }, [])

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="h-32 w-32 rounded-full border-4 border-t-transparent border-blue-500 animate-spin"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Nenhum dado disponível para o período selecionado</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border shadow-sm cursor-pointer" onClick={handleChartClick}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} contatos`, "Quantidade"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <ChartDetailModal
        isOpen={showModal}
        onClose={closeModal}
        title="Distribuição por Status"
        data={data}
        valueLabel="Contatos"
      />
    </>
  )
}
