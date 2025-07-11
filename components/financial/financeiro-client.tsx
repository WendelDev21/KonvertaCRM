"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FinancialSummaryCards } from "./financial-summary-cards"
import { FinancialStatusChart } from "./financial-status-chart"
import { FinancialSourceChart } from "./financial-source-chart"
import { FinancialContactsTable } from "./financial-contacts-table"

interface FinancialData {
  byStatus: Record<string, number>
  bySource: Record<string, number>
  total: number
  summary: {
    total: number
    fechado: number
    emNegociacao: number
    perdido: number
  }
}

interface Contact {
  id: string
  name: string
  contact: string
  status: string
  source: string
  value: number
  createdAt: string
}

export function FinancialClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch("/api/financial")
        if (response.status === 401) {
          console.error("Usuário não autenticado")
          return
        }
        if (!response.ok) throw new Error("Erro ao buscar dados financeiros")
        const data = await response.json()
        setFinancialData(data)
      } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error)
      }
    }

    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/financial/contacts")
        if (response.status === 401) {
          console.error("Usuário não autenticado")
          setContacts([])
          return
        }
        if (!response.ok) throw new Error("Erro ao buscar contatos")
        const data = await response.json()

        // Ensure data is an array
        if (Array.isArray(data)) {
          setContacts(data)
        } else {
          console.error("Contacts API response is not an array:", data)
          setContacts([])
        }
      } catch (error) {
        console.error("Erro ao buscar contatos:", error)
        setContacts([])
      }
    }

    Promise.all([fetchFinancialData(), fetchContacts()])
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {financialData && <FinancialSummaryCards summary={financialData.summary} />}

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {financialData && (
              <>
                <FinancialStatusChart data={financialData.byStatus} />
                <FinancialSourceChart data={financialData.bySource} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <FinancialContactsTable contacts={contacts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
