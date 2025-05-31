"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Copy, Server, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface ApiRoute {
  method: string
  path: string
  description: string
  auth: string
  params?: { name: string; type: string; description: string; required: boolean }[]
  queryParams?: { name: string; type: string; description: string; required: boolean }[]
  bodyParams?: { name: string; type: string; description: string; required: boolean }[]
  response: string
  example: string
  responseExample?: string
}

const apiRoutes: Record<string, ApiRoute[]> = {
  admin: [
    {
      method: "GET",
      path: "/api/admin/users",
      description: "Lista todos os usuários ativos e cancelados",
      auth: "Somente Admin",
      queryParams: [
        { name: "includeInactive", type: "boolean", description: "Incluir usuários inativos", required: false },
        { name: "q", type: "string", description: "Busca por nome ou email", required: false },
        { name: "role", type: "string", description: "Filtrar por função (user/admin)", required: false },
        { name: "plan", type: "string", description: "Filtrar por plano (Starter/Pro/Business)", required: false },
        { name: "page", type: "number", description: "Número da página para paginação", required: false },
        { name: "limit", type: "number", description: "Quantidade de itens por página", required: false },
        { name: "sortBy", type: "string", description: "Campo para ordenação", required: false },
        { name: "sortOrder", type: "string", description: "Direção da ordenação (asc/desc)", required: false },
      ],
      response: "Array de usuários com metadados de paginação",
      responseExample: `{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Admin Teste",
      "email": "admin@teste.com",
      "role": "admin",
      "isActive": true,
      "plan": "Business",
      "createdAt": "2023-01-01T10:00:00.000Z",
      "lastLogin": "2023-01-15T08:30:00.000Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Usuário Regular",
      "email": "usuario@teste.com",
      "role": "user",
      "isActive": true,
      "plan": "Pro",
      "createdAt": "2023-01-05T14:20:00.000Z",
      "lastLogin": "2023-01-14T16:45:00.000Z"
    },
    // ...outros usuários
  ],
  "pagination": {
    "total": 45,
    "pages": 5,
    "page": 1,
    "limit": 10
  }
}`,
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/admin/users?includeInactive=true&plan=Pro&limit=10&page=1' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/admin/users/[id]",
      description: "Obtém detalhes de um usuário específico",
      auth: "Somente Admin",
      params: [{ name: "id", type: "string", description: "ID do usuário", required: true }],
      queryParams: [
        { name: "includeTokens", type: "boolean", description: "Incluir tokens do usuário", required: false },
        { name: "includeActivity", type: "boolean", description: "Incluir histórico de atividades", required: false },
      ],
      response: "Detalhes do usuário",
      responseExample: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Usuário Teste",
  "email": "usuario@teste.com",
  "role": "user",
  "isActive": true,
  "plan": "Pro",
  "createdAt": "2023-01-05T14:20:00.000Z",
  "updatedAt": "2023-01-10T09:15:00.000Z",
  "lastLogin": "2023-01-14T16:45:00.000Z",
  "settings": {
    "notifications": true,
    "twoFactorEnabled": false
  },
  "tokens": [
    {
      "id": "abc123",
      "name": "API Token",
      "createdAt": "2023-01-10T09:20:00.000Z",
      "lastUsed": "2023-01-14T10:30:00.000Z",
      "isActive": true
    }
  ],
  "activity": [
    {
      "action": "login",
      "timestamp": "2023-01-14T16:45:00.000Z",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}`,
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/admin/users/123e4567-e89b-12d3-a456-426614174000?includeTokens=true&includeActivity=true' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/admin/tokens",
      description: "Lista todos os tokens ativos por usuário",
      auth: "Somente Admin",
      queryParams: [
        { name: "userId", type: "string", description: "Filtrar por ID do usuário", required: false },
        { name: "isActive", type: "boolean", description: "Filtrar por status de ativação", required: false },
        { name: "page", type: "number", description: "Número da página para paginação", required: false },
        { name: "limit", type: "number", description: "Quantidade de itens por página", required: false },
        { name: "sortBy", type: "string", description: "Campo para ordenação", required: false },
        { name: "sortOrder", type: "string", description: "Direção da ordenação (asc/desc)", required: false },
      ],
      response: "Array de tokens com metadados de paginação",
      responseExample: `{
  "data": [
    {
      "id": "abc123",
      "name": "API Token",
      "createdAt": "2023-01-10T09:20:00.000Z",
      "lastUsed": "2023-01-14T10:30:00.000Z",
      "expiresAt": null,
      "isActive": true,
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Usuário Teste",
        "email": "usuario@teste.com"
      }
    },
    // ...outros tokens
  ],
  "pagination": {
    "total": 25,
    "pages": 3,
    "page": 1,
    "limit": 10
  }
}`,
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/admin/tokens?userId=123e4567-e89b-12d3-a456-426614174000&isActive=true&limit=10' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/admin/users",
      description: "Cria um novo usuário de nível user ou admin",
      auth: "Somente Admin",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do usuário", required: true },
        { name: "email", type: "string", description: "Email do usuário", required: true },
        { name: "password", type: "string", description: "Senha do usuário", required: true },
        { name: "role", type: "string", description: "Nível de acesso (user/admin)", required: false },
        { name: "isActive", type: "boolean", description: "Status do usuário", required: false },
        { name: "plan", type: "string", description: "Plano do usuário (Starter/Pro/Business)", required: false },
        { name: "settings", type: "object", description: "Configurações personalizadas", required: false },
      ],
      response: "Usuário criado",
      responseExample: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Novo Usuário",
  "email": "novo@teste.com",
  "role": "user",
  "isActive": true,
  "plan": "Pro",
  "createdAt": "2023-01-16T10:30:00.000Z"
}`,
      example:
        'curl -X POST \'https://konvertaleads.com.br/api/admin/users\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "name": "Novo Usuário",\n    "email": "novo@teste.com",\n    "password": "senha123",\n    "role": "user",\n    "plan": "Pro",\n    "settings": {\n      "notifications": true\n    }\n  }\'',
    },
    {
      method: "PUT",
      path: "/api/admin/users/[id]",
      description: "Atualiza um usuário específico",
      auth: "Somente Admin",
      params: [{ name: "id", type: "string", description: "ID do usuário", required: true }],
      bodyParams: [
        { name: "name", type: "string", description: "Nome do usuário", required: false },
        { name: "email", type: "string", description: "Email do usuário", required: false },
        { name: "password", type: "string", description: "Nova senha", required: false },
        { name: "role", type: "string", description: "Nível de acesso (user/admin)", required: false },
        { name: "isActive", type: "boolean", description: "Status do usuário", required: false },
        { name: "plan", type: "string", description: "Plano do usuário (Starter/Pro/Business)", required: false },
        { name: "settings", type: "object", description: "Configurações personalizadas", required: false },
      ],
      response: "Usuário atualizado",
      responseExample: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Usuário Atualizado",
  "email": "usuario@teste.com",
  "role": "user",
  "isActive": true,
  "plan": "Business",
  "updatedAt": "2023-01-16T11:45:00.000Z"
}`,
      example:
        'curl -X PUT \'https://konvertaleads.com.br/api/admin/users/123e4567-e89b-12d3-a456-426614174000\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "role": "user",\n    "isActive": true,\n    "plan": "Business"\n  }\'',
    },
    {
      method: "DELETE",
      path: "/api/admin/tokens",
      description: "Revoga todos os tokens ou um token específico",
      auth: "Somente Admin",
      queryParams: [
        { name: "id", type: "string", description: "ID do token específico", required: false },
        {
          name: "userId",
          type: "string",
          description: "ID do usuário para revogar todos os seus tokens",
          required: false,
        },
      ],
      response: "Resultado da operação",
      responseExample: `{
  "success": true,
  "revokedCount": 3,
  "message": "3 tokens foram revogados com sucesso"
}`,
      example:
        "curl -X DELETE 'https://konvertaleads.com.br/api/admin/tokens?userId=123e4567-e89b-12d3-a456-426614174000' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "DELETE",
      path: "/api/admin/users/[id]",
      description: "Desativa um usuário (não remove do banco de dados)",
      auth: "Somente Admin",
      params: [{ name: "id", type: "string", description: "ID do usuário", required: true }],
      response: "Resultado da operação",
      responseExample: `{
  "success": true,
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "isActive": false,
  "message": "Usuário desativado com sucesso"
}`,
      example:
        "curl -X DELETE 'https://konvertaleads.com.br/api/admin/users/123e4567-e89b-12d3-a456-426614174000' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "DELETE",
      path: "/api/admin/users/delete/[id]",
      description: "Remove um usuário permanentemente (remove do banco de dados)",
      auth: "Somente Admin",
      params: [{ name: "id", type: "string", description: "ID do usuário", required: true }],
      response: "Resultado da operação",
      responseExample: `{
  "success": true,
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Usuário removido permanentemente"
}`,
      example:
        "curl -X DELETE 'https://konvertaleads.com.br/api/admin/users/delete/123e4567-e89b-12d3-a456-426614174000' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/admin/stats/users",
      description: "Obtém estatísticas sobre usuários",
      auth: "Somente Admin",
      queryParams: [
        { name: "period", type: "string", description: "Período (day/week/month/year)", required: false },
        { name: "groupBy", type: "string", description: "Agrupar por (role/plan/status)", required: false },
      ],
      response: "Estatísticas de usuários",
      responseExample: `{
  "total": 45,
  "active": 42,
  "inactive": 3,
  "byRole": {
    "admin": 5,
    "user": 40
  },
  "byPlan": {
    "Starter": 25,
    "Pro": 15,
    "Business": 5
  },
  "newUsers": {
    "today": 2,
    "thisWeek": 8,
    "thisMonth": 15
  }
}`,
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/admin/stats/users?period=month&groupBy=plan' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ]
}

export function AdminApiRoutesList() {
  const { toast } = useToast()

  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example)
    toast({
      title: "Exemplo copiado",
      description: "O comando foi copiado para a área de transferência.",
    })
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "POST":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "PUT":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getAuthBadge = (auth: string) => {
    if (auth.includes("Admin")) {
      return (
        <Badge
          variant="outline"
          className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 flex items-center gap-1"
        >
          <Lock className="h-3 w-3" /> {auth}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        {auth}
      </Badge>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Server className="h-5 w-5" />
          Documentação da API
        </CardTitle>
        <CardDescription>
          Documentação completa das rotas disponíveis para integração com a API do sistema.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="admin">
          <TabsList className="mb-4 overflow-x-auto">
            <TabsTrigger value="admin" className="whitespace-nowrap">Admin</TabsTrigger>
          </TabsList>

          {Object.entries(apiRoutes).map(([key, routes]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {routes.map((route, index) => (
                  <AccordionItem key={index} value={`${key}-${index}`}>
                    <AccordionTrigger className="flex items-start gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-left">
                        <div className="flex flex-wrap sm:flex-nowrap items-start gap-2">
                          <Badge className={getMethodColor(route.method)}>{route.method}</Badge>
                          <span className="font-mono text-sm break-all">{route.path}</span>
                          {getAuthBadge(route.auth)}
                        </div>
                        <span className="text-muted-foreground text-sm">{route.description}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2 sm:p-4">
                        {route.params && (
                          <div>
                            <h4 className="font-medium mb-2">Parâmetros de URL</h4>
                            <ul className="space-y-2">
                              {route.params.map((param, i) => (
                                <li key={i} className="text-sm break-words">
                                  <span className="font-mono">{param.name}</span>
                                  <span className="text-muted-foreground"> ({param.type})</span>
                                  {param.required && <span className="text-red-500 ml-1">*</span>}
                                  <span className="block text-muted-foreground">{param.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {route.queryParams?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Parâmetros de Query</h4>
                            <ul className="space-y-2">
                              {route.queryParams.map((param, i) => (
                                <li key={i} className="text-sm break-words">
                                  <span className="font-mono">{param.name}</span>
                                  <span className="text-muted-foreground"> ({param.type})</span>
                                  {param.required && <span className="text-red-500 ml-1">*</span>}
                                  <span className="block text-muted-foreground">{param.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {route.bodyParams?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Parâmetros do Body</h4>
                            <ul className="space-y-2">
                              {route.bodyParams.map((param, i) => (
                                <li key={i} className="text-sm break-words">
                                  <span className="font-mono">{param.name}</span>
                                  <span className="text-muted-foreground"> ({param.type})</span>
                                  {param.required && <span className="text-red-500 ml-1">*</span>}
                                  <span className="block text-muted-foreground">{param.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium mb-2">Resposta</h4>
                          <p className="text-sm text-muted-foreground">{route.response}</p>

                          {route.responseExample && (
                            <div className="relative mt-2">
                              <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                                <code>{route.responseExample}</code>
                              </pre>
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Exemplo</h4>
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                              <code>{route.example}</code>
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => copyExample(route.example)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>

  )
}
