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
        { name: "page", type: "number", description: "Número da página para paginação", required: false },
        { name: "limit", type: "number", description: "Quantidade de itens por página", required: false },
        { name: "sortBy", type: "string", description: "Campo para ordenação", required: false },
        { name: "sortOrder", type: "string", description: "Direção da ordenação (asc/desc)", required: false },
      ],
      response: "Array de contatos com metadados de paginação",
      responseExample: `{
  "data": [
    {
      "id": "8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f",
      "name": "João Silva",
      "contact": "joao@email.com",
      "source": "site",
      "status": "lead",
      "notes": "Interessado em nossos serviços",
      "createdAt": "2023-01-15T14:30:00.000Z",
      "updatedAt": "2023-01-15T14:30:00.000Z"
    },
    // ...outros contatos
  ],
  "pagination": {
    "total": 125,
    "pages": 13,
    "page": 1,
    "limit": 10
  }
}`,
      example:
        "curl -X GET 'https://seu-dominio.com/api/contacts?status=lead&limit=10&page=1&sortBy=createdAt&sortOrder=desc' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/contacts/[id]",
      description: "Obtém detalhes de um contato específico",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      response: "Detalhes do contato",
      responseExample: `{
  "id": "8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f",
  "name": "João Silva",
  "contact": "joao@email.com",
  "source": "site",
  "status": "lead",
  "notes": "Interessado em nossos serviços",
  "createdAt": "2023-01-15T14:30:00.000Z",
  "updatedAt": "2023-01-15T14:30:00.000Z",
  "history": [
    {
      "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "action": "status_changed",
      "from": "prospect",
      "to": "lead",
      "createdAt": "2023-01-14T10:15:00.000Z",
      "userId": "abc123"
    }
  ]
}`,
      example:
        "curl -X GET 'https://seu-dominio.com/api/contacts/8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f' -H 'Authorization: Bearer seu_token_aqui'",
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
        { name: "tags", type: "string[]", description: "Tags para categorização", required: false },
        { name: "customFields", type: "object", description: "Campos personalizados", required: false },
      ],
      response: "Contato criado",
      responseExample: `{
  "id": "8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f",
  "name": "João Silva",
  "contact": "joao@email.com",
  "source": "site",
  "status": "lead",
  "notes": "Interessado em nossos serviços",
  "createdAt": "2023-01-15T14:30:00.000Z",
  "updatedAt": "2023-01-15T14:30:00.000Z"
}`,
      example:
        'curl -X POST \'https://seu-dominio.com/api/contacts\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "name": "João Silva",\n    "contact": "joao@email.com",\n    "source": "site",\n    "status": "lead",\n    "notes": "Interessado em nossos serviços",\n    "tags": ["premium", "website"]\n  }\'',
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
        { name: "tags", type: "string[]", description: "Tags para categorização", required: false },
        { name: "customFields", type: "object", description: "Campos personalizados", required: false },
      ],
      response: "Contato atualizado",
      responseExample: `{
  "id": "8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f",
  "name": "João Silva",
  "contact": "joao@email.com",
  "source": "site",
  "status": "cliente",
  "notes": "Convertido em cliente",
  "updatedAt": "2023-01-16T10:25:00.000Z"
}`,
      example:
        "curl -X PUT 'https://seu-dominio.com/api/contacts/8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\n    \"status\": \"cliente\",\n    \"notes\": \"Convertido em cliente\"\n  }'",
    },
    {
      method: "DELETE",
      path: "/api/contacts/[id]",
      description: "Remove um contato",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do contato", required: true }],
      response: "{ success: true, id: string }",
      responseExample: `{
  "success": true,
  "id": "8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f"
}`,
      example:
        "curl -X DELETE 'https://seu-dominio.com/api/contacts/8f7d6c5e-4b3a-2c1d-0e9f-8a7b6c5d4e3f' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "GET",
      path: "/api/contacts/sources",
      description: "Lista todas as origens de contatos disponíveis",
      auth: "Usuário autenticado",
      response: "Array de origens",
      responseExample: `[
  "site",
  "indicação",
  "google",
  "redes sociais",
  "evento"
]`,
      example: "curl -X GET 'https://seu-dominio.com/api/contacts/sources' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  webhooks: [
    {
      method: "GET",
      path: "/api/webhooks",
      description: "Lista todos os webhooks configurados",
      auth: "Usuário autenticado",
      queryParams: [
        { name: "page", type: "number", description: "Número da página para paginação", required: false },
        { name: "limit", type: "number", description: "Quantidade de itens por página", required: false },
        { name: "active", type: "boolean", description: "Filtrar por status de ativação", required: false },
        { name: "event", type: "string", description: "Filtrar por tipo de evento", required: false },
      ],
      response: "Array de webhooks",
      responseExample: `{
  "data": [
    {
      "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "name": "Meu Webhook",
      "url": "https://meu-site.com/webhook",
      "events": ["contact.created", "contact.updated"],
      "secret": "sha256:abc123...",
      "active": true,
      "createdAt": "2023-01-10T09:20:00.000Z",
      "lastTriggered": "2023-01-15T14:30:00.000Z"
    },
    // ...outros webhooks
  ],
  "pagination": {
    "total": 8,
    "pages": 1,
    "page": 1,
    "limit": 10
  }
}`,
      example:
        "curl -X GET 'https://seu-dominio.com/api/webhooks?active=true&event=contact.created' -H 'Authorization: Bearer seu_token_aqui'",
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
        { name: "page", type: "number", description: "Página de logs a retornar", required: false },
      ],
      response: "Detalhes do webhook",
      responseExample: `{
  "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
  "name": "Meu Webhook",
  "url": "https://meu-site.com/webhook",
  "events": ["contact.created", "contact.updated"],
  "secret": "sha256:abc123...",
  "active": true,
  "createdAt": "2023-01-10T09:20:00.000Z",
  "lastTriggered": "2023-01-15T14:30:00.000Z",
  "logs": [
    {
      "id": "9i8u7y6t-5r4e-3w2q-1p0o-9i8u7y6t5r4e",
      "event": "contact.created",
      "status": "success",
      "statusCode": 200,
      "requestBody": "{...}",
      "responseBody": "{\"success\":true}",
      "createdAt": "2023-01-15T14:30:00.000Z"
    },
    // ...outros logs
  ],
  "pagination": {
    "total": 15,
    "pages": 2,
    "page": 1,
    "limit": 10
  }
}`,
      example:
        "curl -X GET 'https://seu-dominio.com/api/webhooks/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p?logs=true&limit=10&page=1' -H 'Authorization: Bearer seu_token_aqui'",
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
        { name: "active", type: "boolean", description: "Status de ativação do webhook", required: false },
        { name: "headers", type: "object", description: "Cabeçalhos HTTP personalizados", required: false },
      ],
      response: "Webhook criado",
      responseExample: `{
  "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
  "name": "Meu Webhook",
  "url": "https://meu-site.com/webhook",
  "events": ["contact.created", "contact.updated"],
  "secret": "sha256:abc123...",
  "active": true,
  "createdAt": "2023-01-10T09:20:00.000Z"
}`,
      example:
        'curl -X POST \'https://seu-dominio.com/api/webhooks\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "name": "Meu Webhook",\n    "url": "https://meu-site.com/webhook",\n    "events": ["contact.created", "contact.updated"],\n    "active": true,\n    "headers": {\n      "x-custom-header": "custom-value"\n    }\n  }\'',
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
        { name: "active", type: "boolean", description: "Status de ativação do webhook", required: false },
        { name: "headers", type: "object", description: "Cabeçalhos HTTP personalizados", required: false },
      ],
      response: "Webhook atualizado",
      responseExample: `{
  "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
  "name": "Webhook Atualizado",
  "url": "https://meu-site.com/webhook",
  "events": ["contact.created", "all"],
  "secret": "sha256:xyz789...",
  "active": true,
  "updatedAt": "2023-01-16T11:05:00.000Z"
}`,
      example:
        'curl -X PUT \'https://seu-dominio.com/api/webhooks/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "name": "Webhook Atualizado",\n    "events": ["contact.created", "all"],\n    "active": true\n  }\'',
    },
    {
      method: "DELETE",
      path: "/api/webhooks/[id]",
      description: "Remove um webhook",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      response: "{ success: true, id: string }",
      responseExample: `{
  "success": true,
  "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
}`,
      example:
        "curl -X DELETE 'https://seu-dominio.com/api/webhooks/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/webhooks/test/[id]",
      description: "Testa um webhook enviando um evento simulado",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do webhook", required: true }],
      bodyParams: [
        { name: "event", type: "string", description: "Tipo de evento a simular", required: true },
        { name: "payload", type: "object", description: "Dados do evento a enviar", required: false },
      ],
      response: "Resultado do teste",
      responseExample: `{
  "success": true,
  "statusCode": 200,
  "responseBody": "{\"received\":true}",
  "duration": 280,
  "timestamp": "2023-01-16T11:20:00.000Z"
}`,
      example:
        'curl -X POST \'https://seu-dominio.com/api/webhooks/test/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "event": "contact.created",\n    "payload": {\n      "id": "test-123",\n      "name": "Contato de Teste"\n    }\n  }\'',
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
        "curl -X GET 'https://seu-dominio.com/api/admin/users?includeInactive=true&plan=Pro&limit=10&page=1' -H 'Authorization: Bearer seu_token_aqui'",
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
        "curl -X GET 'https://seu-dominio.com/api/admin/users/123e4567-e89b-12d3-a456-426614174000?includeTokens=true&includeActivity=true' -H 'Authorization: Bearer seu_token_aqui'",
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
        "curl -X GET 'https://seu-dominio.com/api/admin/tokens?userId=123e4567-e89b-12d3-a456-426614174000&isActive=true&limit=10' -H 'Authorization: Bearer seu_token_aqui'",
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
        'curl -X POST \'https://seu-dominio.com/api/admin/users\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "name": "Novo Usuário",\n    "email": "novo@teste.com",\n    "password": "senha123",\n    "role": "user",\n    "plan": "Pro",\n    "settings": {\n      "notifications": true\n    }\n  }\'',
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
        'curl -X PUT \'https://seu-dominio.com/api/admin/users/123e4567-e89b-12d3-a456-426614174000\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "role": "user",\n    "isActive": true,\n    "plan": "Business"\n  }\'',
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
        "curl -X DELETE 'https://seu-dominio.com/api/admin/tokens?userId=123e4567-e89b-12d3-a456-426614174000' -H 'Authorization: Bearer seu_token_aqui'",
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
        "curl -X DELETE 'https://seu-dominio.com/api/admin/users/123e4567-e89b-12d3-a456-426614174000' -H 'Authorization: Bearer seu_token_aqui'",
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
        "curl -X DELETE 'https://seu-dominio.com/api/admin/users/delete/123e4567-e89b-12d3-a456-426614174000' -H 'Authorization: Bearer seu_token_aqui'",
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
        "curl -X GET 'https://seu-dominio.com/api/admin/stats/users?period=month&groupBy=plan' -H 'Authorization: Bearer seu_token_aqui'",
    },
  ],
  tokens: [
    {
      method: "GET",
      path: "/api/tokens",
      description: "Lista tokens de API do usuário atual",
      auth: "Usuário autenticado",
      queryParams: [
        { name: "isActive", type: "boolean", description: "Filtrar por status de ativação", required: false },
        { name: "page", type: "number", description: "Número da página para paginação", required: false },
        { name: "limit", type: "number", description: "Quantidade de itens por página", required: false },
      ],
      response: "Array de tokens",
      responseExample: `{
  "data": [
    {
      "id": "abc123",
      "name": "Meu API Token",
      "createdAt": "2023-01-10T09:20:00.000Z",
      "lastUsed": "2023-01-14T10:30:00.000Z",
      "expiresAt": null,
      "isActive": true
    },
    // ...outros tokens
  ],
  "pagination": {
    "total": 3,
    "pages": 1,
    "page": 1,
    "limit": 10
  }
}`,
      example:
        "curl -X GET 'https://seu-dominio.com/api/tokens?isActive=true' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "POST",
      path: "/api/tokens",
      description: "Gera um novo token de API para o usuário atual",
      auth: "Usuário autenticado",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do token", required: true },
        { name: "expiresAt", type: "string", description: "Data de expiração (ISO format)", required: false },
        { name: "permissions", type: "string", description: "Permissões do token", required: false },
      ],
      response: "Token criado",
      responseExample: `{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": "abc123",
  "name": "Meu API Token",
  "createdAt": "2023-01-16T12:30:00.000Z",
  "expiresAt": "2024-01-16T12:30:00.000Z",
  "isActive": true
}`,
      example:
        "curl -X POST 'https://seu-dominio.com/api/tokens' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\n    \"name\": \"Meu API Token\",\n    \"expiresAt\": \"2024-01-16T12:30:00.000Z\"\n  }'",
    },
    {
      method: "DELETE",
      path: "/api/tokens/[id]",
      description: "Revoga um token específico do usuário atual",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do token", required: true }],
      response: "Resultado da operação",
      responseExample: `{
  "success": true,
  "id": "abc123",
  "message": "Token revogado com sucesso"
}`,
      example: "curl -X DELETE 'https://seu-dominio.com/api/tokens/abc123' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "PUT",
      path: "/api/tokens/[id]",
      description: "Atualiza um token existente do usuário atual",
      auth: "Usuário autenticado",
      params: [{ name: "id", type: "string", description: "ID do token", required: true }],
      bodyParams: [
        { name: "name", type: "string", description: "Nome do token", required: false },
        { name: "isActive", type: "boolean", description: "Status de ativação do token", required: false },
        { name: "expiresAt", type: "string", description: "Nova data de expiração (ISO format)", required: false },
      ],
      response: "Token atualizado",
      responseExample: `{
  "id": "abc123",
  "name": "Token Renomeado",
  "isActive": true,
  "expiresAt": "2024-06-16T12:30:00.000Z",
  "updatedAt": "2023-01-16T14:15:00.000Z"
}`,
      example:
        "curl -X PUT 'https://seu-dominio.com/api/tokens/abc123' \\\n  -H 'Authorization: Bearer seu_token_aqui' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\n    \"name\": \"Token Renomeado\",\n    \"expiresAt\": \"2024-06-16T12:30:00.000Z\"\n  }'",
    },
  ],
  users: [
    {
      method: "GET",
      path: "/api/users/me",
      description: "Obtém os dados do usuário atual",
      auth: "Usuário autenticado",
      queryParams: [
        { name: "includeSettings", type: "boolean", description: "Incluir configurações do usuário", required: false },
      ],
      response: "Dados do usuário atual",
      responseExample: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Usuário Atual",
  "email": "usuario@teste.com",
  "role": "user",
  "plan": "Pro",
  "createdAt": "2023-01-05T14:20:00.000Z",
  "lastLogin": "2023-01-16T09:45:00.000Z",
  "settings": {
    "notifications": true,
    "theme": "dark"
  },
  "limits": {
    "contacts": 5000,
    "webhooks": 10,
    "apiRequests": {
      "daily": 10000,
      "remaining": 9850
    }
  }
}`,
      example:
        "curl -X GET 'https://seu-dominio.com/api/users/me?includeSettings=true' -H 'Authorization: Bearer seu_token_aqui'",
    },
    {
      method: "PUT",
      path: "/api/users/me",
      description: "Atualiza os dados do usuário atual",
      auth: "Usuário autenticado",
      bodyParams: [
        { name: "name", type: "string", description: "Nome do usuário", required: false },
        { name: "email", type: "string", description: "Email do usuário", required: false },
        { name: "password", type: "string", description: "Nova senha", required: false },
        {
          name: "currentPassword",
          type: "string",
          description: "Senha atual (necessária para alterar senha ou email)",
          required: false,
        },
        { name: "settings", type: "object", description: "Configurações personalizadas", required: false },
      ],
      response: "Usuário atualizado",
      responseExample: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Nome Atualizado",
  "email": "usuario@teste.com",
  "updatedAt": "2023-01-16T15:20:00.000Z"
}`,
      example:
        'curl -X PUT \'https://seu-dominio.com/api/users/me\' \\\n  -H \'Authorization: Bearer seu_token_aqui\' \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{\n    "name": "Nome Atualizado",\n    "settings": {\n      "theme": "light"\n    }\n  }\'',
    }
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
            <TabsTrigger value="users">Usuários</TabsTrigger>
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

                        {route.queryParams && route.queryParams.length > 0 && (
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

                        {route.bodyParams && route.bodyParams.length > 0 && (
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
