"use client"

import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy } from "lucide-react"

export default function ApiExamplesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link href="/docs/api">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Documentação da API
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Exemplos de Código</h1>
              <p className="text-muted-foreground mt-2">
                Exemplos práticos de como utilizar as APIs do Konverta em diferentes linguagens
              </p>
            </div>
          </div>

          <Tabs defaultValue="javascript" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>

            <TabsContent value="javascript">
              <Card>
                <CardHeader>
                  <CardTitle>Exemplos em JavaScript</CardTitle>
                  <CardDescription>
                    Exemplos de como utilizar as APIs do Konverta com JavaScript e Node.js
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Login e obtenção de token</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            "// Usando fetch no navegador ou Node.js\nasync function login(email, password) {\n  const response = await fetch('/api/auth/login', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({ email, password })\n  });\n  \n  const data = await response.json();\n  \n  if (!response.ok) {\n    throw new Error(data.message || 'Erro ao fazer login');\n  }\n  \n  // Armazene o token para uso futuro\n  localStorage.setItem('authToken', data.token);\n  \n  return data;\n}\n\n// Exemplo de uso\nlogin('admin@example.com', 'senha123')\n  .then(data => console.log('Login bem-sucedido:', data))\n  .catch(error => console.error('Erro:', error));"
                          }
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Listar Contatos</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Obter lista de contatos com filtros</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            "// Função para obter contatos com filtros opcionais\nasync function getContacts({ status, source, query } = {}) {\n  // Construir URL com parâmetros de consulta\n  const url = new URL('/api/contacts', window.location.origin);\n  \n  if (status) url.searchParams.append('status', status);\n  if (source) url.searchParams.append('source', source);\n  if (query) url.searchParams.append('q', query);\n  \n  const token = localStorage.getItem('authToken');\n  \n  const response = await fetch(url.toString(), {\n    method: 'GET',\n    headers: {\n      'Authorization': `Bearer ${token}`\n    }\n  });\n  \n  if (!response.ok) {\n    const error = await response.json();\n    throw new Error(error.message || 'Erro ao obter contatos');\n  }\n  \n  return response.json();\n}\n\n// Exemplo de uso\ngetContacts({ status: 'Novo', source: 'WhatsApp' })\n  .then(contacts => console.log('Contatos:', contacts))\n  .catch(error => console.error('Erro:', error));"
                          }
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Criar um Webhook</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Configurar um novo webhook</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            "// Função para criar um novo webhook\nasync function createWebhook(webhookData) {\n  const token = localStorage.getItem('authToken');\n  \n  const response = await fetch('/api/webhooks', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${token}`\n    },\n    body: JSON.stringify(webhookData)\n  });\n  \n  if (!response.ok) {\n    const error = await response.json();\n    throw new Error(error.message || 'Erro ao criar webhook');\n  }\n  \n  return response.json();\n}\n\n// Exemplo de uso\nconst newWebhook = {\n  name: 'Notificação de Novo Contato',\n  url: 'https://meu-sistema.com/webhooks/mini-crm',\n  events: ['contact.created'],\n  secret: 'meu-segredo-secreto',\n  isActive: true\n};\n\ncreateWebhook(newWebhook)\n  .then(webhook => console.log('Webhook criado:', webhook))\n  .catch(error => console.error('Erro:', error));"
                          }
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="python">
              <Card>
                <CardHeader>
                  <CardTitle>Exemplos em Python</CardTitle>
                  <CardDescription>Exemplos de como utilizar as APIs do Konverta com Python</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cliente Python para a API do Konverta</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Classe de cliente completa</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            'import requests\nimport json\n\nclass KonvertaClient:\n    def __init__(self, base_url, token=None):\n        self.base_url = base_url\n        self.token = token\n        \n    def set_token(self, token):\n        self.token = token\n        \n    def request(self, endpoint, method=\'GET\', params=None, data=None):\n        url = f"{self.base_url}{endpoint}"\n        \n        headers = {}\n        if self.token:\n            headers[\'Authorization\'] = f"Bearer {self.token}"\n            \n        if data:\n            headers[\'Content-Type\'] = \'application/json\'\n            \n        response = requests.request(\n            method=method,\n            url=url,\n            headers=headers,\n            params=params,\n            data=json.dumps(data) if data else None\n        )\n        \n        if response.status_code >= 400:\n            try:\n                error_data = response.json()\n                message = error_data.get(\'message\', f"Error {response.status_code}")\n            except:\n                message = f"Error {response.status_code}"\n                \n            raise Exception(message)\n            \n        return response.json()\n    \n    # Autenticação\n    def login(self, email, password):\n        data = self.request(\n            endpoint="/api/auth/login",\n            method="POST",\n            data={"email": email, "password": password}\n        )\n        \n        self.set_token(data.get(\'token\'))\n        return data\n    \n    # Contatos\n    def get_contacts(self, status=None, source=None, query=None):\n        params = {}\n        if status:\n            params[\'status\'] = status\n        if source:\n            params[\'source\'] = source\n        if query:\n            params[\'q\'] = query\n            \n        return self.request(\n            endpoint="/api/contacts",\n            params=params\n        )\n    \n    def get_contact(self, contact_id):\n        return self.request(f"/api/contacts/{contact_id}")\n    \n    def create_contact(self, contact_data):\n        return self.request(\n            endpoint="/api/contacts",\n            method="POST",\n            data=contact_data\n        )\n    \n    def update_contact(self, contact_id, contact_data):\n        return self.request(\n            endpoint=f"/api/contacts/{contact_id}",\n            method="PUT",\n            data=contact_data\n        )\n    \n    def delete_contact(self, contact_id):\n        return self.request(\n            endpoint=f"/api/contacts/{contact_id}",\n            method="DELETE"\n        )\n    \n    # Webhooks\n    def get_webhooks(self):\n        return self.request("/api/webhooks")\n    \n    def create_webhook(self, webhook_data):\n        return self.request(\n            endpoint="/api/webhooks",\n            method="POST",\n            data=webhook_data\n        )\n    \n    # Adicione mais métodos conforme necessário...\n\n\n# Exemplo de uso\nif __name__ == "__main__":\n    client = KonvertaClient(base_url="https://seu-dominio.com")\n    \n    # Login\n    client.login(email="admin@example.com", password="senha123")\n    \n    # Obter contatos\n    contacts = client.get_contacts(status="Novo", source="WhatsApp")\n    print(f"Contatos: {contacts}")\n    \n    # Criar um contato\n    new_contact = client.create_contact({\n        "name": "Maria Silva",\n        "contact": "+5511888888888",\n        "source": "Instagram",\n        "status": "Novo",\n        "notes": "Cliente viu nossa propaganda no Instagram"\n    })\n    print(f"Novo contato: {new_contact}")\n    \n    # Criar um webhook\n    new_webhook = client.create_webhook({\n        "name": "Notificação de Novo Contato",\n        "url": "https://meu-sistema.com/webhooks/mini-crm",\n        "events": ["contact.created"],\n        "secret": "meu-segredo-secreto",\n        "isActive": True\n    })\n    print(f"Novo webhook: {new_webhook}")'
                          }
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="php">
              <Card>
                <CardHeader>
                  <CardTitle>Exemplos em PHP</CardTitle>
                  <CardDescription>Exemplos de como utilizar as APIs do Konverta com PHP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cliente PHP para a API do Konverta</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Classe de cliente completa</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            "<?php\n\nclass KonvertaClient {\n    private $baseUrl;\n    private $token;\n    \n    public function __construct($baseUrl, $token = null) {\n        $this->baseUrl = $baseUrl;\n        $this->token = $token;\n    }\n    \n    public function setToken($token) {\n        $this->token = $token;\n    }\n    \n    private function request($endpoint, $method = 'GET', $params = [], $data = null) {\n        $url = $this->baseUrl . $endpoint;\n        \n        // Adicionar parâmetros de consulta à URL\n        if (!empty($params) && $method === 'GET') {\n            $url .= '?' . http_build_query($params);\n        }\n        \n        $headers = [];\n        if ($this->token) {\n            $headers[] = 'Authorization: Bearer ' . $this->token;\n        }\n        \n        if ($data !== null) {\n            $headers[] = 'Content-Type: application/json';\n        }\n        \n        $ch = curl_init();\n        curl_setopt($ch, CURLOPT_URL, $url);\n        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n        \n        if ($method !== 'GET') {\n            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);\n            if ($data !== null) {\n                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\n            }\n        }\n        \n        $response = curl_exec($ch);\n        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);\n        \n        if (curl_errno($ch)) {\n            throw new Exception('Curl error: ' . curl_error($ch));\n        }\n        \n        curl_close($ch);\n        \n        $responseData = json_decode($response, true);\n        \n        if ($httpCode >= 400) {\n            $message = isset($responseData['message']) ? $responseData['message'] : \"Error {$httpCode}\";\n            throw new Exception($message);\n        }\n        \n        return $responseData;\n    }\n    \n    // Autenticação\n    public function login($email, $password) {\n        $data = $this->request(\n            '/api/auth/login',\n            'POST',\n            [],\n            ['email' => $email, 'password' => $password]\n        );\n        \n        if (isset($data['token'])) {\n            $this->setToken($data['token']);\n        }\n        \n        return $data;\n    }\n    \n    // Contatos\n    public function getContacts($status = null, $source = null, $query = null) {\n        $params = [];\n        if ($status !== null) $params['status'] = $status;\n        if ($source !== null) $params['source'] = $source;\n        if ($query !== null) $params['q'] = $query;\n        \n        return $this->request('/api/contacts', 'GET', $params);\n    }\n    \n    public function getContact($contactId) {\n        return $this->request(\"/api/contacts/{$contactId}\");\n    }\n    \n    public function createContact($contactData) {\n        return $this->request('/api/contacts', 'POST', [], $contactData);\n    }\n    \n    public function updateContact($contactId, $contactData) {\n        return $this->request(\"/api/contacts/{$contactId}\", 'PUT', [], $contactData);\n    }\n    \n    public function deleteContact($contactId) {\n        return $this->request(\"/api/contacts/{$contactId}\", 'DELETE');\n    }\n    \n    // Webhooks\n    public function getWebhooks() {\n        return $this->request('/api/webhooks');\n    }\n    \n    public function createWebhook($webhookData) {\n        return $this->request('/api/webhooks', 'POST', [], $webhookData);\n    }\n    \n    // Adicione mais métodos conforme necessário...\n}\n\n// Exemplo de uso\n$client = new KonvertaClient('https://seu-dominio.com');\n\ntry {\n    // Login\n    $loginResult = $client->login('admin@example.com', 'senha123');\n    echo \"Login bem-sucedido: \" . print_r($loginResult, true) . \"\\n\";\n    \n    // Obter contatos\n    $contacts = $client->getContacts('Novo', 'WhatsApp');\n    echo \"Contatos: \" . print_r($contacts, true) . \"\\n\";\n    \n    // Criar um contato\n    $newContact = $client->createContact([\n        'name' => 'Maria Silva',\n        'contact' => '+5511888888888',\n        'source' => 'Instagram',\n        'status' => 'Novo',\n        'notes' => 'Cliente viu nossa propaganda no Instagram'\n    ]);\n    echo \"Novo contato: \" . print_r($newContact, true) . \"\\n\";\n    \n    // Criar um webhook\n    $newWebhook = $client->createWebhook([\n        'name' => 'Notificação de Novo Contato',\n        'url' => 'https://meu-sistema.com/webhooks/mini-crm',\n        'events' => ['contact.created'],\n        'secret' => 'meu-segredo-secreto',\n        'isActive' => true\n    ]);\n    echo \"Novo webhook: \" . print_r($newWebhook, true) . \"\\n\";\n    \n} catch (Exception $e) {\n    echo \"Erro: \" . $e->getMessage() . \"\\n\";\n}\n?>"
                          }
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curl">
              <Card>
                <CardHeader>
                  <CardTitle>Exemplos com cURL</CardTitle>
                  <CardDescription>
                    Exemplos de como utilizar as APIs do Konverta com cURL na linha de comando
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Login e obtenção de token</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            'curl -X POST https://seu-dominio.com/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "email": "admin@example.com",\n    "password": "senha123"\n  }\''
                          }
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Listar Contatos</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Obter lista de contatos com filtros</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            'curl -X GET "https://seu-dominio.com/api/contacts?status=Novo&source=WhatsApp" \\\n  -H "Authorization: Bearer seu-token-jwt"'
                          }
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Criar um Contato</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Adicionar um novo contato</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            'curl -X POST https://seu-dominio.com/api/contacts \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer seu-token-jwt" \\\n  -d \'{\n    "name": "Maria Silva",\n    "contact": "+5511888888888",\n    "source": "Instagram",\n    "status": "Novo",\n    "notes": "Cliente viu nossa propaganda no Instagram"\n  }\''
                          }
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Criar um Webhook</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Configurar um novo webhook</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {
                            'curl -X POST https://seu-dominio.com/api/webhooks \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer seu-token-jwt" \\\n  -d \'{\n    "name": "Notificação de Novo Contato",\n    "url": "https://meu-sistema.com/webhooks/mini-crm",\n    "events": ["contact.created"],\n    "secret": "meu-segredo-secreto",\n    "isActive": true\n  }\''
                          }
                        </pre>
                      </div>
                    </div>
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
