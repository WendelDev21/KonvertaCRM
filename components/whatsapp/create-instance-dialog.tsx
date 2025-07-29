"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CreateInstanceDialogProps {
  onInstanceCreated: () => void
}

export function CreateInstanceDialog({ onInstanceCreated }: CreateInstanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [instanceName, setInstanceName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instanceName.trim()) {
      toast.error("Nome da instância é obrigatório")
      return
    }

    // Validate instance name (only alphanumeric and underscores)
    const validNameRegex = /^[a-zA-Z0-9_]+$/
    if (!validNameRegex.test(instanceName)) {
      toast.error("Nome da instância deve conter apenas letras, números e underscore")
      return
    }

    setIsCreating(true)

    try {
      console.log(`[Create Instance] Creating instance: ${instanceName}`)

      const response = await fetch("/api/connections/instances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceName: instanceName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar instância")
      }

      console.log("[Create Instance] Instance created successfully:", data)
      toast.success(`Instância "${instanceName}" criada com sucesso!`)

      setInstanceName("")
      setOpen(false)
      onInstanceCreated()
    } catch (error) {
      console.error("[Create Instance] Error creating instance:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao criar instância")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Instância
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
            <DialogDescription>
              Crie uma nova instância para conectar um número do WhatsApp. O nome deve ser único e conter apenas letras,
              números e underscore.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instanceName" className="text-right">
                Nome
              </Label>
              <Input
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="ex: minha_empresa"
                className="col-span-3"
                disabled={isCreating}
                maxLength={50}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Use apenas letras, números e underscore (_)</p>
              <p>• Máximo 50 caracteres</p>
              <p>• Exemplo: minha_empresa, vendas_2024</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || !instanceName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Instância
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
