"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreateInstanceDialog } from "@/components/whatsapp/create-instance-dialog"
import { WhatsAppInstanceCard } from "@/components/whatsapp/whatsapp-instance-card"
import {
  MessageSquare,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  Share2,
  Crown,
  ArrowLeft,
  Zap,
  Shield,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface WhatsAppInstance {
  id: string
  instanceName: string
  status: string
  qrCode: string | null
  createdAt: string
  updatedAt: string
}

// Componente de upgrade para conexões
function UpgradeToBusinessPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Share2 className="h-8 w-8 text-primary" />
            <span>Conexões</span>
          </h1>
          <p className="text-muted-foreground">Funcionalidade exclusiva para usuários Business</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Upgrade para Business</CardTitle>
            <CardDescription className="text-lg">
              Conecte múltiplas instâncias do WhatsApp com recursos avançados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Recursos Premium de Conexão
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/20">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Múltiplas instâncias do WhatsApp</p>
                      <p className="text-sm text-muted-foreground">Conecte quantos números precisar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/20">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Conexão automática via QR Code</p>
                      <p className="text-sm text-muted-foreground">Setup rápido e fácil</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/20">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Gerenciamento centralizado</p>
                      <p className="text-sm text-muted-foreground">Controle tudo em um só lugar</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Monitoramento e Segurança
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/20">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Status em tempo real</p>
                      <p className="text-sm text-muted-foreground">Monitore todas as conexões</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/20">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Reconexão automática</p>
                      <p className="text-sm text-muted-foreground">Nunca perca uma mensagem</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/20">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Logs detalhados</p>
                      <p className="text-sm text-muted-foreground">Histórico completo de atividades</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  Seu plano atual
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Starter/Pro
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Faça upgrade para o plano Business e conecte múltiplas instâncias do WhatsApp
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="flex-1">
                  <Link href="/settings/upgrades">
                    <Crown className="mr-2 h-4 w-4" />
                    Fazer Upgrade para Business
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Voltar ao Dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function WhatsAppPage() {
  const { data: session, status } = useSession()
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  // Verificar se o usuário tem plano Business
  const userPlan = session?.user ? (session.user as any).plan || "Starter" : "Starter"
  const hasBusinessAccess = userPlan === "Business"

  const fetchInstances = useCallback(async () => {
    if (!hasBusinessAccess) return

    try {
      console.log("[WhatsApp Page] Fetching instances...")
      const response = await fetch("/api/connections/instances")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar instâncias")
      }

      const data = await response.json()
      console.log("[WhatsApp Page] Instances loaded:", data.length)
      setInstances(data)
    } catch (error) {
      console.error("Error fetching instances:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao carregar instâncias")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [hasBusinessAccess])

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false)
      if (hasBusinessAccess) {
        fetchInstances()
      }
    }
  }, [status, hasBusinessAccess, fetchInstances])

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    await fetchInstances()
    toast.success("Lista de instâncias atualizada!")
  }

  const getStatusStats = () => {
    const stats = {
      total: instances.length,
      connected: instances.filter((i) => i.status === "CONNECTED").length,
      disconnected: instances.filter((i) => i.status === "DISCONNECTED").length,
      pending: instances.filter((i) => ["CREATED", "QR_UPDATED", "CONNECTING"].includes(i.status)).length,
    }
    return stats
  }

  if (isLoading || status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando instâncias...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!hasBusinessAccess) {
    return <UpgradeToBusinessPage />
  }

  const stats = getStatusStats()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Share2 className="h-8 w-8 text-primary" />
            <span>Conexões</span>
          </h1>
          <p className="text-muted-foreground">Gerencie suas instâncias do WhatsApp e conecte números para automação</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshAll} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
          <CreateInstanceDialog onInstanceCreated={fetchInstances} />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Instâncias</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Instâncias criadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectadas</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
            <p className="text-xs text-muted-foreground">Online e funcionando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconectadas</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.disconnected}</div>
            <p className="text-xs text-muted-foreground">Precisam reconectar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando conexão</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Instances List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Suas Instâncias</h2>
          {instances.length > 0 && (
            <Badge variant="outline" className="text-sm">
              {instances.length} {instances.length === 1 ? "instância" : "instâncias"}
            </Badge>
          )}
        </div>

        {instances.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Nenhuma instância encontrada</CardTitle>
              <CardDescription className="text-center">
                Crie sua primeira instância do WhatsApp para começar a enviar mensagens automatizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CreateInstanceDialog onInstanceCreated={fetchInstances} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instances.map((instance) => (
              <WhatsAppInstanceCard
                key={instance.id}
                instance={instance}
                onInstanceUpdated={fetchInstances}
                onInstanceDeleted={fetchInstances}
              />
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Como usar o WhatsApp Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">1. Criar Instância</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Nova Instância" e escolha um nome único para identificar seu número do WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Conectar WhatsApp</h4>
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code com seu WhatsApp para conectar o número à plataforma.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Enviar Mensagens</h4>
              <p className="text-sm text-muted-foreground">
                Use a página de campanhas para enviar mensagens através da instância conectada.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Monitorar Status</h4>
              <p className="text-sm text-muted-foreground">
                Acompanhe o status de conexão e receba notificações sobre desconexões.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
