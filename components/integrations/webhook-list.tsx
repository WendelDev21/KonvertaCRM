"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Plus, Trash2, Loader2, ExternalLink } from "lucide-react"
import { WebhookForm } from "./webhook-form"
import type { WebhookEvent } from "@/lib/webhook-db"

interface Webhook {
  id: string
  name: string
  url: string
  events: WebhookEvent[]
  secret?: string
  createdAt: string
  isActive: boolean
  lastTriggered?: string
  lastStatus?: number
}

export function WebhookList() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  const fetchWebhooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/webhooks")
      if (!response.ok) throw new Error("Erro ao buscar webhooks")
      const data = await response.json()
      setWebhooks(data)
    } catch (error) {
      console.error("Erro ao buscar webhooks:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os webhooks.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setIsUpdatingStatus(id)
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar status")

      setWebhooks(webhooks.map((webhook) => (webhook.id === id ? { ...webhook, isActive } : webhook)))

      toast({
        title: "Status atualizado",
        description: `Webhook ${isActive ? "ativado" : "desativado"} com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do webhook.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/webhooks/${webhookToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao excluir webhook")

      setWebhooks(webhooks.filter((webhook) => webhook.id !== webhookToDelete))

      toast({
        title: "Webhook excluído",
        description: "O webhook foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir webhook:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o webhook.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setWebhookToDelete(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Nunca"
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status?: number) => {
    if (!status) return <Badge variant="outline">Nunca disparado</Badge>

    if (status >= 200 && status < 300) {
      return (
        <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Sucesso ({status})
        </Badge>
      )
    } else if (status >= 400 && status < 500) {
      return (
        <Badge variant="warning" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          Erro cliente ({status})
        </Badge>
      )
    } else if (status >= 500) {
      return <Badge variant="destructive">Erro servidor ({status})</Badge>
    } else {
      return <Badge variant="outline">Status {status}</Badge>
    }
  }

  const getEventLabels = (events: WebhookEvent[]) => {
    if (events.includes("all")) {
      return <Badge variant="secondary">Todos os eventos</Badge>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {events.map((event) => {
          let label = ""
          let color = ""

          switch (event) {
            case "contact.created":
              label = "Criado"
              color = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              break
            case "contact.updated":
              label = "Atualizado"
              color = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
              break
            case "contact.deleted":
              label = "Excluído"
              color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              break
            case "contact.status_changed":
              label = "Status"
              color = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
              break
            default:
              label = event
              color = ""
          }

          return (
            <Badge key={event} variant="secondary" className={color}>
              {label}
            </Badge>
          )
        })}
      </div>
    )
  }

  if (isCreating || editingWebhook) {
    return (
      <WebhookForm
        webhook={editingWebhook || undefined}
        onCancel={() => {
          setIsCreating(false)
          setEditingWebhook(null)
        }}
        onSave={() => {
          setIsCreating(false)
          setEditingWebhook(null)
          fetchWebhooks()
        }}
      />
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Webhooks</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando webhooks...</span>
        </div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum webhook configurado</CardTitle>
            <CardDescription>Crie seu primeiro webhook para integrar o Konverta com outros sistemas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={webhook.isActive ? "" : "opacity-70"}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {webhook.name}
                      {!webhook.isActive && (
                        <Badge variant="outline" className="ml-2">
                          Inativo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <span className="truncate max-w-[300px]">{webhook.url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => window.open(webhook.url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={webhook.isActive}
                      disabled={isUpdatingStatus === webhook.id}
                      onCheckedChange={(checked) => handleToggleActive(webhook.id, checked)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setEditingWebhook(webhook)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setWebhookToDelete(webhook.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Eventos</p>
                    {getEventLabels(webhook.events)}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Último disparo</p>
                    <p>{formatDate(webhook.lastTriggered)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Status</p>
                    {getStatusBadge(webhook.lastStatus)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!webhookToDelete} onOpenChange={() => setWebhookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este webhook? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
