"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { ContactSource } from "./dashboard-filters"

interface ConversionRateChartProps {
  startDate?: Date | null
  endDate?: Date | null
  source?: ContactSource
}

interface ChartData {
  name: string
  total: number
  rate: number
  color: string
}

export function ConversionRateChart({ startDate, endDate, source }: ConversionRateChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [totalContacts, setTotalContacts] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
          const response = await fetch(`/api/dashboard/conversion?${newQueryParams}`)
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const responseData = await response.json()

          if (!responseData.sourceCounts) {
            throw new Error("Invalid data format")
          }

          // Set total contacts
          setTotalContacts(responseData.totalContacts || 0)

          // Transform the data for the chart
          const chartData: ChartData[] = [
            {
              name: "WhatsApp",
              total: responseData.sourceCounts.WhatsApp || 0,
              rate: responseData.conversionRates.WhatsApp || 0,
              color: "#25D366", // WhatsApp green
            },
            {
              name: "Instagram",
              total: responseData.sourceCounts.Instagram || 0,
              rate: responseData.conversionRates.Instagram || 0,
              color: "#E1306C", // Instagram pink
            },
            {
              name: "Outro",
              total: responseData.sourceCounts.Outro || 0,
              rate: responseData.conversionRates.Outro || 0,
              color: "#6b7280", // gray-500
            },
          ]

          setData(chartData)
        } catch (err) {
          console.error("Error fetching conversion data:", err)
          setError("Failed to load conversion rate data")
          setData([])
          setTotalContacts(0)
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [getQueryParams, queryParams])

  const customTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-sm">
          <p className="font-medium">{label}</p>
          <p>Total: {payload[0].value} contatos</p>
          <p>Taxa: {payload[1].value.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }, [])

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Contatos por Origem</CardTitle>
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
          <CardTitle className="text-base font-medium">Contatos por Origem</CardTitle>
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
          <CardTitle className="text-base font-medium">Contatos por Origem</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Nenhum dado disponível para o período selecionado</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Contatos por Origem{" "}
          <span className="text-sm font-normal text-muted-foreground ml-2">Total: {totalContacts}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
            <Tooltip content={customTooltip} />
            <Legend />
            <Bar yAxisId="left" dataKey="total" name="Total de Contatos" fill="#3b82f6" />
            <Bar yAxisId="right" dataKey="rate" name="Taxa de Conversão (%)" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
