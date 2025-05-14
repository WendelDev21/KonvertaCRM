"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Code, FileJson, Info } from "lucide-react"

type ApiRoute = {
  method: string
  path: string
  description: string
  requiresAuth: boolean
  category: string
}

export function ApiRoutesList() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const apiRoutes: ApiRoute[] = [
    // Contatos
    {
      method: "GET",
      path: "/api/contacts",
      description: "Lista todos os contatos",
      requiresAuth: true,
      category: "contacts",
    },
    {
      method: "GET",
      path: "/api/contacts/[id]",
      description: "Obtém detalhes de um contato específico",
      requiresAuth: true,
      category: "contacts",
    },
    {
      method: "POST",
      path: "/api/contacts",
      description: "Cria um novo contato",
      requiresAuth: true,
      category: "contacts",
    },
    {
      method: "PUT",
      path: "/api/contacts/[id]",
      description: "Atualiza um contato existente",
      requiresAuth: true,
      category: "contacts",
    },
    {
      method: "DELETE",
      path: "/api/contacts/[id]",
      description: "Remove um contato",
      requiresAuth: true,
      category: "contacts",
    },

    // Webhooks
    {
      method: "GET",
      path: "/api/webhooks",
      description: "Lista todos os webhooks configurados",
      requiresAuth: true,
      category: "webhooks",
    },
    {
      method: "GET",
      path: "/api/webhooks/[id]",
      description: "Obtém detalhes de um webhook específico",
      requiresAuth: true,
      category: "webhooks",
    },
    {
      method: "POST",
      path: "/api/webhooks",
      description: "Cria um novo webhook",
      requiresAuth: true,
      category: "webhooks",
    },
    {
      method: "PUT",
      path: "/api/webhooks/[id]",
      description: "Atualiza um webhook existente",
      requiresAuth: true,
      category: "webhooks",
    },
    {
      method: "DELETE",
      path: "/api/webhooks/[id]",
      description: "Remove um webhook",
      requiresAuth: true,
      category: "webhooks",
    },
    {
      method: "POST",
      path: "/api/webhooks/test",
      description: "Testa um webhook",
      requiresAuth: true,
      category: "webhooks",
    },

    // Dashboard
    {
      method: "GET",
      path: "/api/dashboard",
      description: "Obtém dados gerais do dashboard",
      requiresAuth: true,
      category: "dashboard",
    },
    {
      method: "GET",
      path: "/api/dashboard/timeline",
      description: "Obtém dados de timeline para o dashboard",
      requiresAuth: true,
      category: "dashboard",
    },
    {
      method: "GET",
      path: "/api/dashboard/conversion",
      description: "Obtém taxas de conversão para o dashboard",
      requiresAuth: true,
      category: "dashboard",
    },

    // Usuários
    {
      method: "GET",
      path: "/api/users/me",
      description: "Obtém informações do usuário atual",
      requiresAuth: true,
      category: "users",
    },
    {
      method: "PUT",
      path: "/api/users/me",
      description: "Atualiza informações do usuário atual",
      requiresAuth: true,
      category: "users",
    },
    {
      method: "GET",
      path: "/api/users",
      description: "Lista todos os usuários (apenas admin)",
      requiresAuth: true,
      category: "users",
    },
    {
      method: "GET",
      path: "/api/users/[id]",
      description: "Obtém detalhes de um usuário específico",
      requiresAuth: true,
      category: "users",
    },
    {
      method: "PUT",
      path: "/api/users/[id]",
      description: "Atualiza um usuário específico",
      requiresAuth: true,
      category: "users",
    },
    {
      method: "DELETE",
      path: "/api/users/[id]",
      description: "Remove um usuário (apenas admin)",
      requiresAuth: true,
      category: "users",
    },
  ]

  const filteredRoutes =
    selectedCategory === "all" ? apiRoutes : apiRoutes.filter((route) => route.category === selectedCategory)

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "POST":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "PUT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline" asChild className="ml-4">
          <Link href="/docs/api">
            <Info className="mr-2 h-4 w-4" />
            Documentação Completa
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rotas de API</CardTitle>
          <CardDescription>
            Utilize estas rotas para integrar o Konverta com outros sistemas. Todas as rotas requerem autenticação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRoutes.map((route, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-0">
                  <Badge variant="outline" className={getMethodColor(route.method)}>
                    {route.method}
                  </Badge>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{route.path}</code>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                  <span className="text-sm text-muted-foreground">{route.description}</span>
                  {route.requiresAuth && (
                    <Badge variant="outline" className="ml-2">
                      Auth
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-8">
        <div>
          <h3 className="text-lg font-medium">Precisa de mais informações?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Consulte nossa documentação completa para exemplos de uso, parâmetros e respostas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/docs/api/examples">
              <Code className="mr-2 h-4 w-4" />
              Exemplos de Código
            </Link>
          </Button>
          <Button asChild>
            <Link href="/docs/api">
              <FileJson className="mr-2 h-4 w-4" />
              Documentação da API
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
