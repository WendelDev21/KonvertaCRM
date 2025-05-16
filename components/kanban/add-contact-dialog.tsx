"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import type { ContactStatus } from "./kanban-board"

interface AddContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStatus: ContactStatus
  onContactAdded: () => void
}

export function AddContactDialog({ open, onOpenChange, initialStatus, onContactAdded }: AddContactDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    source: "Email",
    status: initialStatus,
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.contact) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e contato são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar contato")
      }

      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado com sucesso.",
      })

      setFormData({
        name: "",
        contact: "",
        source: "Email",
        status: initialStatus,
        notes: "",
      })

      onContactAdded()
    } catch (error) {
      console.error("Erro ao adicionar contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o contato.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Contato</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome do contato"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Telefone ou @Instagram</Label>
            <Input
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="+55 00 00000-0000 ou @usuario"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Origem</Label>
            <Select value={formData.source} onValueChange={(value) => handleSelectChange("source", value)}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value as ContactStatus)}
            >
              <SelectTrigger id="status">
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

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Adicione informações relevantes sobre o contato"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
