import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Code, Copy, ExternalLink } from "lucide-react"

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link href="/integrations">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Integrações
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Documentação da API</h1>
              <p className="text-muted-foreground mt-2">
                Guia completo para utilizar as APIs do Mini CRM em suas integrações
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="authentication">Autenticação</TabsTrigger>
              <TabsTrigger value="contacts">Contatos</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Introdução às APIs do Mini CRM</CardTitle>
                    <CardDescription>
                      As APIs do Mini CRM permitem que você integre seus sistemas e aplicações com nossa plataforma.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Nossa API RESTful fornece acesso programático aos dados e funcionalidades do Mini CRM, permitindo
                      que você:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Gerencie contatos e leads</li>
                      <li>Configure e monitore webhooks</li>
                      <li>Acesse dados de dashboard e relatórios</li>
                      <li>Gerencie usuários e permissões</li>
                    </ul>
                    <p>
                      Todas as requisições devem ser feitas via HTTPS e os dados são enviados e recebidos em formato
                      JSON.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium">URL Base</p>
                      <div className="flex items-center mt-2">
                        <code className="bg-background p-2 rounded text-sm font-mono flex-1">
                          https://seu-dominio.com/api
                        </code>
                        <Button variant="ghost" size="icon" className="ml-2">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Começando</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">1. Autenticação</h3>
                        <p className="text-sm text-muted-foreground">
                          Obtenha seu token de autenticação para acessar as APIs.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">2. Explore as APIs</h3>
                        <p className="text-sm text-muted-foreground">
                          Conheça os endpoints disponíveis e seus parâmetros.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">3. Teste as Requisições</h3>
                        <p className="text-sm text-muted-foreground">
                          Use ferramentas como Postman ou cURL para testar as APIs.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">4. Implemente em seu Sistema</h3>
                        <p className="text-sm text-muted-foreground">Integre as APIs em seu sistema ou aplicação.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recursos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/docs/api/examples">
                          <Code className="mr-2 h-4 w-4" />
                          Exemplos de Código
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/docs/api/postman">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Coleção Postman
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/docs/api/changelog">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Histórico de Mudanças
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="authentication">
              <Card>
                <CardHeader>
                  <CardTitle>Autenticação</CardTitle>
                  <CardDescription>
                    Todas as requisições à API do Mini CRM requerem autenticação. Existem duas formas de autenticação
                    suportadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação por Cookie de Sessão</h3>
                    <p className="mb-4">
                      Se você estiver fazendo requisições a partir do navegador onde o usuário já está autenticado, o
                      cookie de sessão será enviado automaticamente.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium mb-2">Exemplo de requisição com cookie de sessão:</p>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`fetch('/api/contacts', {
  method: 'GET',
  credentials: 'include' // Importante para incluir cookies
})`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação por Token JWT</h3>
                    <p className="mb-4">
                      Para aplicações que não têm acesso ao cookie de sessão, você pode usar um token JWT no cabeçalho
                      Authorization.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium mb-2">Exemplo de requisição com token JWT:</p>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`fetch('/api/contacts', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer seu-token-jwt'
  }
})`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Obtendo um Token JWT</h3>
                    <p className="mb-4">Você pode obter um token JWT fazendo login através da API de autenticação:</p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium mb-2">Requisição de login:</p>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'seu-email@exemplo.com',
    password: 'sua-senha'
  })
})`}</pre>
                      </div>
                      <p className="font-medium mt-4 mb-2">Resposta:</p>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cl9z3j5f0000456def789ghi",
    "name": "Usuário Exemplo",
    "email": "seu-email@exemplo.com"
  }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Dica de Segurança</h3>
                    <p className="text-blue-700 dark:text-blue-400">
                      Mantenha seus tokens seguros e nunca compartilhe-os em código público ou repositórios. Defina
                      tempos de expiração adequados para seus tokens e revogue-os quando não forem mais necessários.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>API de Contatos</CardTitle>
                  <CardDescription>Gerencie contatos e leads através da API de Contatos do Mini CRM.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            >
                              GET
                            </Badge>
                            <code className="font-mono">/api/contacts</code>
                          </div>
                          <Badge variant="outline">Requer Autenticação</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">Lista todos os contatos</p>
                      </div>
                      <div className="p-4 bg-muted/50">
                        <h4 className="font-medium mb-2">Parâmetros de Consulta</h4>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="font-medium">status</div>
                            <div>string</div>
                            <div className="text-muted-foreground">Filtrar por status (ex: "Novo", "Interessado")</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="font-medium">source</div>
                            <div>string</div>
                            <div className="text-muted-foreground">
                              Filtrar por origem (ex: "WhatsApp", "Instagram")
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="font-medium">q</div>
                            <div>string</div>
                            <div className="text-muted-foreground">Termo de busca para filtrar contatos</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border-t">
                        <h4 className="font-medium mb-2">Exemplo de Resposta</h4>
                        <div className="bg-background p-3 rounded text-sm font-mono">
                          <pre>{`[
  {
    "id": "cl9z3j5f0000123abc456def",
    "name": "João Silva",
    "contact": "+5511999999999",
    "source": "WhatsApp",
    "status": "Novo",
    "notes": "Cliente interessado em nosso produto premium",
    "createdAt": "2023-05-15T14:30:00.000Z",
    "updatedAt": "2023-05-15T14:30:00.000Z"
  },
  // ... outros contatos
]`}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Outros endpoints de contatos seriam adicionados aqui de forma similar */}
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        Veja a documentação completa para todos os endpoints de contatos.
                      </p>
                      <Button variant="outline" className="mt-2" asChild>
                        <Link href="/docs/api/contacts">Ver Documentação Completa de Contatos</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="webhooks">
              <Card>
                <CardHeader>
                  <CardTitle>API de Webhooks</CardTitle>
                  <CardDescription>
                    Configure e gerencie webhooks para receber notificações de eventos no Mini CRM.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">O que são Webhooks?</h3>
                    <p className="mb-4">
                      Webhooks são callbacks HTTP que são acionados quando determinados eventos ocorrem no Mini CRM.
                      Eles permitem que seu sistema seja notificado em tempo real sobre eventos como a criação de um
                      novo contato ou a mudança de status de um lead.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Eventos Disponíveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mb-2"
                        >
                          contact.created
                        </Badge>
                        <p className="text-sm text-muted-foreground">Disparado quando um novo contato é criado.</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 mb-2"
                        >
                          contact.updated
                        </Badge>
                        <p className="text-sm text-muted-foreground">Disparado quando um contato é atualizado.</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 mb-2"
                        >
                          contact.status_changed
                        </Badge>
                        <p className="text-sm text-muted-foreground">Disparado quando o status de um contato muda.</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 mb-2"
                        >
                          contact.deleted
                        </Badge>
                        <p className="text-sm text-muted-foreground">Disparado quando um contato é excluído.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          >
                            POST
                          </Badge>
                          <code className="font-mono">/api/webhooks</code>
                        </div>
                        <Badge variant="outline">Requer Autenticação</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Cria um novo webhook</p>
                    </div>
                    <div className="p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Corpo da Requisição</h4>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`{
  "name": "Notificação de Novo Contato",
  "url": "https://seu-dominio.com/webhook",
  "events": ["contact.created"],
  "secret": "seu-segredo-opcional",
  "isActive": true
}`}</pre>
                      </div>
                    </div>
                    <div className="p-4 border-t">
                      <h4 className="font-medium mb-2">Exemplo de Resposta</h4>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`{
  "id": "cl9z3j5f0000abc123def456",
  "name": "Notificação de Novo Contato",
  "url": "https://seu-dominio.com/webhook",
  "events": ["contact.created"],
  "secret": "seu-segredo-opcional",
  "isActive": true,
  "createdAt": "2023-05-10T09:00:00.000Z",
  "updatedAt": "2023-05-10T09:00:00.000Z"
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Veja a documentação completa para todos os endpoints de webhooks.
                    </p>
                    <Button variant="outline" className="mt-2" asChild>
                      <Link href="/docs/api/webhooks">Ver Documentação Completa de Webhooks</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard">
              <Card>
                <CardHeader>
                  <CardTitle>API de Dashboard</CardTitle>
                  <CardDescription>Acesse dados e métricas do dashboard para análise e relatórios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          >
                            GET
                          </Badge>
                          <code className="font-mono">/api/dashboard</code>
                        </div>
                        <Badge variant="outline">Requer Autenticação</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Obtém dados gerais do dashboard</p>
                    </div>
                    <div className="p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Parâmetros de Consulta</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="font-medium">startDate</div>
                          <div>string</div>
                          <div className="text-muted-foreground">Data de início (formato YYYY-MM-DD)</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="font-medium">endDate</div>
                          <div>string</div>
                          <div className="text-muted-foreground">Data de fim (formato YYYY-MM-DD)</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="font-medium">source</div>
                          <div>string</div>
                          <div className="text-muted-foreground">Filtrar por origem (ex: "WhatsApp")</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t">
                      <h4 className="font-medium mb-2">Exemplo de Resposta</h4>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`{
  "statusCounts": {
    "Novo": 15,
    "Conversando": 8,
    "Interessado": 5,
    "Fechado": 3,
    "Perdido": 2
  },
  "sourceCounts": {
    "WhatsApp": 20,
    "Instagram": 10,
    "Outro": 3
  }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Veja a documentação completa para todos os endpoints de dashboard.
                    </p>
                    <Button variant="outline" className="mt-2" asChild>
                      <Link href="/docs/api/dashboard">Ver Documentação Completa de Dashboard</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>API de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie usuários e permissões através da API de Usuários do Mini CRM.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          >
                            GET
                          </Badge>
                          <code className="font-mono">/api/users/me</code>
                        </div>
                        <Badge variant="outline">Requer Autenticação</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Obtém informações do usuário atual</p>
                    </div>
                    <div className="p-4 border-t">
                      <h4 className="font-medium mb-2">Exemplo de Resposta</h4>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`{
  "id": "cl9z3j5f0000456def789ghi",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "theme": "system",
  "notificationSettings": "{\"emailNotifications\":true,\"newContactAlert\":true,\"statusChangeAlert\":true,\"dailySummary\":false}",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-05-15T10:00:00.000Z"
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Veja a documentação completa para todos os endpoints de usuários.
                    </p>
                    <Button variant="outline" className="mt-2" asChild>
                      <Link href="/docs/api/users">Ver Documentação Completa de Usuários</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
