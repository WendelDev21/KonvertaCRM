"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleStatusChart } from "@/components/dashboard/simple-status-chart"
import { SimpleSourceChart } from "@/components/dashboard/simple-source-chart"
import { SimpleTimelineChart } from "@/components/dashboard/simple-timeline-chart"
import { ConversionRateChart } from "@/components/dashboard/conversion-rate-chart"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { Button } from "@/components/ui/button"
import { Download, Printer, Share2 } from "lucide-react"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada de dados e métricas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      <DashboardFilters />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="conversion">Conversão</TabsTrigger>
          <TabsTrigger value="sources">Origens</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-slide-in">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Contatos agrupados por estágio no funil</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <SimpleStatusChart data={[]} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Origem</CardTitle>
                <CardDescription>Contatos agrupados por canal de origem</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <SimpleSourceChart data={[]} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atividade ao Longo do Tempo</CardTitle>
              <CardDescription>Evolução dos contatos no período selecionado</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <SimpleTimelineChart data={[]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6 animate-slide-in">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conversão</CardTitle>
              <CardDescription>Evolução da taxa de conversão ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px]">
                <ConversionRateChart />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversão por Origem</CardTitle>
                <CardDescription>Taxa de conversão por canal de aquisição</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Dados em breve disponíveis</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Conversão</CardTitle>
                <CardDescription>Tempo médio para converter por estágio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Dados em breve disponíveis</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6 animate-slide-in">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Canal</CardTitle>
              <CardDescription>Análise detalhada de cada canal de aquisição</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px]">
                <SimpleSourceChart data={[]} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp</CardTitle>
                <CardDescription>Desempenho do canal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">42%</div>
                <p className="text-sm text-muted-foreground mt-1">Taxa de conversão</p>
                <div className="mt-4 text-2xl font-bold">127</div>
                <p className="text-sm text-muted-foreground">Contatos no período</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Instagram</CardTitle>
                <CardDescription>Desempenho do canal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">28%</div>
                <p className="text-sm text-muted-foreground mt-1">Taxa de conversão</p>
                <div className="mt-4 text-2xl font-bold">89</div>
                <p className="text-sm text-muted-foreground">Contatos no período</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Outros</CardTitle>
                <CardDescription>Desempenho do canal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">15%</div>
                <p className="text-sm text-muted-foreground mt-1">Taxa de conversão</p>
                <div className="mt-4 text-2xl font-bold">43</div>
                <p className="text-sm text-muted-foreground">Contatos no período</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6 animate-slide-in">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Temporal</CardTitle>
              <CardDescription>Análise detalhada da evolução ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px]">
                <SimpleTimelineChart data={[]} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparação de Períodos</CardTitle>
              <CardDescription>Comparação entre o período atual e o anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Dados em breve disponíveis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
