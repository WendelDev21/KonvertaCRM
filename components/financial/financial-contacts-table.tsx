"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search } from "lucide-react"
import Link from "next/link"

interface Contact {
  id: string
  name: string
  contact: string
  status: string
  source: string
  value: number
  createdAt: string
}

interface FinancialContactsTableProps {
  contacts?: Contact[]
}

export function FinancialContactsTable({ contacts: initialContacts = [] }: FinancialContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [sourceFilter, setSourceFilter] = useState("todas")

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/financial/contacts")
        if (response.status === 401) {
          console.error("Usuário não autenticado")
          setContacts([])
          return
        }
        if (!response.ok) throw new Error("Erro ao buscar contatos")
        const data = await response.json()

        // Ensure data is an array
        if (Array.isArray(data)) {
          setContacts(data)
        } else {
          console.error("API response is not an array:", data)
          setContacts([])
        }
      } catch (error) {
        console.error("Erro ao buscar contatos:", error)
        setContacts([]) // Ensure contacts is always an array on error
      } finally {
        setIsLoading(false)
      }
    }

    // Check if initialContacts is provided and is an array
    if (initialContacts && Array.isArray(initialContacts) && initialContacts.length > 0) {
      setContacts(initialContacts)
      setIsLoading(false)
    } else {
      // If initialContacts is not provided or is empty, fetch from API
      fetchContacts()
    }
  }, [initialContacts])

  // Filtrar contatos - add safety check
  const filteredContacts = Array.isArray(contacts)
    ? contacts.filter((contact) => {
        // Filtro de busca
        const matchesSearch =
          searchTerm === "" ||
          (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contact.contact && contact.contact.toLowerCase().includes(searchTerm.toLowerCase()))

        // Filtro de status
        const matchesStatus = statusFilter === "todos" || contact.status === statusFilter

        // Filtro de origem
        const matchesSource = sourceFilter === "todas" || contact.source === sourceFilter

        return matchesSearch && matchesStatus && matchesSource
      })
    : []

  // Ordenar por valor (maior para menor)
  const sortedContacts = [...filteredContacts].sort((a, b) => (b.value || 0) - (a.value || 0))

  // Função para formatar valores monetários
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR").format(date)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Conversando">Conversando</SelectItem>
              <SelectItem value="Interessado">Interessado</SelectItem>
              <SelectItem value="Fechado">Fechado</SelectItem>
              <SelectItem value="Perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.length > 0 ? (
              sortedContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name || "N/A"}</TableCell>
                  <TableCell>{contact.contact || "N/A"}</TableCell>
                  <TableCell>{contact.status || "N/A"}</TableCell>
                  <TableCell>{contact.source || "N/A"}</TableCell>
                  <TableCell className="text-right font-medium">
                    <span
                      className={contact.value && contact.value > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}
                    >
                      {formatCurrency(contact.value)}
                    </span>
                  </TableCell>
                  <TableCell>{contact.createdAt ? formatDate(contact.createdAt) : "N/A"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/contacts/${contact.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Nenhum contato encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
