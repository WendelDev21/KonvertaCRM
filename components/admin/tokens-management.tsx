"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Loader2, Search, Trash2, Check, Key, User } from "lucide-react"

interface UserType {
  id: string
  name: string
  email: string
}

interface Token {
  id: string
  name: string
  createdAt: string
  lastUsed: string | null
  expiresAt: string | null
  isActive: boolean
  userId: string
  user: UserType
}

export function AdminTokensManagement() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [isRevokeAllDialogOpen, setIsRevokeAllDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Fetch tokens
  const fetchTokens = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/tokens")
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`)
      }
      const data = await response.json()

      // Filtrar os tokens com base na busca
      const filteredData = searchQuery
        ? data.filter(
            (token: Token) =>
              token.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              token.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : data

      setTokens(filteredData)
    } catch (error) {
      console.error("Error fetching tokens:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tokens. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  // Para filtrar tokens sem fazer nova requisição
  useEffect(() => {
    if (tokens.length > 0 && searchQuery) {
      fetchTokens()
    }
  }, [searchQuery])

  const handleOpenRevokeDialog = (token: Token) => {
    setSelectedToken(token)
    setIsRevokeDialogOpen(true)
  }

  const handleOpenRevokeAllDialog = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setIsRevokeAllDialogOpen(true)
  }

  const handleRevokeToken = async () => {
    if (!selectedToken) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/tokens?id=${selectedToken.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao revogar token")
      }

      toast({
        title: "Sucesso",
        description: "Token revogado com sucesso",
      })

      // Refresh tokens list
      fetchTokens()
      setIsRevokeDialogOpen(false)
    } catch (error) {
      console.error("Error revoking token:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao revogar token",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeAllTokens = async () => {
    if (!selectedUserId) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/tokens?userId=${selectedUserId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao revogar tokens")
      }

      toast({
        title: "Sucesso",
        description: "Todos os tokens do usuário foram revogados",
      })

      // Refresh tokens list
      fetchTokens()
      setIsRevokeAllDialogOpen(false)
    } catch (error) {
      console.error("Error revoking all tokens:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao revogar tokens",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Agrupar tokens por usuário
  const getUsersWithTokens = () => {
    const userMap = new Map<string, { user: UserType; tokens: Token[] }>()

    tokens.forEach((token) => {
      if (!userMap.has(token.userId)) {
        userMap.set(token.userId, {
          user: token.user,
          tokens: [],
        })
      }
      userMap.get(token.userId)?.tokens.push(token)
    })

    return Array.from(userMap.values())
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Tokens</CardTitle>
        <CardDescription>Visualize e gerencie tokens de API de todos os usuários.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por usuário..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading && tokens.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando tokens...</span>
          </div>
        ) : getUsersWithTokens().length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum token encontrado</div>
        ) : (
          <div className="space-y-8">
            {getUsersWithTokens().map(({ user, tokens }) => (
              <div key={user.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium">{user.name}</h3>
                    <span className="text-sm text-muted-foreground">({user.email})</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleOpenRevokeAllDialog(user.id, user.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revogar todos
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Último uso</TableHead>
                        <TableHead>Expiração</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Ativo
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              {token.name || "API Token"}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(token.createdAt)}</TableCell>
                          <TableCell>{formatDate(token.lastUsed)}</TableCell>
                          <TableCell>{token.expiresAt ? formatDate(token.expiresAt) : "Sem expiração"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenRevokeDialog(token)}
                              className="hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revoke Token Dialog */}
        <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revogar Token</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja revogar este token? Esta ação não pode ser desfeita e qualquer aplicação que
                estiver usando este token perderá o acesso à API.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevokeToken} className="bg-destructive text-destructive-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revogando...
                  </>
                ) : (
                  "Revogar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Revoke All Tokens Dialog */}
        <AlertDialog open={isRevokeAllDialogOpen} onOpenChange={setIsRevokeAllDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revogar Todos os Tokens</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja revogar todos os tokens deste usuário? Esta ação não pode ser desfeita e todas as
                aplicações que estiverem usando estes tokens perderão o acesso à API.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevokeAllTokens} className="bg-destructive text-destructive-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revogando...
                  </>
                ) : (
                  "Revogar Todos"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
