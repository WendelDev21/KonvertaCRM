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
}

const apiRoutes: Record<string, ApiRoute[]> = {
  contacts: [
    {
      method: "GET",
      path: "/api/contacts",
      description: "Lista todos os contatos",
      auth: "Usuário autenticado",
      queryParams: [
        { name: "status", type: "string", description: "Filtrar por status", required: false },
        { name: "source", type: "string", description: "Filtrar por origem", required: false },
        { name: "q", type: "string", description: "Busca por nome, contato ou notas", required: false },
      ],
      response: "Array de contatos",
      example:
        "curl -X GET 'https://seu-dominio.com/api/contacts?status=lead' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/contacts/[id]",
      description: "Obtém detalhes de um contato específico",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      response: "Detalhes do contato",
      example: "curl -X GET 'https://seu-dominio.com/api/contacts/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/contacts",
      description: "Cria um novo contato",
      auth: "Usuário autenticado",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do contato", required: true },
        { name: "contact", type: "string", description: "Email ou telefone", required: true },
        { name: "source", type: "string", description: "Origem do contato", required: true },
        { name: "status", type: "string", description: "Status do contato", required: true },
        { name: "notes", type: "string", description: "Observações", required: false },
      ],
      response: "Contato criado",
      example:
        'curl -X POST \'https://seu-dominio.com/api/contacts\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"name":"João Silva","contact":"joao@email.com","source":"site","status":"lead"}\'',
    },
    {
      method: "PUT",
      path: "/api/contacts/[id]",
      description: "Atualiza um contato existente",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      bodyParams: [
        { name: "name", type: "string", description: "Nome do contato", required: false },
        { name: "contact", type: "string", description: "Email ou telefone", required: false },
        { name: "source", type: "string", description: "Origem do contato", required: false },
        { name: "status", type: "string", description: "Status do contato", required: false },
        { name: "notes", type: "string", description: "Observações", required: false },
      ],
      response: "Contato atualizado",
      example:
        "curl -X PUT 'https://seu-dominio.com/api/contacts/123456' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"status\":\"cliente\"}'",
    },
    {
      method: "DELETE",
      path: "/api/contacts/[id]",
      description: "Remove um contato",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      response: "{ success: true }",
      example: "curl -X DELETE 'https://seu-dominio.com/api/contacts/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  webhooks: [
    {
      method: "GET",
      path: "/api/webhooks",
      description: "Lista todos os webhooks configurados",
      auth: "Usuário autenticado",
      response: "Array de webhooks",
      example: "curl -X GET 'https://seu-dominio.com/api/webhooks' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/webhooks/[id]",
      description: "Obtém detalhes de um webhook específico",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      queryParams: [
        { name: "logs", type: "boolean", description: "Incluir logs do webhook", required: false },
        { name: "limit", type: "number", description: "Limite de logs a retornar", required: false },
      ],
      response: "Detalhes do webhook",
      example:
        "curl -X GET 'https://seu-dominio.com/api/webhooks/123456?logs=true&limit=10' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/webhooks",
      description: "Cria um novo webhook",
      auth: "Usuário autenticado",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do webhook", required: true },
        { name: "url", type: "string", description: "URL do endpoint", required: true },
        { name: "events", type: "array", description: "Eventos a serem notificados", required: true },
        { name: "secret", type: "string", description: "Segredo para assinatura", required: false },
      ],
      response: "Webhook criado",
      example:
        'curl -X POST \'https://seu-dominio.com/api/webhooks\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"name":"Meu Webhook","url":"https://meu-site.com/webhook","events":["contact.created","contact.updated"]}\'',
    },
    {
      method: "PUT",
      path: "/api/webhooks/[id]",
      description: "Atualiza um webhook existente",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      bodyParams: [
        { name: "name", type: "string", description: "Nome do webhook", required: false },
        { name: "url", type: "string", description: "URL do endpoint", required: false },
        { name: "events", type: "array", description: "Eventos a serem notificados", required: false },
        { name: "secret", type: "string", description: "Segredo para assinatura", required: false },
      ],
      response: "Webhook atualizado",
      example:
        'curl -X PUT \'https://seu-dominio.com/api/webhooks/123456\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"name":"Webhook Atualizado","events":["contact.created","all"]}\'',
    },
    {
      method: "DELETE",
      path: "/api/webhooks/[id]",
      description: "Remove um webhook",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      response: "{ success: true }",
      example: "curl -X DELETE 'https://seu-dominio.com/api/webhooks/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  admin: [
    {
      method: "GET",
      path: "/api/admin/users",
      description: "Lista todos os usuários ativos e cancelados",
      auth: "Somente Admin",
      queryParams: [
        { name: "includeInactive", type: "boolean", description: "Incluir usuários inativos", required: false },
        { name: "q", type: "string", description: "Busca por nome ou email", required: false },
      ],
      response: "Array de usuários",
      example:
        "curl -X GET 'https://seu-dominio.com/api/admin/users?includeInactive=true' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/admin/users/[id]",
      description: "Obtém detalhes de um usuário específico",
      auth: "Somente Admin",
      params: [{ name: "id", type: "string", description: "ID do usuário", required: true }],
      response: "Detalhes do usuário",
      example: "curl -X GET 'https://seu-dominio.com/api/admin/users/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/admin/tokens",
      description: "Lista todos os tokens ativos por usuário",
      auth: "Somente Admin",
      queryParams: [{ name: "userId", type: "string", description: "Filtrar por ID do usuário", required: false }],
      response: "Array de tokens",
      example:
        "curl -X GET 'https://seu-dominio.com/api/admin/tokens?userId=123456' -H 'Authorization: Bearer seu_token_aqui'",
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
      ],
      response: "Usuário criado",
      example:
        'curl -X POST \'https://seu-dominio.com/api/admin/users\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"name":"Admin Teste","email":"admin@teste.com","password":"senha123","role":"admin"}\'',
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
      ],
      response: "Usuário atualizado",
      example:
        "curl -X PUT 'https://seu-dominio.com/api/admin/users/123456' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"role\":\"user\",\"isActive\":true}'",
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
      response: "{ success: true, revokedCount: number }",
      example:
        "curl -X DELETE 'https://seu-dominio.com/api/admin/tokens?userId=123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "DELETE",
      path: "/api/admin/users/[id]",
      description: "Desativa um usuário (não remove do banco de dados)",
      auth: "Somente Admin",
      params: [{ name: "id", type: "string", description: "ID do usuário", required: true }],
      response: "{ success: true, id: string, isActive: false }",
      example:
        "curl -X DELETE 'https://seu-dominio.com/api/admin/users/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  tokens: [
    {
      method: "GET",
      path: "/api/tokens",
      description: "Lista tokens de API do usuário atual",
      auth: "Usuário autenticado",
      response: "Array de tokens",
      example: "curl -X GET 'https://seu-dominio.com/api/tokens' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/tokens",
      description: "Gera um novo token de API para o usuário atual",
      auth: "Usuário autenticado",
      response: "{ success: true, token: string }",
      example: "curl -X POST 'https://seu-dominio.com/api/tokens' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Documentação da API
        </CardTitle>
        <CardDescription>
          Documentação completa das rotas disponíveis para integração com a API do sistema.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="admin">
          <TabsList className="mb-4">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          {Object.entries(apiRoutes).map(([key, routes]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {routes.map((route, index) => (
                  <AccordionItem key={index} value={`${key}-${index}`}>
                    <AccordionTrigger className="flex items-start gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-left">
                        <div className="flex items-center gap-2">
                          <Badge className={getMethodColor(route.method)}>{route.method}</Badge>
                          <span className="font-mono text-sm">{route.path}</span>
                          {getAuthBadge(route.auth)}
                        </div>
                        <span className="text-muted-foreground text-sm">{route.description}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-4">
                        {route.params && (
                          <div>
                            <h4 className="font-medium mb-2">Parâmetros de URL</h4>
                            <ul className="space-y-2">
                              {route.params.map((param, i) => (
                                <li key={i} className="text-sm">
                                  <span className="font-mono">{param.name}</span>
                                  <span className="text-muted-foreground"> ({param.type})</span>
                                  {param.required && <span className="text-red-500 ml-1">*</span>}
                                  <span className="block text-muted-foreground">{param.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {route.queryParams && (
                          <div>
                            <h4 className="font-medium mb-2">Parâmetros de Query</h4>
                            <ul className="space-y-2">
                              {route.queryParams.map((param, i) => (
                                <li key={i} className="text-sm">
                                  <span className="font-mono">{param.name}</span>
                                  <span className="text-muted-foreground"> ({param.type})</span>
                                  {param.required && <span className="text-red-500 ml-1">*</span>}
                                  <span className="block text-muted-foreground">{param.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {route.bodyParams && (
                          <div>
                            <h4 className="font-medium mb-2">Parâmetros do Body</h4>
                            <ul className="space-y-2">
                              {route.bodyParams.map((param, i) => (
                                <li key={i} className="text-sm">
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
