"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Key,
  Shield,
  ChevronRight,
  Book,
  Webhook,
  LayoutDashboard,
  DollarSign,
  FileText,
  Users,
  KeyRound,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ApiTokenManager } from "@/components/integrations/api-token-manager"

interface ApiRoute {
  id: string
  method: string
  path: string
  title: string
  description: string
  params?: { name: string; type: string; description: string; required: boolean }[]
  queryParams?: { name: string; type: string; description: string; required: boolean }[]
  bodyParams?: { name: string; type: string; description: string; required: boolean }[]
  response: string
  responseExample?: string
  example: string
}

interface Section {
  id: string
  title: string
  icon: any
  routes: ApiRoute[]
}

const sections: Section[] = [
  {
    id: "auth",
    title: "Autenticação",
    icon: Shield,
    routes: [],
  },
  {
    id: "contacts",
    title: "Contatos",
    icon: Phone,
    routes: [
      {
        id: "get-contacts",
        method: "GET",
        path: "/api/contacts",
        title: "Listar Contatos",
        description: "Retorna uma lista de todos os contatos com opções de filtro",
        queryParams: [
          {
            name: "status",
            type: "string",
            description: "Filtrar por status (Novo, Contato, Proposta, Fechado, Perdido)",
            required: false,
          },
          { name: "source", type: "string", description: "Filtrar por origem do contato", required: false },
          { name: "value", type: "string", description: "Filtrar por valor", required: false },
          { name: "q", type: "string", description: "Busca por nome, contato ou notas", required: false },
          { name: "limit", type: "number", description: "Limite de resultados por página", required: false },
          { name: "page", type: "number", description: "Número da página", required: false },
          { name: "sort", type: "string", description: "Ordenação (createdAt, updatedAt, value)", required: false },
          { name: "order", type: "string", description: "Ordem (asc, desc)", required: false },
          { name: "startDate", type: "string", description: "Data de início para filtro", required: false },
          { name: "endDate", type: "string", description: "Data de fim para filtro", required: false },
        ],
        response: "Array de objetos contato",
        responseExample: `[
  {
    "id": "123456",
    "name": "João Silva",
    "contact": "joao@email.com",
    "source": "Outro",
    "status": "Novo",
    "value": "2500.00",
    "notes": "Interessado em consultoria",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/contacts?status=Novo&limit=10' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json'`,
      },
      {
        id: "get-contact",
        method: "GET",
        path: "/api/contacts/[id]",
        title: "Obter Contato",
        description: "Retorna os detalhes de um contato específico",
        params: [{ name: "id", type: "string", description: "ID único do contato", required: true }],
        response: "Objeto contato",
        responseExample: `{
  "id": "123456",
  "name": "João Silva",
  "contact": "joao@email.com",
  "source": "Outro",
  "status": "Novo",
  "value": "2500.00",
  "notes": "Interessado em consultoria",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/contacts/123456' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json'`,
      },
      {
        id: "create-contact",
        method: "POST",
        path: "/api/contacts",
        title: "Criar Contato",
        description: "Cria um novo contato no sistema",
        bodyParams: [
          { name: "name", type: "string", description: "Nome completo do contato", required: true },
          { name: "contact", type: "string", description: "Email ou telefone do contato", required: true },
          {
            name: "source",
            type: "string",
            description: "Origem do contato (Outro, Facebook, Google, etc.)",
            required: true,
          },
          {
            name: "status",
            type: "string",
            description: "Status inicial (Novo, Contato, Proposta, Fechado, Perdido)",
            required: true,
          },
          { name: "value", type: "string", description: "Valor estimado do negócio", required: false },
          { name: "notes", type: "string", description: "Observações sobre o contato", required: false },
        ],
        response: "Objeto contato criado",
        responseExample: `{
  "id": "123456",
  "name": "João Silva",
  "contact": "joao@email.com",
  "source": "Outro",
  "status": "Novo",
  "value": "2500.00",
  "notes": "Interessado em consultoria",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}`,
        example: `curl -X POST 'https://konvertaleads.com.br/api/contacts' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "João Silva",
    "contact": "joao@email.com",
    "source": "Outro",
    "status": "Novo",
    "value": "2500.00",
    "notes": "Interessado em consultoria"
  }'`,
      },
      {
        id: "update-contact",
        method: "PUT",
        path: "/api/contacts/[id]",
        title: "Atualizar Contato",
        description: "Atualiza as informações de um contato existente",
        params: [{ name: "id", type: "string", description: "ID único do contato", required: true }],
        bodyParams: [
          { name: "name", type: "string", description: "Nome completo do contato", required: false },
          { name: "contact", type: "string", description: "Email ou telefone do contato", required: false },
          { name: "source", type: "string", description: "Origem do contato", required: false },
          { name: "status", type: "string", description: "Status do contato", required: false },
          { name: "value", type: "string", description: "Valor estimado do negócio", required: false },
          { name: "notes", type: "string", description: "Observações sobre o contato", required: false },
        ],
        response: "Objeto contato atualizado",
        responseExample: `{
  "id": "123456",
  "name": "João Silva",
  "contact": "joao@email.com",
  "source": "Outro",
  "status": "Fechado",
  "value": "2500.00",
  "notes": "Contrato assinado",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}`,
        example: `curl -X PUT 'https://konvertaleads.com.br/api/contacts/123456' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "status": "Fechado",
    "notes": "Contrato assinado"
  }'`,
      },
      {
        id: "delete-contact",
        method: "DELETE",
        path: "/api/contacts/[id]",
        title: "Excluir Contato",
        description: "Remove um contato do sistema permanentemente",
        params: [{ name: "id", type: "string", description: "ID único do contato", required: true }],
        response: "Confirmação de exclusão",
        responseExample: `{
  "success": true,
  "message": "Contato excluído com sucesso"
}`,
        example: `curl -X DELETE 'https://konvertaleads.com.br/api/contacts/123456' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
    ],
  },
  {
    id: "webhooks",
    title: "Webhooks",
    icon: Webhook,
    routes: [
      {
        id: "get-webhooks",
        method: "GET",
        path: "/api/webhooks",
        title: "Listar Webhooks",
        description: "Retorna todos os webhooks configurados",
        response: "Array de objetos webhook",
        responseExample: `[
  {
    "id": "webhook_123",
    "name": "Meu Webhook",
    "url": "https://meu-Outro.com/webhook",
    "events": ["contact.created", "contact.updated"],
    "secret": "webhook_secret_123",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/webhooks' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "get-webhook",
        method: "GET",
        path: "/api/webhooks/[id]",
        title: "Obter Webhook",
        description: "Retorna os detalhes de um webhook específico com opção de incluir logs",
        params: [{ name: "id", type: "string", description: "ID único do webhook", required: true }],
        queryParams: [
          { name: "logs", type: "boolean", description: "Incluir logs do webhook", required: false },
          { name: "limit", type: "number", description: "Limite de logs a retornar", required: false },
        ],
        response: "Objeto webhook com logs opcionais",
        responseExample: `{
  "id": "webhook_123",
  "name": "Meu Webhook",
  "url": "https://meu-Outro.com/webhook",
  "events": ["contact.created", "contact.updated"],
  "secret": "webhook_secret_123",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "logs": [
    {
      "id": "log_123",
      "event": "contact.created",
      "status": "success",
      "responseCode": 200,
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/webhooks/webhook_123?logs=true&limit=10' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "create-webhook",
        method: "POST",
        path: "/api/webhooks",
        title: "Criar Webhook",
        description: "Cria um novo webhook para receber notificações de eventos",
        bodyParams: [
          { name: "name", type: "string", description: "Nome identificador do webhook", required: true },
          { name: "url", type: "string", description: "URL do endpoint que receberá as notificações", required: true },
          {
            name: "events",
            type: "array",
            description: "Lista de eventos a serem notificados (contact.created, contact.updated, contact.deleted)",
            required: true,
          },
          { name: "secret", type: "string", description: "Segredo para validação da assinatura", required: false },
          { name: "isActive", type: "boolean", description: "Indica se o webhook está ativo", required: false },
        ],
        response: "Objeto webhook criado",
        responseExample: `{
  "id": "webhook_123",
  "name": "Meu Webhook",
  "url": "https://meu-Outro.com/webhook",
  "events": ["contact.created", "contact.updated"],
  "secret": "webhook_secret_123",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}`,
        example: `curl -X POST 'https://konvertaleads.com.br/api/webhooks' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Meu Webhook",
    "url": "https://meu-Outro.com/webhook",
    "events": ["contact.created", "contact.updated"]
  }'`,
      },
      {
        id: "update-webhook",
        method: "PUT",
        path: "/api/webhooks/[id]",
        title: "Atualizar Webhook",
        description: "Atualiza as informações de um webhook existente",
        params: [{ name: "id", type: "string", description: "ID único do webhook", required: true }],
        bodyParams: [
          { name: "name", type: "string", description: "Nome identificador do webhook", required: false },
          { name: "url", type: "string", description: "URL do endpoint que receberá as notificações", required: false },
          {
            name: "events",
            type: "array",
            description: "Lista de eventos a serem notificados (contact.created, contact.updated, contact.deleted)",
            required: false,
          },
          { name: "secret", type: "string", description: "Segredo para validação da assinatura", required: false },
          { name: "isActive", type: "boolean", description: "Indica se o webhook está ativo", required: false },
        ],
        response: "Objeto webhook atualizado",
        responseExample: `{
  "id": "webhook_123",
  "name": "Webhook Atualizado",
  "url": "https://meu-Outro.com/webhook",
  "events": ["contact.created", "contact.updated"],
  "secret": "webhook_secret_123",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}`,
        example: `curl -X PUT 'https://konvertaleads.com.br/api/webhooks/webhook_123' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Webhook Atualizado",
    "isActive": false
  }'`,
      },
      {
        id: "delete-webhook",
        method: "DELETE",
        path: "/api/webhooks/[id]",
        title: "Excluir Webhook",
        description: "Remove um webhook do sistema permanentemente",
        params: [{ name: "id", type: "string", description: "ID único do webhook", required: true }],
        response: "Confirmação de exclusão",
        responseExample: `{
  "success": true,
  "message": "Webhook excluído com sucesso"
}`,
        example: `curl -X DELETE 'https://konvertaleads.com.br/api/webhooks/webhook_123' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "test-webhook",
        method: "POST",
        path: "/api/webhooks/test",
        title: "Testar Webhook",
        description: "Testa um webhook enviando uma requisição de exemplo",
        bodyParams: [
          { name: "url", type: "string", description: "URL do endpoint a ser testado", required: true },
          { name: "secret", type: "string", description: "Segredo para assinatura (opcional)", required: false },
          { name: "event", type: "string", description: "Tipo de evento para teste", required: false },
        ],
        response: "Resultado do teste",
        responseExample: `{
  "success": true,
  "status": 200,
  "responseTime": 150,
  "message": "Webhook testado com sucesso"
}`,
        example: `curl -X POST 'https://konvertaleads.com.br/api/webhooks/test' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "url": "https://meu-Outro.com/webhook",
    "event": "contact.created"
  }'`,
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    routes: [
      {
        id: "get-dashboard",
        method: "GET",
        path: "/api/dashboard",
        title: "Dados do Dashboard",
        description: "Retorna dados agregados para o dashboard principal",
        queryParams: [
          {
            name: "period",
            type: "string",
            description: "Período dos dados (day, week, month, year, all)",
            required: false,
          },
        ],
        response: "Objeto com dados do dashboard",
        responseExample: `{
  "totalContacts": 150,
  "newContacts": 25,
  "closedDeals": 8,
  "totalValue": "45000.00",
  "conversionRate": 5.3,
  "statusDistribution": {
    "Novo": 45,
    "Contato": 32,
    "Proposta": 18,
    "Fechado": 35,
    "Perdido": 20
  },
  "sourceDistribution": {
    "Outro": 60,
    "Facebook": 40,
    "Google": 30,
    "Indicação": 20
  }
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/dashboard?period=month' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "get-dashboard-timeline",
        method: "GET",
        path: "/api/dashboard/timeline",
        title: "Timeline do Dashboard",
        description: "Retorna dados de timeline para gráficos temporais",
        queryParams: [
          {
            name: "period",
            type: "string",
            description: "Período dos dados (day, week, month, year)",
            required: false,
          },
          {
            name: "groupBy",
            type: "string",
            description: "Agrupamento dos dados (hour, day, week, month)",
            required: false,
          },
        ],
        response: "Array de dados temporais",
        responseExample: `[
  {
    "date": "2024-01-15",
    "contacts": 12,
    "closed": 2,
    "value": "5000.00"
  },
  {
    "date": "2024-01-16",
    "contacts": 8,
    "closed": 1,
    "value": "2500.00"
  }
]`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/dashboard/timeline?period=month&groupBy=day' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "get-dashboard-conversion",
        method: "GET",
        path: "/api/dashboard/conversion",
        title: "Taxa de Conversão",
        description: "Retorna dados de conversão por período e origem",
        queryParams: [
          {
            name: "period",
            type: "string",
            description: "Período dos dados (day, week, month, year)",
            required: false,
          },
        ],
        response: "Objeto com dados de conversão",
        responseExample: `{
  "overall": {
    "rate": 5.3,
    "total": 150,
    "converted": 8
  },
  "bySource": {
    "Outro": { "rate": 6.2, "total": 60, "converted": 4 },
    "Facebook": { "rate": 4.5, "total": 40, "converted": 2 },
    "Google": { "rate": 5.0, "total": 30, "converted": 2 }
  }
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/dashboard/conversion?period=month' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
    ],
  },
  {
    id: "financial",
    title: "Financeiro",
    icon: DollarSign,
    routes: [
      {
        id: "get-financial",
        method: "GET",
        path: "/api/financial",
        title: "Dados Financeiros",
        description: "Retorna dados financeiros agregados",
        queryParams: [
          {
            name: "period",
            type: "string",
            description: "Período dos dados (day, week, month, year)",
            required: false,
          },
        ],
        response: "Objeto com dados financeiros",
        responseExample: `{
  "totalValue": "125000.00",
  "closedValue": "45000.00",
  "pendingValue": "80000.00",
  "averageTicket": "2500.00",
  "byStatus": {
    "Novo": "30000.00",
    "Contato": "25000.00",
    "Proposta": "25000.00",
    "Fechado": "45000.00"
  },
  "bySource": {
    "Outro": "50000.00",
    "Facebook": "35000.00",
    "Google": "25000.00",
    "Indicação": "15000.00"
  }
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/financial?period=month' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "get-financial-contacts",
        method: "GET",
        path: "/api/financial/contacts",
        title: "Contatos por Valor",
        description: "Lista contatos ordenados por valor financeiro",
        queryParams: [
          { name: "limit", type: "number", description: "Limite de contatos a retornar", required: false },
          { name: "order", type: "string", description: "Ordenação (asc, desc)", required: false },
          { name: "status", type: "string", description: "Filtrar por status", required: false },
        ],
        response: "Array de contatos ordenados por valor",
        responseExample: `[
  {
    "id": "123456",
    "name": "João Silva",
    "contact": "joao@email.com",
    "value": "15000.00",
    "status": "Fechado",
    "source": "Outro"
  },
  {
    "id": "123457",
    "name": "Maria Santos",
    "contact": "maria@email.com",
    "value": "12000.00",
    "status": "Proposta",
    "source": "Facebook"
  }
]`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/financial/contacts?limit=10&order=desc' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
    ],
  },
  {
    id: "reports",
    title: "Relatórios",
    icon: FileText,
    routes: [
      {
        id: "get-reports",
        method: "GET",
        path: "/api/reports",
        title: "Listar Relatórios",
        description: "Retorna todos os relatórios gerados",
        queryParams: [
          { name: "limit", type: "number", description: "Limite de resultados por página", required: false },
          { name: "page", type: "number", description: "Número da página", required: false },
          { name: "type", type: "string", description: "Filtrar por tipo de relatório", required: false },
        ],
        response: "Array de objetos relatório",
        responseExample: `[
  {
    "id": "relatorio_123",
    "userId": "userId_123",
    "format": "pdf",
    "period": "30d",
    "startDate": null,
    "endDate": null,
    "includeContacts": true,
    "includeFinancial": true,
    "fileName": "relatorio_30_dias_2025-06-29.pdf",
    "fileUrl": null,
    "createdAt": "2025-06-29T12:58:36.225Z"
  }
]`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/reports?type=contacts&limit=10' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "get-report",
        method: "GET",
        path: "/api/reports/[id]",
        title: "Obter Relatório",
        description: "Retorna os detalhes de um relatório específico",
        params: [{ name: "id", type: "string", description: "ID único do relatório", required: true }],
        response: "Objeto relatório",
        responseExample: `{
    "id": "relatorio_123",
    "userId": "userId_123",
    "format": "pdf",
    "period": "30d",
    "startDate": null,
    "endDate": null,
    "includeContacts": true,
    "includeFinancial": true,
    "fileName": "relatorio_30_dias_2025-06-29.pdf",
    "fileUrl": null,
    "createdAt": "2025-06-29T12:58:36.225Z"
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/reports/report_123' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "get-last-report",
        method: "GET",
        path: "/api/reports/last",
        title: "Último Relatório Gerado",
        description: "Retorna o último relatório gerado para um determinado tipo",
        queryParams: [
          {
            name: "type",
            type: "string",
            description: "Tipo do relatório (contacts, financial, dashboard)",
            required: true,
          },
        ],
        response: "Objeto relatório",
        responseExample: `{
    "id": "relatorio_123",
    "userId": "userId_123",
    "format": "pdf",
    "period": "30d",
    "startDate": null,
    "endDate": null,
    "includeContacts": true,
    "includeFinancial": true,
    "fileName": "relatorio_30_dias_2025-06-29.pdf",
    "fileUrl": null,
    "createdAt": "2025-06-29T12:58:36.225Z"
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/reports/last?type=contacts' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "get-dowload-report-file",
        method: "GET",
        path: "/api/reports/[id]/download",
        title: "Baixar Relatório",
        description: "Baixa o arquivo de um relatório gerado",
        params: [{ name: "id", type: "string", description: "ID único do relatório", required: true }],
        response: "Arquivo do relatório",
        responseExample: `{
    "fileName": "relatorio_30_dias_exemplo.pdf",
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/reports/report_123/download' \\
        -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "create-report",
        method: "POST",
        path: "/api/reports/generate",
        title: "Gerar Relatório",
        description: "Gera um novo relatório com base nos filtros especificados",
        bodyParams: [
          { name: "format", type: "string", description: "Formato do relatório (pdf, csv)", required: true },
          { name: "period", type: "string", description: "Período do relatório (30d, 90d, 1y, custom)", required: true },
          { name: "includeContacts", type: "boolean", description: "Incluir dados de contatos no relatório", required: false },
          { name: "includeFinancial", type: "boolean", description: "Incluir dados financeiros no relatório", required: false },

        ],
        response: "Objeto relatório criado",
        responseExample: `{
    Relatório gerado com sucesso: relatorio_30_dias_exemplo.pdf
}`,
        example: `curl -X POST 'https://konvertaleads.com.br/api/reports/generate' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "format": "pdf",
  "period": "30d",
  "includeContacts": true,
  "includeFinancial": true
  }'`,
      },
      {
        id: "delete-report",
        method: "DELETE",
        path: "/api/reports/[id]",
        title: "Excluir Relatório",
        description: "Remove um relatório do sistema permanentemente",
        params: [{ name: "id", type: "string", description: "ID único do relatório", required: true }],
        response: "Confirmação de exclusão",
        responseExample: `{
  "success": true,
  "message": "Relatório excluído com sucesso"
}`,
        example: `curl -X DELETE 'https://konvertaleads.com.br/api/reports/report_123' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
    ],
  },
  {
    id: "users",
    title: "Usuários",
    icon: Users,
    routes: [
      {
        id: "get-user-me",
        method: "GET",
        path: "/api/users/me",
        title: "Meus Dados",
        description: "Retorna as informações do usuário autenticado",
        response: "Objeto usuário",
        responseExample: `{
  "id": "user_123",
  "name": "João Silva",
  "email": "joao@email.com",
  "plan": "Pro",
  "isActive": true,
  "createdAt": "2024-01-01T10:00:00Z"
}`,
        example: `curl -X GET 'https://konvertaleads.com.br/api/users/me' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
      {
        id: "update-user-me",
        method: "PUT",
        path: "/api/users/me",
        title: "Atualizar Meus Dados",
        description: "Atualiza as informações do usuário autenticado",
        bodyParams: [
          { name: "name", type: "string", description: "Nome do usuário", required: false },
          { name: "email", type: "string", description: "Email do usuário", required: false },
          {
            name: "currentPassword",
            type: "string",
            description: "Senha atual (obrigatória para alterar senha)",
            required: false,
          },
          { name: "newPassword", type: "string", description: "Nova senha", required: false },
          { name: "theme", type: "string", description: "Tema preferido (light, dark, system)", required: false },
          {
            name: "notificationSettings",
            type: "object",
            description: "Configurações de notificação",
            required: false,
          },
        ],
        response: "Objeto usuário atualizado",
        responseExample: `{
  "id": "user_123",
  "name": "João Silva Santos",
  "email": "joao@email.com",
  "plan": "Pro",
  "isActive": true,
  "createdAt": "2024-01-01T10:00:00Z"
}`,
        example: `curl -X PUT 'https://konvertaleads.com.br/api/users/me' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "João Silva Santos",
    "theme": "dark"
  }'`,
      },
    ],
  },
  {
    id: "tokens",
    title: "Tokens",
    icon: KeyRound,
    routes: [
      {
        id: "create-token",
        method: "POST",
        path: "/api/tokens",
        title: "Gerar Token",
        description: "Gera um novo token de API",
        bodyParams: [{ name: "name", type: "string", description: "Nome identificador do token", required: true }],
        response: "Objeto com o novo token",
        responseExample: `{
  "token": "kl_live_abc123def456...",
  "id": "token_123",
  "name": "Token Principal",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}`,
        example: `curl -X POST 'https://konvertaleads.com.br/api/tokens' \\
  -H 'Authorization: Bearer seu_token_aqui' \\
  -H 'Content-Type: application/json' \\
  -d '{ "name": "Novo Token" }'`,
      },
      {
        id: "delete-token",
        method: "DELETE",
        path: "/api/tokens/[id]",
        title: "Excluir Token",
        description: "Remove um token de API do usuário",
        params: [{ name: "id", type: "string", description: "ID único do token", required: true }],
        response: "Confirmação de exclusão",
        responseExample: `{
  "success": true,
  "message": "Token excluído com sucesso"
}`,
        example: `curl -X DELETE 'https://konvertaleads.com.br/api/tokens/token_123' \\
  -H 'Authorization: Bearer seu_token_aqui'`,
      },
    ],
  },
]

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("auth")
  const [activeRoute, setActiveRoute] = useState<string | null>(null)

  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example)
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

  const renderAuthContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Autenticação</h1>
        <p className="text-muted-foreground text-lg">Como autenticar suas requisições à API do KonvertaLeads</p>
      </div>

      <Alert>
        <Key className="h-4 w-4" />
        <AlertTitle>Token de API Obrigatório</AlertTitle>
        <AlertDescription>
          Todas as requisições à API devem incluir um token de autenticação válido no cabeçalho Authorization.
        </AlertDescription>
      </Alert>

      {/* Componente ApiTokenManager importado diretamente */}
      <div className="my-8">
        <ApiTokenManager />
      </div>

      {/* Seção: Testando a autenticação */}
      <Card>
        <CardHeader>
          <CardTitle>Testando sua autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use este comando para testar se seu token está funcionando corretamente:
          </p>
          <div className="rounded-md bg-muted p-4">
            <pre className="text-sm overflow-x-auto">
              <code>{`curl -X GET 'https://konvertaleads.com.br/api/users/me' \\
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \\
  -H 'Content-Type: application/json'`}</code>
            </pre>
          </div>
          <p className="text-sm text-muted-foreground">
            Se o token estiver válido, você receberá suas informações de usuário. Caso contrário, receberá um erro 401
            (Não autorizado).
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const renderRouteContent = (route: ApiRoute) => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge className={getMethodColor(route.method)}>{route.method}</Badge>
          <code className="text-lg font-mono">{route.path}</code>
        </div>
        <h1 className="text-3xl font-bold mb-2">{route.title}</h1>
        <p className="text-muted-foreground text-lg">{route.description}</p>
      </div>

      {route.params && (
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {route.params.map((param, i) => (
                <div key={i} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{param.name}</code>
                    <Badge variant="outline">{param.type}</Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">
                        obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{param.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {route.queryParams && (
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {route.queryParams.map((param, i) => (
                <div key={i} className="border-l-2 border-green-200 pl-4">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{param.name}</code>
                    <Badge variant="outline">{param.type}</Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">
                        obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{param.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {route.bodyParams && (
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros do Body</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {route.bodyParams.map((param, i) => (
                <div key={i} className="border-l-2 border-amber-200 pl-4">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{param.name}</code>
                    <Badge variant="outline">{param.type}</Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">
                        obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{param.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{route.response}</p>
          {route.responseExample && (
            <div className="rounded-md bg-muted p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{route.responseExample}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exemplo de requisição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="rounded-md bg-muted p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{route.example}</code>
              </pre>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyExample(route.example)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const currentSection = sections.find((s) => s.id === activeSection)
  const currentRoute = currentSection?.routes.find((r) => r.id === activeRoute)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Book className="h-8 w-8 text-primary" />
            <h2 className="text-xl font-bold">Documentação da API</h2>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-2">
            {sections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => {
                    setActiveSection(section.id)
                    setActiveRoute(null)
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-md text-left hover:bg-muted transition-colors",
                    activeSection === section.id && !activeRoute && "bg-muted font-medium",
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </button>

                {section.routes.length > 0 && activeSection === section.id && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.routes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => setActiveRoute(route.id)}
                        className={cn(
                          "flex items-center gap-2 w-full p-2 rounded-md text-left text-sm hover:bg-muted transition-colors",
                          activeRoute === route.id && "bg-muted font-medium",
                        )}
                      >
                        <Badge className={cn(getMethodColor(route.method), "text-xs px-1.5 py-0.5")}>
                          {route.method}
                        </Badge>
                        {route.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <ScrollArea className="h-screen">
          <div className="p-8 max-w-4xl">
            {activeSection === "auth" && renderAuthContent()}
            {currentRoute && renderRouteContent(currentRoute)}
            {activeSection !== "auth" && !currentRoute && currentSection && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <currentSection.icon className="h-8 w-8" />
                    {currentSection.title}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Selecione um endpoint na barra lateral para ver a documentação detalhada.
                  </p>
                </div>

                <div className="grid gap-4">
                  {currentSection.routes.map((route) => (
                    <Card
                      key={route.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveRoute(route.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getMethodColor(route.method)}>{route.method}</Badge>
                            <div>
                              <h3 className="font-medium">{route.title}</h3>
                              <code className="text-sm text-muted-foreground">{route.path}</code>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{route.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
