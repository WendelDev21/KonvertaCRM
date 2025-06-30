"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react"
import type { Contact, ContactStatus } from "./kanban-board"

interface ContactDetailsDialogProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactUpdated?: () => void
}

export function ContactDetailsDialog({ contact, open, onOpenChange, onContactUpdated }: ContactDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Contact>>({})

  // Reset form when contact changes or dialog opens/closes
  useEffect(() => {
    if (contact && open) {
      setFormData({
        name: contact.name,
        contact: contact.contact,
        source: contact.source,
        status: contact.status,
        notes: contact.notes || "",
        value: contact.value || 0,
      })
    } else if (!open) {
      setFormData({})
      setIsEditing(false)
    }
  }, [contact, open])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (contact) {
      setFormData({
        name: contact.name,
        contact: contact.contact,
        source: contact.source,
        status: contact.status,
        notes: contact.notes || "",
        value: contact.value || 0,
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!contact) return

    setIsSaving(true)

    try {
      // Converter valor para número se for uma string
      const valueToSend = formData.value ? Number.parseFloat(String(formData.value)) : 0

      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          value: valueToSend,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar contato")
      }

      toast({
        title: "Contato atualizado",
        description: "As informações do contato foram atualizadas com sucesso.",
      })

      setIsEditing(false)
      if (onContactUpdated) {
        onContactUpdated()
      }
    } catch (error) {
      console.error("Erro ao atualizar contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contato.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contact) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir contato")
      }

      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso.",
      })

      onOpenChange(false)
      if (onContactUpdated) {
        onContactUpdated()
      }
    } catch (error) {
      console.error("Erro ao excluir contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contato.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Formatar valor em reais
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === 0) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  if (!contact) return null

  const formattedDate = formatDistanceToNow(new Date(contact.createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? "Editar Contato" : "Detalhes do Contato"}
            {!isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isEditing ? (
            // Formulário de edição
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" value={formData.name || ""} onChange={handleInputChange} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact">Contato</Label>
                <Input id="contact" name="contact" value={formData.contact || ""} onChange={handleInputChange} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="source">Fonte</Label>
                <Select value={formData.source} onValueChange={(value) => handleSelectChange("source", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value as ContactStatus)}
                >
                  <SelectTrigger>
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

              <div className="grid gap-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" value={formData.notes || ""} onChange={handleInputChange} rows={3} />
              </div>
            </>
          ) : (
            // Visualização dos detalhes
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome</p>
                  <p>{contact.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contato</p>
                  <p>{contact.contact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fonte</p>
                  <p>{contact.source}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p>{contact.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor</p>
                  <p
                    className={
                      contact.value && contact.value > 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""
                    }
                  >
                    {formatCurrency(contact.value)}
                  </p>
                </div>
              </div>

              {contact.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Criado</p>
                <p>{formattedDate}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Excluir
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
