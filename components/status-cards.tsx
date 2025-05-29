"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContactSource } from "./dashboard/dashboard-filters"

interface StatusCardsProps {
  startDate?: Date | null
  endDate?: Date | null
  source?: ContactSource
}

type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"

interface StatusCount {
  status: ContactStatus
  count: number
  color: string
}

export function StatusCards({ startDate, endDate, source }: StatusCardsProps) {
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Usar uma ref para armazenar o último queryParams processado
  const lastQueryParamsRef = useRef<string>("")

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

    // Adicionar timestamp para evitar cache
    params.append("_t", Date.now().toString())

    return params.toString()
  }, [startDate, endDate, source])

  // Melhorar o tratamento de erros e a exibição de dados
  useEffect(() => {
    const newQueryParams = getQueryParams()

    // Remover o timestamp para comparação, já que ele sempre muda
    const normalizedNewParams = newQueryParams.replace(/&_t=\d+/, "")
    const normalizedLastParams = lastQueryParamsRef.current.replace(/&_t=\d+/, "")

    // Only fetch if the query params have changed (ignoring timestamp)
    if (normalizedNewParams !== normalizedLastParams) {
      // Atualizar a ref com o valor atual completo (incluindo timestamp)
      lastQueryParamsRef.current = newQueryParams

      const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
          console.log("StatusCards: Fetching data with params:", newQueryParams)

          const response = await fetch(`/api/dashboard?${newQueryParams}`, {
            // Adicionar cabeçalhos para evitar cache
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const data = await response.json()
          console.log("StatusCards: Data received:", data)

          // Verificar se os dados são válidos
          if (!data.statusCounts) {
            console.warn("Invalid data format received:", data)
            // Usar valores padrão em vez de lançar erro
            setStatusCounts([
              { status: "Novo", count: 0, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
              {
                status: "Conversando",
                count: 0,
                color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
              },
              {
                status: "Interessado",
                count: 0,
                color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
              },
              {
                status: "Fechado",
                count: 0,
                color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
              },
              { status: "Perdido", count: 0, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
            ])
            return
          }

          // Transform the data for the status cards
          const counts: StatusCount[] = [
            {
              status: "Novo",
              count: data.statusCounts.Novo || 0,
              color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            },
            {
              status: "Conversando",
              count: data.statusCounts.Conversando || 0,
              color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            },
            {
              status: "Interessado",
              count: data.statusCounts.Interessado || 0,
              color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
            },
            {
              status: "Fechado",
              count: data.statusCounts.Fechado || 0,
              color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            },
            {
              status: "Perdido",
              count: data.statusCounts.Perdido || 0,
              color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            },
          ]

          setStatusCounts(counts)
        } catch (err) {
          console.error("Error fetching dashboard data:", err)
          setError("Failed to load status counts")

          // Use default values in case of error
          setStatusCounts([
            { status: "Novo", count: 0, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
            {
              status: "Conversando",
              count: 0,
              color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            },
            {
              status: "Interessado",
              count: 0,
              color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
            },
            { status: "Fechado", count: 0, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
            { status: "Perdido", count: 0, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
          ])
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [getQueryParams]) // Dependência apenas na função getQueryParams que é memoizada

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="border shadow-lg">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">{error}</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statusCounts.map((item) => (
        <Card key={item.status} className="border shadow-lg">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">{item.status}</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <p className={`text-2xl font-bold ${item.color} inline-block px-2 py-1 rounded-md`}>{item.count}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
