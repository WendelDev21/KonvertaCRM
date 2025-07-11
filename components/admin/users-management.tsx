"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, Plus, Pencil, Trash2, Search, Check, X, RefreshCw } from "lucide-react"

// Atualizar a interface User para incluir o campo plan
interface User {
  id: string
  name: string
  email: string
  role: string
  plan: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

// Interface para armazenar as atualizações locais
interface LocalUpdates {
  [userId: string]: {
    plan?: string
    role?: string
    isActive?: boolean
    name?: string
    email?: string
    timestamp: number
  }
}

export function AdminUsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [includeInactive, setIncludeInactive] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    plan: "Starter",
    isActive: true,
  })

  // Usar useRef para armazenar atualizações locais que persistem entre renderizações
  const localUpdatesRef = useRef<LocalUpdates>({})

  // Controlar se devemos buscar dados do servidor
  const shouldFetchRef = useRef<boolean>(true)

  // Contador para forçar re-renderizações
  const [renderCount, setRenderCount] = useState(0)

  // Função para aplicar atualizações locais aos dados do usuário
  const applyLocalUpdates = useCallback((userData: User[]): User[] => {
    const localUpdates = localUpdatesRef.current

    return userData.map((user) => {
      const updates = localUpdates[user.id]
      if (updates) {
        // Aplicar apenas atualizações que não são muito antigas (menos de 1 hora)
        const isRecent = Date.now() - updates.timestamp < 3600000 // 1 hora
        if (isRecent) {
          return {
            ...user,
            ...(updates.plan !== undefined ? { plan: updates.plan } : {}),
            ...(updates.role !== undefined ? { role: updates.role } : {}),
            ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.email !== undefined ? { email: updates.email } : {}),
          }
        } else {
          // Remover atualizações antigas
          delete localUpdates[user.id]
        }
      }
      return user
    })
  }, [])

  // Fetch users - Convertido para useCallback para evitar recriações desnecessárias
  const fetchUsers = useCallback(
    async (force = false) => {
      // Se não devemos buscar dados e não é uma busca forçada, retornar
      if (!shouldFetchRef.current && !force) {
        console.log("Ignorando busca de usuários - desativada temporariamente")
        return
      }

      setIsRefreshing(true)
      try {
        const queryParams = new URLSearchParams()

        if (searchQuery) {
          queryParams.append("q", searchQuery)
        }

        if (includeInactive) {
          queryParams.append("includeInactive", "true")
        }

        // Adicionar um parâmetro de timestamp para evitar cache
        queryParams.append("_t", Date.now().toString())

        const url = `/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
        console.log(`Buscando usuários de: ${url}`)

        const response = await fetch(url, {
          // Adicionar cabeçalhos para evitar cache
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${await response.text()}`)
        }

        const data = await response.json()
        console.log("Dados de usuários recebidos do servidor:", data)

        // Aplicar atualizações locais aos dados recebidos
        const updatedData = applyLocalUpdates(data)
        console.log("Dados de usuários após aplicar atualizações locais:", updatedData)

        setUsers(updatedData)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [searchQuery, includeInactive, applyLocalUpdates],
  )

  // Carregar usuários na montagem do componente e quando os filtros mudarem
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }))
  }

  // Atualizar a função resetForm para incluir o campo plan
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      plan: "Starter",
      isActive: true,
    })
    setSelectedUser(null)
  }

  // Atualizar a função handleOpenDialog para incluir o plano do usuário
  const handleOpenDialog = (user?: User) => {
    if (user) {
      // Verificar se há atualizações locais para este usuário
      const localUpdate = localUpdatesRef.current[user.id]

      setSelectedUser(user)
      setFormData({
        name: localUpdate?.name ?? user.name,
        email: localUpdate?.email ?? user.email,
        password: "",
        confirmPassword: "",
        role: localUpdate?.role ?? user.role,
        plan: localUpdate?.plan ?? (user.plan || "Starter"),
        isActive: localUpdate?.isActive ?? user.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (selectedUser) {
        // Desativar temporariamente a busca automática de dados
        shouldFetchRef.current = false

        // Criar o objeto de dados para atualização
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          plan: formData.plan,
          isActive: formData.isActive,
          ...(formData.password ? { password: formData.password } : {}),
        }

        // Atualizar localmente primeiro
        localUpdatesRef.current[selectedUser.id] = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          plan: formData.plan,
          isActive: formData.isActive,
          timestamp: Date.now(),
        }

        // Atualizar a interface imediatamente
        setUsers((prevUsers) => {
          return prevUsers.map((user) => {
            if (user.id === selectedUser.id) {
              return {
                ...user,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                plan: formData.plan,
                isActive: formData.isActive,
                updatedAt: new Date().toISOString(),
              }
            }
            return user
          })
        })

        // Forçar re-renderização
        setRenderCount((prev) => prev + 1)

        // Update user no servidor
        console.log(`Enviando atualização para o servidor: ${JSON.stringify(updateData)}`)
        const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha ao atualizar usuário")
        }

        const updatedUser = await response.json()
        console.log("Resposta do servidor após atualização:", updatedUser)

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
          variant: "success",
        })

        // Reativar a busca automática após um tempo
        setTimeout(() => {
          shouldFetchRef.current = true
        }, 5000)
      } else {
        // Desativar temporariamente a busca automática de dados
        shouldFetchRef.current = false

        // Criar o objeto de dados para criação
        const createData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          plan: formData.plan, // Garantir que o plano selecionado seja enviado
          isActive: formData.isActive,
        }

        console.log(`Enviando dados para criação de usuário: ${JSON.stringify(createData)}`)

        // Create user
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify(createData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha ao criar usuário")
        }

        const newUser = await response.json()
        console.log("Novo usuário criado (resposta do servidor):", newUser)

        // Verificar se o plano foi definido corretamente
        if (newUser.plan !== formData.plan) {
          console.warn(
            `Aviso: O plano retornado pelo servidor (${newUser.plan}) é diferente do plano selecionado (${formData.plan})`,
          )

          // Corrigir o plano no objeto do novo usuário
          newUser.plan = formData.plan

          // Adicionar à lista de atualizações locais para persistir a correção
          if (newUser.id) {
            localUpdatesRef.current[newUser.id] = {
              plan: formData.plan,
              timestamp: Date.now(),
            }
          }
        }

        // Adicionar o novo usuário à lista local com o plano correto
        setUsers((prevUsers) => [...prevUsers, { ...newUser, plan: formData.plan }])

        // Forçar re-renderização
        setRenderCount((prev) => prev + 1)

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
          variant: "success",
        })

        // Reativar a busca automática após um tempo
        setTimeout(() => {
          shouldFetchRef.current = true
        }, 5000)
      }

      // Fechar o diálogo e resetar o formulário
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar usuário",
        variant: "destructive",
      })

      // Reativar a busca automática em caso de erro
      shouldFetchRef.current = true
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateUser = async () => {
    if (!selectedUser) return

    setIsLoading(true)

    try {
      // Desativar temporariamente a busca automática de dados
      shouldFetchRef.current = false

      // Atualizar localmente primeiro
      localUpdatesRef.current[selectedUser.id] = {
        ...localUpdatesRef.current[selectedUser.id],
        isActive: false,
        timestamp: Date.now(),
      }

      // Atualizar a interface imediatamente
      setUsers((prevUsers) => {
        return prevUsers.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              isActive: false,
              updatedAt: new Date().toISOString(),
            }
          }
          return user
        })
      })

      // Forçar re-renderização
      setRenderCount((prev) => prev + 1)

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao desativar usuário")
      }

      toast({
        title: "Sucesso",
        description: "Usuário desativado com sucesso",
        variant: "success",
      })

      // Fechar o diálogo
      setIsDeleteDialogOpen(false)

      // Reativar a busca automática após um tempo
      setTimeout(() => {
        shouldFetchRef.current = true
      }, 5000)
    } catch (error) {
      console.error("Error deactivating user:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao desativar usuário",
        variant: "destructive",
      })

      // Reativar a busca automática em caso de erro
      shouldFetchRef.current = true
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Função para forçar a atualização da lista de usuários
  const handleRefresh = () => {
    fetchUsers(true) // Forçar busca
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>Adicione, edite ou desative usuários do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuários..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Switch id="include-inactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
              <Label htmlFor="include-inactive">Mostrar inativos</Label>
            </div>

            <Button onClick={handleRefresh} variant="outline" size="icon" disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            <Button onClick={() => handleOpenDialog()} className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {isLoading && users.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando usuários...</span>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              {/* Tabela de usuários com coluna de plano */}
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={`${user.id}-${user.plan}-${renderCount}`}
                      className={!user.isActive ? "opacity-60" : ""}
                    >
                      <TableCell>
                        {user.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          >
                            <X className="mr-1 h-3 w-3" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-secondary-foreground"
                          }
                        >
                          {user.role === "admin" ? "Administrador" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.plan === "Business"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              : user.plan === "Pro"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {user.plan || "Starter"}
                        </Badge>
                      </TableCell>
                      <TableCell title={`Atualizado em: ${formatDate(user.updatedAt)}`}>
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(user)}
                          disabled={!user.isActive}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* User Form Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? "Edite os detalhes do usuário abaixo."
                  : "Preencha os detalhes para criar um novo usuário."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {selectedUser ? "Nova Senha (deixe em branco para manter a atual)" : "Senha"}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!selectedUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!selectedUser || !!formData.password}
                />
              </div>
              {/* Campo de seleção de plano */}
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  name="role"
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select
                  name="plan"
                  value={formData.plan}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, plan: value }))}
                  disabled={formData.role === "admin"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
                {formData.role === "admin" && (
                  <p className="text-xs text-muted-foreground mt-1">Administradores não possuem planos atribuídos</p>
                )}
              </div>
              {selectedUser && (
                <div className="flex items-center space-x-2">
                  <Switch id="user-active" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                  <Label htmlFor="user-active">Usuário ativo</Label>
                </div>
              )}
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar o usuário {selectedUser?.name}? O usuário não poderá mais acessar o
                sistema, mas seus dados serão mantidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivateUser} className="bg-destructive text-destructive-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  "Desativar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
