"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Pencil, Trash2, Shield, User, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Tipos
interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  plan: string
  createdAt: string
  updatedAt: string
  image?: string
}

export function UsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Form states
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState("user")
  const [formPlan, setFormPlan] = useState("starter")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      setError(null)

      console.log("Buscando usuários...")

      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies de autenticação
      })

      console.log("Status da resposta:", response.status)

      // Se a resposta não for ok, tente obter o texto da resposta primeiro
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`

        try {
          // Tente obter o corpo da resposta como texto primeiro
          const responseText = await response.text()
          console.log("Texto da resposta:", responseText)

          // Se o texto parecer JSON, tente fazer o parse
          if (responseText && (responseText.startsWith("{") || responseText.startsWith("["))) {
            try {
              const errorData = JSON.parse(responseText)
              if (errorData && errorData.error) {
                errorMessage = errorData.error
              }
            } catch (parseError) {
              console.error("Erro ao fazer parse do JSON:", parseError)
            }
          }
        } catch (textError) {
          console.error("Erro ao obter texto da resposta:", textError)
        }

        throw new Error(errorMessage)
      }

      // Se a resposta for ok, tente obter o JSON
      let data
      try {
        const responseText = await response.text()
        console.log("Texto da resposta:", responseText)

        // Se o texto estiver vazio, retorne um array vazio
        if (!responseText.trim()) {
          data = []
        } else {
          data = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.error("Erro ao fazer parse do JSON:", parseError)
        throw new Error("Erro ao processar a resposta do servidor")
      }

      console.log(`Recebidos ${Array.isArray(data) ? data.length : 0} usuários`)

      // Verificar se data é um array
      if (!Array.isArray(data)) {
        console.error("Dados recebidos não são um array:", data)
        setUsers([])
      } else {
        setUsers(data)
      }
    } catch (error: any) {
      console.error("Erro ao buscar usuários:", error)
      setError(error.message || "Não foi possível carregar os usuários")
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os usuários",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormRole("user")
    setFormPlan("starter")
    setSelectedUser(null)
  }

  function handleAddDialogOpen() {
    resetForm()
    setIsAddDialogOpen(true)
  }

  function handleEditUser(user: AdminUser) {
    setSelectedUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormPassword("")
    setFormRole(user.role)
    setFormPlan(user.plan)
    setIsEditDialogOpen(true)
  }

  async function handleAddUser() {
    if (!formName || !formEmail || !formPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          plan: formPlan,
        }),
      })

      // Processar resposta de forma segura
      let errorMessage = `Erro ${response.status}: ${response.statusText}`
      if (!response.ok) {
        try {
          const responseText = await response.text()
          if (responseText && (responseText.startsWith("{") || responseText.startsWith("["))) {
            try {
              const errorData = JSON.parse(responseText)
              if (errorData && errorData.error) {
                errorMessage = errorData.error
              }
            } catch (parseError) {
              console.error("Erro ao fazer parse do JSON:", parseError)
            }
          }
        } catch (textError) {
          console.error("Erro ao obter texto da resposta:", textError)
        }

        throw new Error(errorMessage)
      }

      toast({
        title: "Sucesso",
        description: "Usuário adicionado com sucesso",
      })

      setIsAddDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar usuário",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser || !formName || !formEmail) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const updateData: any = {
        name: formName,
        email: formEmail,
        role: formRole,
        plan: formPlan,
      }

      // Apenas incluir senha se foi fornecida
      if (formPassword) {
        updateData.password = formPassword
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      })

      // Processar resposta de forma segura
      let errorMessage = `Erro ${response.status}: ${response.statusText}`
      if (!response.ok) {
        try {
          const responseText = await response.text()
          if (responseText && (responseText.startsWith("{") || responseText.startsWith("["))) {
            try {
              const errorData = JSON.parse(responseText)
              if (errorData && errorData.error) {
                errorMessage = errorData.error
              }
            } catch (parseError) {
              console.error("Erro ao fazer parse do JSON:", parseError)
            }
          }
        } catch (textError) {
          console.error("Erro ao obter texto da resposta:", textError)
        }

        throw new Error(errorMessage)
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      })

      setIsEditDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      })

      // Processar resposta de forma segura
      let errorMessage = `Erro ${response.status}: ${response.statusText}`
      if (!response.ok) {
        try {
          const responseText = await response.text()
          if (responseText && (responseText.startsWith("{") || responseText.startsWith("["))) {
            try {
              const errorData = JSON.parse(responseText)
              if (errorData && errorData.error) {
                errorMessage = errorData.error
              }
            } catch (parseError) {
              console.error("Erro ao fazer parse do JSON:", parseError)
            }
          }
        } catch (textError) {
          console.error("Erro ao obter texto da resposta:", textError)
        }

        throw new Error(errorMessage)
      }

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      })

      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      })
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  function getRoleBadge(role: string) {
    if (role === "admin") {
      return (
        <Badge variant="default" className="bg-red-500 hover:bg-red-600">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant="outline">
        <User className="h-3 w-3 mr-1" />
        Usuário
      </Badge>
    )
  }

  function getPlanBadge(plan: string) {
    switch (plan) {
      case "business":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Business</Badge>
      case "pro":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Pro</Badge>
      default:
        return <Badge variant="outline">Starter</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Usuários</h2>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddDialogOpen}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>Preencha os campos abaixo para adicionar um novo usuário.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Senha"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plano</Label>
                  <Select value={formPlan} onValueChange={setFormPlan}>
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    "Adicionar Usuário"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Carregando usuários...</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={6} className="text-center py-6">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getPlanBadge(user.plan)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o usuário {user.name}? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize as informações do usuário.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Senha (deixe em branco para manter a atual)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Nova senha"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Função</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-plan">Plano</Label>
              <Select value={formPlan} onValueChange={setFormPlan}>
                <SelectTrigger id="edit-plan">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
