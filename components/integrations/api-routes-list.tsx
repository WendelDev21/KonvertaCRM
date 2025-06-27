"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Copy, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface ApiRoute {
  method: string
  path: string
  description: string
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
      queryParams: [
        { name: "status", type: "string", description: "Filtrar por status", required: false },
        { name: "source", type: "string", description: "Filtrar por origem", required: false },
        { name: "value", type: "string", description: "Filtrar por valor", required: false },
        { name: "q", type: "string", description: "Busca por nome, contato ou notas", required: false },
      ],
      response: "Array de contatos",
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/contacts?status=Novo' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/contacts/[id]",
      description: "Obtém detalhes de um contato específico",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      response: "Detalhes do contato",
      example: "curl -X GET 'https://konvertaleads.com.br/api/contacts/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/contacts",
      description: "Cria um novo contato",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do contato", required: true },
        { name: "contact", type: "string", description: "Email ou telefone", required: true },
        { name: "source", type: "string", description: "Origem do contato", required: true },
        { name: "status", type: "string", description: "Status do contato", required: true },
        { name: "value", type: "string", description: "Valor do contato", required: false },
        { name: "notes", type: "string", description: "Observações", required: false },
      ],
      response: "Contato criado",
      example:
        'curl -X POST \'https://konvertaleads.com.br/api/contacts\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"name":"João Silva","contact":"joao@email.com","source":"Outro","status":"Novo", "value":"2000"}\'',
    },
    {
      method: "PUT",
      path: "/api/contacts/[id]",
      description: "Atualiza um contato existente",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      bodyParams: [
        { name: "name", type: "string", description: "Nome do contato", required: false },
        { name: "contact", type: "string", description: "Email ou telefone", required: false },
        { name: "source", type: "string", description: "Origem do contato", required: false },
        { name: "status", type: "string", description: "Status do contato", required: false },
        { name: "value", type: "string", description: "Valor do contato", required: false },
        { name: "notes", type: "string", description: "Observações", required: false },
      ],
      response: "Contato atualizado",
      example:
        "curl -X PUT 'https://konvertaleads.com.br/api/contacts/123456' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"status\":\"Fechado\"}'",
    },
    {
      method: "DELETE",
      path: "/api/contacts/[id]",
      description: "Remove um contato",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      response: "{ success: true }",
      example: "curl -X DELETE 'https://konvertaleads.com.br/api/contacts/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  webhooks: [
    {
      method: "GET",
      path: "/api/webhooks",
      description: "Lista todos os webhooks configurados",
      response: "Array de webhooks",
      example: "curl -X GET 'https://konvertaleads.com.br/api/webhooks' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/webhooks/[id]",
      description: "Obtém detalhes de um webhook específico",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      queryParams: [
        { name: "logs", type: "boolean", description: "Incluir logs do webhook", required: false },
        { name: "limit", type: "number", description: "Limite de logs a retornar", required: false },
      ],
      response: "Detalhes do webhook",
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/webhooks/123456?logs=true&limit=10' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/webhooks",
      description: "Cria um novo webhook",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do webhook", required: true },
        { name: "url", type: "string", description: "URL do endpoint", required: true },
        { name: "events", type: "array", description: "Eventos a serem notificados", required: true },
        { name: "secret", type: "string", description: "Segredo para assinatura", required: false },
      ],
      response: "Webhook criado",
      example:
        'curl -X POST \'https://konvertaleads.com.br/api/webhooks\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"name":"Meu Webhook","url":"https://meu-Outro.com/webhook","events":["contact.created","contact.updated"]}\'',
    },
    {
      method: "PUT",
      path: "/api/webhooks/[id]",
      description: "Atualiza um webhook existente",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      bodyParams: [
        { name: "name", type: "string", description: "Nome do webhook", required: false },
        { name: "url", type: "string", description: "URL do endpoint", required: false },
        { name: "events", type: "array", description: "Eventos a serem notificados", required: false },
        { name: "secret", type: "string", description: "Segredo para assinatura", required: false },
      ],
      response: "Webhook atualizado",
      example:
        'curl -X PUT \'https://konvertaleads.com.br/api/webhooks/123456\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"name":"Webhook Atualizado","events":["contact.created","all"]}\'',
    },
    {
      method: "DELETE",
      path: "/api/webhooks/[id]",
      description: "Remove um webhook",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      response: "{ success: true }",
      example: "curl -X DELETE 'https://konvertaleads.com.br/api/webhooks/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/webhooks/test",
      description: "Testa um webhook",
      bodyParams: [
        { name: "url", type: "string", description: "URL do endpoint", required: true },
        { name: "secret", type: "string", description: "Segredo para assinatura", required: false },
      ],
      response: "Resultado do teste",
      example:
        "curl -X POST 'https://konvertaleads.com.br/api/webhooks/test' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"url\":\"https://meu-Outro.com/webhook\"}'",
    },
  ],
  dashboard: [
    {
      method: "GET",
      path: "/api/dashboard",
      description: "Obtém dados gerais do dashboard",
      queryParams: [
        { name: "period", type: "string", description: "Período (day, week, month, year, all)", required: false },
      ],
      response: "Dados do dashboard",
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/dashboard?period=month' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/dashboard/timeline",
      description: "Obtém dados de timeline para o dashboard",
      queryParams: [
        { name: "period", type: "string", description: "Período (day, week, month, year)", required: false },
        { name: "groupBy", type: "string", description: "Agrupamento (hour, day, week, month)", required: false },
      ],
      response: "Dados de timeline",
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/dashboard/timeline?period=month&groupBy=day' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/dashboard/conversion",
      description: "Obtém taxas de conversão para o dashboard",
      queryParams: [
        { name: "period", type: "string", description: "Período (day, week, month, year)", required: false },
      ],
      response: "Dados de conversão",
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/dashboard/conversion?period=month' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  financial: [
    {
      method: "GET",
      path: "/api/financial",
      description: "Obtém dados financeiros do usuário",
      queryParams: [
        { name: "type", type: "string", description: "Tipo de dados (contacts, summary)", required: false },
      ],
      response: "Dados financeiros",
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/financial?type=summary' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/financial/contacts",
      description: "Obtém contatos financeiros do usuário",
      queryParams: [
        { name: "status", type: "string", description: "Status do contato", required: false },
      ],
      response: "Contatos financeiros",
      example:
        "curl -X GET 'https://konvertaleads.com.br/api/financial/contacts' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  users: [
    {
      method: "GET",
      path: "/api/users/me",
      description: "Obtém informações do usuário atual",
      response: "Dados do usuário",
      example: "curl -X GET 'https://konvertaleads.com.br/api/users/me' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "PUT",
      path: "/api/users/me",
      description: "Atualiza informações do usuário atual",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do usuário", required: false },
        { name: "email", type: "string", description: "Email do usuário", required: false },
        { name: "currentPassword", type: "string", description: "Senha atual", required: false },
        { name: "newPassword", type: "string", description: "Nova senha", required: false },
        { name: "theme", type: "string", description: "Tema (light, dark, system)", required: false },
        { name: "notificationSettings", type: "object", description: "Configurações de notificação", required: false },
      ],
      response: "Usuário atualizado",
      example:
        "curl -X PUT 'https://konvertaleads.com.br/api/users/me' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"Novo Nome\"}'",
    },
  ],
  tokens: [
    {
      method: "GET",
      path: "/api/tokens",
      description: "Lista tokens de API do usuário",
      response: "Array de tokens",
      example: "curl -X GET 'https://konvertaleads.com.br/api/tokens' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/tokens",
      description: "Gera um novo token de API",
      response: "{ token: string }",
      example: "curl -X POST 'https://konvertaleads.com.br/api/tokens' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  reports: [
    {
      method: "GET",
      path: "/api/reports",
      description: "Lista todos os relatórios disponíveis",
      response: "Array de relatórios",
      example: "curl -X GET 'https://konvertaleads.com.br/api/reports' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/reports/last",
      description: "Obtém o último relatório gerado",
      response: "Detalhes do último relatório",
      example: "curl -X GET 'https://konvertaleads.com.br/api/reports/last' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/reports/[id]",
      description: "Obtém detalhes de um relatório específico",
      params: [{ name: "id", type: "string", description: "ID do relatório", required: true }],
      response: "Detalhes do relatório",
      example: "curl -X GET 'https://konvertaleads.com.br/api/reports/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/reports/generate",
      description: "Cria um novo relatório",
      bodyParams: [
        { name: "format", type: "string", description: "Formato do relatório (csv, pdf)", required: true },
        { name: "period", type: "string", description: "Período do relatório (7d, 30d, 90d, 1y, custom)", required: true },
        { name: "startDate", type: "string", description: "Data de início (apenas para período customizado)", required: false },
        { name: "endDate", type: "string", description: "Data de fim (apenas para período customizado)", required: false },
        { name: "includeContacts", type: "boolean", description: "Incluir contatos no relatório", required: false },
        { name: "includeFinancial", type: "boolean", description: "Incluir dados financeiros no relatório", required: false },
      ],
      response: "Relatório criado",
      example:
        "curl -X POST 'https://konvertaleads.com.br/api/reports/generate' \\\n -H 'Authorization: Bearer seu_token_aqui' -H 'Content-Type: application/json' \\\n -d '{\"format\":\"csv\",\"period\":\"30d\",\"includeContacts\":true,\"includeFinancial\":true}'",
    },
    {
      method: "DELETE",
      path: "/api/reports/[id]",
      description: "Remove um relatório específico",
      params: [{ name: "id", type: "string", description: "ID do relatório", required: true }],
      response: "Relatório removido",
      example: "curl -X DELETE 'https://konvertaleads.com.br/api/reports/123456' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
}

export function ApiRoutesList() {
  const [activeTab, setActiveTab] = useState("contacts")
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Rotas da API
        </CardTitle>
        <CardDescription>Documentação das rotas disponíveis para integração com a API.</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="contacts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 max-w-full overflow-x-auto whitespace-nowrap scrollbar-hide no-scrollbar sm:pl-1 pl-32">
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger> 
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {Object.entries(apiRoutes).map(([key, routes]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {routes.map((route, index) => (
                  <AccordionItem key={index} value={`${key}-${index}`}>
                    <AccordionTrigger className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getMethodColor(route.method)}>{route.method}</Badge>
                        <span className="font-mono text-sm">{route.path}</span>
                      </div>
                      <span className="flex-1 text-left ml-4 text-muted-foreground text-sm">{route.description}</span>
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
