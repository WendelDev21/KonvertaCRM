"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Settings, Shield, Database } from "lucide-react"

export function AdminDashboard() {
  const [userCount, setUserCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserCount() {
      try {
        const response = await fetch("/api/users")
        if (response.ok) {
          const users = await response.json()
          setUserCount(users.length)
        }
      } catch (error) {
        console.error("Erro ao buscar contagem de usuários:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCount()
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Carregando..." : userCount !== null ? userCount : "Erro"}
                </div>
                <p className="text-xs text-muted-foreground">Usuários registrados no sistema</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/admin/users">Gerenciar Usuários</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configurações do Sistema</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Configurações</div>
                <p className="text-xs text-muted-foreground">Gerenciar configurações do sistema</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/admin/settings">Configurações</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permissões</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Permissões</div>
                <p className="text-xs text-muted-foreground">Gerenciar permissões e funções</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/admin/permissions">Permissões</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesso rápido às principais funcionalidades administrativas</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button asChild variant="outline" className="h-auto py-4 justify-start">
                <Link href="/admin/users">
                  <Users className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Gerenciar Usuários</div>
                    <div className="text-xs text-muted-foreground">Adicionar, editar ou remover usuários</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto py-4 justify-start">
                <Link href="/api/seed/admin">
                  <Shield className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Criar Usuário Admin</div>
                    <div className="text-xs text-muted-foreground">Criar ou atualizar o usuário admin padrão</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto py-4 justify-start">
                <Link href="/admin/database">
                  <Database className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Banco de Dados</div>
                    <div className="text-xs text-muted-foreground">Gerenciar banco de dados</div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Gerencie os usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/users">Ir para Gerenciamento de Usuários</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Gerencie as configurações do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Esta seção está em desenvolvimento.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
