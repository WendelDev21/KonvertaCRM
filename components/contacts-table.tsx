"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, MoreVertical, Trash2, MessageCircle, Loader2, RefreshCw } from "lucide-react"
import { ExportData } from "@/components/export-data"
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
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// Tipos
type ContactStatus = "Novo" | "Conversando" | "Interessado" | "Fechado" | "Perdido"
type ContactSource = "WhatsApp" | "Instagram" | "Outro"

interface Contact {
  id: string
  name: string
  contact: string
  source: ContactSource
  status: ContactStatus
  createdAt: string
  notes?: string
  value?: number
}

// Função para obter a cor do badge de status
function getStatusBadgeColor(status: ContactStatus) {
  switch (status) {
    case "Novo":
      return "status-new"
    case "Conversando":
      return "status-talking"
    case "Interessado":
      return "status-interested"
    case "Fechado":
      return "status-closed"
    case "Perdido":
      return "status-lost"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
  }
}

// Função para obter a cor do badge de origem
function getSourceBadgeColor(source: ContactSource) {
  switch (source) {
    case "WhatsApp":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Instagram":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

// Função para formatar valor em reais
function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === 0) return "R$ 0,00"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function ContactsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar contatos da API
  const fetchContacts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Obter os parâmetros de URL atuais
      const params = new URLSearchParams(searchParams.toString())
      console.log("Fetching contacts with params:", params.toString())

      const response = await fetch(`/api/contacts?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao buscar contatos")
      }

      const data = await response.json()
      console.log("Contacts fetched:", data.length)
      setContacts(data)
    } catch (error) {
      console.error("Erro ao buscar contatos:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido ao buscar contatos")
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  // Carregar contatos ao montar o componente ou quando os filtros mudarem
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleStatusChange = async (contactId: string, newStatus: ContactStatus) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar status")

      const updatedContact = await response.json()

      // Atualizar o estado local
      setContacts(contacts.map((contact) => (contact.id === contactId ? updatedContact : contact)))

      toast({
        title: "Status atualizado",
        description: `Contato movido para ${newStatus}`,
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do contato.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/contacts/${contactToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao excluir contato")

      // Atualizar o estado local
      setContacts(contacts.filter((contact) => contact.id !== contactToDelete))

      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir contato:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contato.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setContactToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando contatos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-500 mb-4">
          <p className="text-lg font-semibold">Erro ao carregar contatos</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={fetchContacts} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {contacts.length} contato{contacts.length !== 1 ? "s" : ""} encontrado{contacts.length !== 1 ? "s" : ""}
        </div>
        <ExportData contacts={contacts} />
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum contato encontrado. Adicione seu primeiro contato!
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id} className="table-row-hover">
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.contact}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getSourceBadgeColor(contact.source)}>
                      {contact.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn("px-2 py-1 h-auto text-xs status-badge", getStatusBadgeColor(contact.status))}
                        >
                          {contact.status}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Novo")}>Novo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Conversando")}>
                          Conversando
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Interessado")}>
                          Interessado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Fechado")}>
                          Fechado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Perdido")}>
                          Perdido
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{formatCurrency(contact.value)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(contact.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/contacts/${contact.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`https://wa.me/${contact.contact.replace(/\D/g, "")}`)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Mensagem
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setContactToDelete(contact.id)}
                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
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
