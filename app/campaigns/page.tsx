"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Trash2,
  MessageCircle,
  Crown,
  Zap,
  Star,
} from "lucide-react"
import Link from "next/link" 

interface Contact {
  id: string
  name: string
  contact: string
  status: string
  source: string
}

interface WhatsAppInstance {
  id: string
  instanceName: string
  status: string
}

interface Campaign {
  id: string
  name: string
  message: string
  status: string
  totalContacts: number
  sentCount: number
  failedCount: number
  createdAt: string
  scheduledAt?: string
  completedAt?: string
}

interface DailyLimit {
  sentCount: number
  limit: number
  date: string
}

export default function CampaignsPage() {
  const { data: session } = useSession()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [dailyLimit, setDailyLimit] = useState<DailyLimit>({ sentCount: 0, limit: 100, date: "" })
  const [loading, setLoading] = useState(false)
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null)

  // Form states
  const [campaignName, setCampaignName] = useState("")
  const [message, setMessage] = useState("")
  const [selectedInstance, setSelectedInstance] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Verificar se o usuário tem plano Business
  const userPlan = session?.user ? (session.user as any).plan || "Starter" : "Starter"
  const hasBusinessAccess = userPlan === "Business"

  // Load data
  useEffect(() => {
    if (session?.user) {
      loadContacts()
      loadInstances()
      loadCampaigns()
      loadDailyLimit()
    }
  }, [session])

  const loadContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }

  const loadInstances = async () => {
    try {
      const response = await fetch("/api/connections/instances")
      if (response.ok) {
        const data = await response.json()
        setInstances(data.filter((instance: WhatsAppInstance) => instance.status === "CONNECTED"))
      }
    } catch (error) {
      console.error("Error loading instances:", error)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
    }
  }

  const loadDailyLimit = async () => {
    try {
      const response = await fetch("/api/campaigns/daily-limit")
      if (response.ok) {
        const data = await response.json()
        setDailyLimit(data)
      }
    } catch (error) {
      console.error("Error loading daily limit:", error)
    }
  }

  const filteredContacts = contacts.filter((contact) => filterStatus === "all" || contact.status === filterStatus)

  const handleContactSelection = (contactId: string, checked: boolean) => {
    if (checked) {
      if (selectedContacts.length + 1 > dailyLimit.limit - dailyLimit.sentCount) {
        toast.error(
          `Limite diário excedido. Você pode enviar apenas ${dailyLimit.limit - dailyLimit.sentCount} mensagens hoje.`,
        )
        return
      }
      setSelectedContacts([...selectedContacts, contactId])
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
    }
  }

  const handleSelectAllByStatus = (status: string) => {
    const statusContacts = contacts.filter((contact) => contact.status === status)
    const availableSlots = dailyLimit.limit - dailyLimit.sentCount
    const contactsToAdd = statusContacts.slice(0, availableSlots)

    if (statusContacts.length > availableSlots) {
      toast.warning(`Apenas ${availableSlots} contatos foram selecionados devido ao limite diário.`)
    }

    const newSelected = [...selectedContacts, ...contactsToAdd.map((c) => c.id)]
    setSelectedContacts([...new Set(newSelected)])
  }

  const createCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error("Nome da campanha é obrigatório")
      return
    }

    if (!message.trim()) {
      toast.error("Mensagem é obrigatória")
      return
    }

    if (!selectedInstance) {
      toast.error("Selecione uma instância do WhatsApp")
      return
    }

    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato")
      return
    }

    if (selectedContacts.length > dailyLimit.limit - dailyLimit.sentCount) {
      toast.error(
        `Limite diário excedido. Você pode enviar apenas ${dailyLimit.limit - dailyLimit.sentCount} mensagens hoje.`,
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: campaignName,
          message,
          instanceId: selectedInstance,
          contactIds: selectedContacts,
        }),
      })

      if (response.ok) {
        const campaign = await response.json()
        toast.success("Campanha criada com sucesso! O envio será iniciado em breve.")

        // Reset form
        setCampaignName("")
        setMessage("")
        setSelectedContacts([])

        // Reload data
        loadCampaigns()
        loadDailyLimit()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao criar campanha")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Erro ao criar campanha")
    } finally {
      setLoading(false)
    }
  }

  const pauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Campanha pausada")
        loadCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao pausar campanha")
      }
    } catch (error) {
      console.error("Error pausing campaign:", error)
      toast.error("Erro ao pausar campanha")
    }
  }

  const resumeCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/resume`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Campanha retomada")
        loadCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao retomar campanha")
      }
    } catch (error) {
      console.error("Error resuming campaign:", error)
      toast.error("Erro ao retomar campanha")
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    setDeletingCampaign(campaignId)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Campanha deletada com sucesso")
        loadCampaigns()
        loadDailyLimit() // Recarregar limite diário caso tenha mudado
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao deletar campanha")
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Erro ao deletar campanha")
    } finally {
      setDeletingCampaign(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-500", label: "Pendente", icon: Clock },
      RUNNING: { color: "bg-blue-500", label: "Executando", icon: Play },
      COMPLETED: { color: "bg-green-500", label: "Concluída", icon: CheckCircle },
      PAUSED: { color: "bg-orange-500", label: "Pausada", icon: Pause },
      FAILED: { color: "bg-red-500", label: "Falhou", icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const canDeleteCampaign = (status: string) => {
    return status !== "RUNNING"
  }

  const remainingLimit = dailyLimit.limit - dailyLimit.sentCount
  const limitPercentage = (dailyLimit.sentCount / dailyLimit.limit) * 100

  // Componente de upgrade para usuários não Business
  const UpgradeToBusinessPage = () => {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              <span>Campanhas</span>
            </h1>
            <p className="text-muted-foreground">Dispare campanhas de mensagens em massa para seus contatos</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
              <CardTitle className="text-2xl">Funcionalidade Premium</CardTitle>
              <CardDescription className="text-lg">
                As campanhas de mensagens em massa estão disponíveis apenas no plano Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Campanhas Ilimitadas</h3>
                    <p className="text-sm text-muted-foreground">
                      Crie e execute campanhas de mensagens em massa sem limites
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Segmentação Avançada</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecione contatos por status, fonte e outros critérios
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Envio Programado</h3>
                    <p className="text-sm text-muted-foreground">Agende suas campanhas para o melhor momento</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Controle Total</h3>
                    <p className="text-sm text-muted-foreground">
                      Pause, retome e monitore suas campanhas em tempo real
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Star className="h-4 w-4" />
                <AlertDescription>
                  <strong>Plano Business:</strong> Tenha acesso a todas as funcionalidades avançadas de marketing e
                  automação.
                </AlertDescription>
              </Alert>

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
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!hasBusinessAccess) {
    return <UpgradeToBusinessPage />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <span>Campanhas</span>
          </h1>
          <p className="text-muted-foreground">Dispare campanhas de mensagens em massa para seus contatos</p>
        </div>
      </div>

      {/* Daily Limit Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>
                Limite diário de envios: {dailyLimit.sentCount}/{dailyLimit.limit}
              </span>
              <span className="text-sm text-muted-foreground">Restam {remainingLimit} envios hoje</span>
            </div>
            <Progress value={limitPercentage} className="w-full" />
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Criar Campanha</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Form */}
            <Card>
              <CardHeader>
                <CardTitle>Nova Campanha</CardTitle>
                <CardDescription>Configure sua campanha de mensagens em massa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Nome da Campanha</Label>
                  <Input
                    id="campaignName"
                    placeholder="Ex: Promoção Black Friday"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instance">Instância WhatsApp</Label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.instanceName} - {instance.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {instances.length === 0 && (
                    <p className="text-sm text-red-500">Nenhuma instância conectada encontrada</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite sua mensagem aqui..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">{message.length} caracteres</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Contatos Selecionados</Label>
                    <Badge variant="outline">{selectedContacts.length} selecionados</Badge>
                  </div>

                  {selectedContacts.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Os envios serão divididos em lotes de 20 mensagens com intervalo de 1 hora entre cada lote.
                        Tempo estimado: {Math.ceil(selectedContacts.length / 20)} horas
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  onClick={createCampaign}
                  disabled={loading || instances.length === 0 || remainingLimit === 0}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Criando Campanha...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Criar e Iniciar Campanha
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Contact Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Contatos</CardTitle>
                <CardDescription>Escolha os contatos que receberão a mensagem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filtrar por Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Conversando">Conversando</SelectItem>
                      <SelectItem value="Interessado">Interessado</SelectItem>
                      <SelectItem value="Fechado">Fechado</SelectItem>
                      <SelectItem value="Perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSelectAllByStatus("Novo")}>
                    Todos Novos ({contacts.filter((c) => c.status === "Novo").length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSelectAllByStatus("Interessado")}>
                    Todos Interessados ({contacts.filter((c) => c.status === "Interessado").length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedContacts([])}>
                    Limpar Seleção
                  </Button>
                </div>

                <Separator />

                {/* Contact List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleContactSelection(contact.id, checked as boolean)}
                        disabled={!selectedContacts.includes(contact.id) && selectedContacts.length >= remainingLimit}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{contact.contact}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{contact.status}</Badge>
                        <Badge variant="secondary">{contact.source}</Badge>
                      </div>
                    </div>
                  ))}

                  {filteredContacts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum contato encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas</CardTitle>
              <CardDescription>Gerencie suas campanhas de mensagens em massa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Criada em {new Date(campaign.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(campaign.status)}

                        {campaign.status === "RUNNING" && (
                          <Button variant="outline" size="sm" onClick={() => pauseCampaign(campaign.id)}>
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                        )}

                        {campaign.status === "PAUSED" && (
                          <Button variant="outline" size="sm" onClick={() => resumeCampaign(campaign.id)}>
                            <Play className="w-4 h-4 mr-1" />
                            Retomar
                          </Button>
                        )}

                        {canDeleteCampaign(campaign.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                disabled={deletingCampaign === campaign.id}
                              >
                                {deletingCampaign === campaign.id ? (
                                  <RotateCcw className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-1" />
                                )}
                                Deletar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar a campanha "{campaign.name}"? Esta ação não pode ser
                                  desfeita e todos os dados relacionados serão perdidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCampaign(campaign.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Deletar Campanha
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded">
                      <p className="text-sm">{campaign.message}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold">{campaign.totalContacts}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Enviadas</p>
                        <p className="font-semibold text-green-600">{campaign.sentCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Falharam</p>
                        <p className="font-semibold text-red-600">{campaign.failedCount}</p>
                      </div>
                    </div>

                    {campaign.totalContacts > 0 && (
                      <Progress value={(campaign.sentCount / campaign.totalContacts) * 100} className="w-full" />
                    )}
                  </div>
                ))}

                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma campanha criada ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
