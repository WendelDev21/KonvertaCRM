"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Filter, X } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function ContactFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Obter valores iniciais dos parâmetros de URL
  const initialSearchTerm = searchParams.get("q") || ""
  const initialStatusFilter = searchParams.get("status") || ""
  const initialSourceFilter = searchParams.get("source") || ""

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [sourceFilter, setSourceFilter] = useState(initialSourceFilter)
  const [isFiltering, setIsFiltering] = useState(false)
  const [statusOptions, setStatusOptions] = useState([
    { value: "todos", label: "Todos" },
    { value: "Novo", label: "Novo" },
    { value: "Conversando", label: "Conversando" },
    { value: "Interessado", label: "Interessado" },
    { value: "Fechado", label: "Fechado" },
    { value: "Perdido", label: "Perdido" },
  ])
  const [sourceOptions, setSourceOptions] = useState([
    { value: "todas", label: "Todas" },
    { value: "WhatsApp", label: "WhatsApp" },
    { value: "Instagram", label: "Instagram" },
    { value: "Outro", label: "Outro" },
  ])

  // Atualizar estado quando os parâmetros de URL mudarem
  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "")
    setStatusFilter(searchParams.get("status") || "")
    setSourceFilter(searchParams.get("source") || "")

    // Verificar se há algum filtro ativo
    setIsFiltering(Boolean(searchParams.get("q") || searchParams.get("status") || searchParams.get("source")))
  }, [searchParams])

  // Carregar opções de status e source do banco de dados
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const response = await fetch("/api/debug")
        if (response.ok) {
          const data = await response.json()

          if (data.uniqueStatuses && data.uniqueStatuses.length > 0) {
            const newStatusOptions = [
              { value: "todos", label: "Todos" },
              ...data.uniqueStatuses.map((status) => ({
                value: status,
                label: status,
              })),
            ]
            setStatusOptions(newStatusOptions)
          }

          if (data.uniqueSources && data.uniqueSources.length > 0) {
            const newSourceOptions = [
              { value: "todas", label: "Todas" },
              ...data.uniqueSources.map((source) => ({
                value: source,
                label: source,
              })),
            ]
            setSourceOptions(newSourceOptions)
          }

          console.log("Loaded filter options from database:", {
            statuses: data.uniqueStatuses,
            sources: data.uniqueSources,
          })
        }
      } catch (error) {
        console.error("Error loading filter options:", error)
      }
    }

    loadFilterOptions()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Include all current filters when searching
    updateFilters({
      q: searchTerm,
      status: statusFilter,
      source: sourceFilter,
    })
  }

  const updateFilters = (updates: Record<string, string>) => {
    // Criar um novo objeto URLSearchParams
    const params = new URLSearchParams(searchParams.toString())

    // Atualizar ou remover parâmetros
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Navegar para a URL atualizada
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setSourceFilter("")
    router.push(pathname)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar contato..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              updateFilters({ status: value })
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sourceFilter}
            onValueChange={(value) => {
              setSourceFilter(value)
              updateFilters({ source: value })
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </form>

        <Button onClick={() => router.push("/contacts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {/* Mostrar filtros ativos */}
      {isFiltering && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Filtros ativos:</span>
          </Badge>

          {searchTerm && (
            <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              <span>Busca: {searchTerm}</span>
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilters({ q: "" })} />
            </Badge>
          )}

          {statusFilter && (
            <Badge className="flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              <span>
                Status:{" "}
                {statusFilter === "todos"
                  ? "Todos"
                  : statusOptions.find((o) => o.value === statusFilter)?.label || statusFilter}
              </span>
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilters({ status: "" })} />
            </Badge>
          )}

          {sourceFilter && (
            <Badge className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <span>
                Origem:{" "}
                {sourceFilter === "todas"
                  ? "Todas"
                  : sourceOptions.find((o) => o.value === sourceFilter)?.label || sourceFilter}
              </span>
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilters({ source: "" })} />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
