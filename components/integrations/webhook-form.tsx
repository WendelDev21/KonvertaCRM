"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { WebhookEvent } from "@/lib/webhook-db"

interface WebhookFormProps {
  webhook?: {
    id: string
    name: string
    url: string
    events: WebhookEvent[]
    secret?: string
    isActive?: boolean // Usar isActive em vez de active
  }
  onCancel: () => void
  onSave: () => void
}

export function WebhookForm({ webhook, onCancel, onSave }: WebhookFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [formData, setFormData] = useState({
    name: webhook?.name || "",
    url: webhook?.url || "",
    events: webhook?.events || [],
    secret: webhook?.secret || "",
    active: webhook?.isActive ?? true, // Usar isActive do webhook, mas manter active no formData
  })

  const eventOptions: { id: WebhookEvent; label: string; description: string }[] = [
    {
      id: "contact.created",
      label: "Contato Criado",
      description: "Disparado quando um novo contato é adicionado",
    },
    {
      id: "contact.updated",
      label: "Contato Atualizado",
      description: "Disparado quando um contato é modificado",
    },
    {
      id: "contact.deleted",
      label: "Contato Excluído",
      description: "Disparado quando um contato é removido",
    },
    {
      id: "contact.status_changed",
      label: "Status Alterado",
      description: "Disparado quando o status de um contato muda",
    },
    {
      id: "all",
      label: "Todos os Eventos",
      description: "Receber notificações de todos os eventos",
    },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEventToggle = (event: WebhookEvent, checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        // Se "all" for selecionado, remover todos os outros
        if (event === "all") {
          return { ...prev, events: ["all"] }
        }
        // Se outro evento for selecionado, remover "all" se estiver presente
        const newEvents = [...prev.events.filter((e) => e !== "all"), event]
        return { ...prev, events: newEvents }
      } else {
        return { ...prev, events: prev.events.filter((e) => e !== event) }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar dados
      if (!formData.name.trim() || !formData.url.trim() || formData.events.length === 0) {
        toast({
          title: "Erro",
          description: "Nome, URL e pelo menos um evento são obrigatórios.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Validar URL
      try {
        new URL(formData.url)
      } catch (e) {
        toast({
          title: "Erro",
          description: "URL inválida. Forneça uma URL completa e válida.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("Enviando dados do webhook:", formData)

      const endpoint = webhook?.id ? `/api/webhooks/${webhook.id}` : "/api/webhooks"

      const method = webhook?.id ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error("Erro na resposta da API:", responseData)
        throw new Error(responseData.error || "Erro ao salvar webhook")
      }

      console.log("Resposta da API:", responseData)

      toast({
        title: webhook?.id ? "Webhook atualizado" : "Webhook criado",
        description: webhook?.id ? "O webhook foi atualizado com sucesso." : "O novo webhook foi criado com sucesso.",
        variant: "success",
      })

      onSave()
    } catch (error) {
      console.error("Erro ao salvar webhook:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar webhook",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestWebhook = async () => {
    setIsTesting(true)

    try {
      // Validar URL
      if (!formData.url.trim()) {
        toast({
          title: "Erro",
          description: "URL é obrigatória para testar o webhook.",
          variant: "destructive",
        })
        setIsTesting(false)
        return
      }

      try {
        new URL(formData.url)
      } catch (e) {
        toast({
          title: "Erro",
          description: "URL inválida. Forneça uma URL completa e válida.",
          variant: "destructive",
        })
        setIsTesting(false)
        return
      }

      const response = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formData.url,
          secret: formData.secret,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Teste bem-sucedido",
          description: `O webhook respondeu com status ${result.status}`,
        })
      } else {
        toast({
          title: "Teste falhou",
          description: result.error || `Status: ${result.status || "desconhecido"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao testar webhook:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao testar webhook",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{webhook?.id ? "Editar Webhook" : "Novo Webhook"}</CardTitle>
          <CardDescription>
            {webhook?.id
              ? "Atualize as configurações do webhook existente"
              : "Configure um novo webhook para integrar com sistemas externos"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome do webhook"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://exemplo.com/webhook"
              required
            />
            <p className="text-xs text-muted-foreground">
              A URL que receberá as requisições POST quando os eventos ocorrerem
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Segredo (opcional)</Label>
            <Input
              id="secret"
              name="secret"
              value={formData.secret}
              onChange={handleChange}
              placeholder="Segredo para assinar as requisições"
            />
            <p className="text-xs text-muted-foreground">
              Um segredo usado para assinar as requisições, permitindo que você verifique a autenticidade
            </p>
          </div>

          <div className="space-y-2">
            <Label>Eventos</Label>
            <div className="grid gap-2 pt-1">
              {eventOptions.map((event) => (
                <div key={event.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`event-${event.id}`}
                    checked={formData.events.includes(event.id)}
                    onCheckedChange={(checked) => handleEventToggle(event.id, checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`event-${event.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event.label}
                    </label>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked === true }))}
            />
            <label
              htmlFor="active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ativo
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleTestWebhook} disabled={isTesting || isLoading}>
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Webhook"
              )}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
