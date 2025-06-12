"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, User, Phone, Tag, MessageSquare, DollarSign } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Tipos
type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"
type ContactSource = "WhatsApp" | "Instagram" | "Outro"

interface ContactFormProps {
  contactId?: string
}

interface ContactFormData {
  name: string
  contact: string
  source: ContactSource
  status: ContactStatus
  notes: string
  value: string
}

export function ContactForm({ contactId }: ContactFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    contact: "",
    source: "WhatsApp",
    status: "Novo",
    notes: "",
    value: "0",
  })

  // Buscar dados do contato se estiver editando
  useEffect(() => {
    if (contactId) {
      const fetchContact = async () => {
        setIsFetching(true)
        try {
          const response = await fetch(`/api/contacts/${contactId}`)
          if (!response.ok) throw new Error("Erro ao buscar contato")

          const data = await response.json()
          setFormData({
            name: data.name,
            contact: data.contact,
            source: data.source,
            status: data.status,
            notes: data.notes || "",
            value: data.value?.toString() || "0",
          })
        } catch (error) {
          console.error("Erro ao buscar contato:", error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do contato.",
            variant: "destructive",
          })
        } finally {
          setIsFetching(false)
        }
      }

      fetchContact()
    }
  }, [contactId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar dados
      if (!formData.name.trim() || !formData.contact.trim()) {
        toast({
          title: "Erro",
          description: "Nome e contato são obrigatórios.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Converter valor para número
      const valueAsNumber = Number.parseFloat(formData.value) || 0

      // Determinar se é criação ou atualização
      const url = contactId ? `/api/contacts/${contactId}` : "/api/contacts"
      const method = contactId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          value: valueAsNumber,
        }),
      })

      if (!response.ok) throw new Error("Erro ao salvar contato")

      toast({
        title: contactId ? "Contato atualizado" : "Contato criado",
        description: contactId ? "O contato foi atualizado com sucesso." : "O novo contato foi criado com sucesso.",
        variant: "success",
      })

      // Redirecionar para o dashboard
      router.push("/contacts")
      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar contato:", error)
      toast({
        title: "Erro",
        description: "Você atingiu seu limite de 100 contatos! Faça o upgrade para adicionar mais contatos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados do contato...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome do contato"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Telefone ou @Instagram</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="+55 00 00000-0000 ou @usuario"
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="source">Origem</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
            <Select value={formData.source} onValueChange={(value) => handleSelectChange("source", value)}>
              <SelectTrigger id="source" className="pl-10">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
            <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
              <SelectTrigger id="status" className="pl-10">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Conversando">Conversando</SelectItem>
                <SelectItem value="Interessado">Interessado</SelectItem>
                <SelectItem value="Fechado">Fechado</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Valor (R$)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={handleChange}
              placeholder="0,00"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Adicione informações relevantes sobre o contato"
            className="min-h-[120px] pl-10"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
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
    </form>
  )
}
