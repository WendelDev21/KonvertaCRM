import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy } from "lucide-react"

export default function ApiExamplesPage() {
  return (
    <div className="flex min-h-screen flex-col">
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
                Exemplos práticos de como utilizar as APIs do Mini CRM em diferentes linguagens
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
                    Exemplos de como utilizar as APIs do Mini CRM com JavaScript e Node.js
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
                          {`// Usando fetch no navegador ou Node.js
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao fazer login');
  }
  
  // Armazene o token para uso futuro
  localStorage.setItem('authToken', data.token);
  
  return data;
}

// Exemplo de uso
login('admin@example.com', 'senha123')
  .then(data => console.log('Login bem-sucedido:', data))
  .catch(error => console.error('Erro:', error));`}
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
                          {`// Função para obter contatos com filtros opcionais
async function getContacts({ status, source, query } = {}) {
  // Construir URL com parâmetros de consulta
  const url = new URL('/api/contacts', window.location.origin);
  
  if (status) url.searchParams.append('status', status);
  if (source) url.searchParams.append('source', source);
  if (query) url.searchParams.append('q', query);
  
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao obter contatos');
  }
  
  return response.json();
}

// Exemplo de uso
getContacts({ status: 'Novo', source: 'WhatsApp' })
  .then(contacts => console.log('Contatos:', contacts))
  .catch(error => console.error('Erro:', error));`}
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
                          {`// Função para criar um novo webhook
async function createWebhook(webhookData) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify(webhookData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar webhook');
  }
  
  return response.json();
}

// Exemplo de uso
const newWebhook = {
  name: 'Notificação de Novo Contato',
  url: 'https://meu-sistema.com/webhooks/mini-crm',
  events: ['contact.created'],
  secret: 'meu-segredo-secreto',
  isActive: true
};

createWebhook(newWebhook)
  .then(webhook => console.log('Webhook criado:', webhook))
  .catch(error => console.error('Erro:', error));`}
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
                  <CardDescription>Exemplos de como utilizar as APIs do Mini CRM com Python</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cliente Python para a API do Mini CRM</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Classe de cliente completa</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {`import requests
import json

class MiniCRMClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        
    def set_token(self, token):
        self.token = token
        
    def request(self, endpoint, method='GET', params=None, data=None):
        url = f"{self.base_url}{endpoint}"
        
        headers = {}
        if self.token:
            headers['Authorization'] = f"Bearer {self.token}"
            
        if data:
            headers['Content-Type'] = 'application/json'
            
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            params=params,
            data=json.dumps(data) if data else None
        )
        
        if response.status_code >= 400:
            try:
                error_data = response.json()
                message = error_data.get('message', f"Error {response.status_code}")
            except:
                message = f"Error {response.status_code}"
                
            raise Exception(message)
            
        return response.json()
    
    # Autenticação
    def login(self, email, password):
        data = self.request(
            endpoint="/api/auth/login",
            method="POST",
            data={"email": email, "password": password}
        )
        
        self.set_token(data.get('token'))
        return data
    
    # Contatos
    def get_contacts(self, status=None, source=None, query=None):
        params = {}
        if status:
            params['status'] = status
        if source:
            params['source'] = source
        if query:
            params['q'] = query
            
        return self.request(
            endpoint="/api/contacts",
            params=params
        )
    
    def get_contact(self, contact_id):
        return self.request(f"/api/contacts/{contact_id}")
    
    def create_contact(self, contact_data):
        return self.request(
            endpoint="/api/contacts",
            method="POST",
            data=contact_data
        )
    
    def update_contact(self, contact_id, contact_data):
        return self.request(
            endpoint=f"/api/contacts/{contact_id}",
            method="PUT",
            data=contact_data
        )
    
    def delete_contact(self, contact_id):
        return self.request(
            endpoint=f"/api/contacts/{contact_id}",
            method="DELETE"
        )
    
    # Webhooks
    def get_webhooks(self):
        return self.request("/api/webhooks")
    
    def create_webhook(self, webhook_data):
        return self.request(
            endpoint="/api/webhooks",
            method="POST",
            data=webhook_data
        )
    
    # Adicione mais métodos conforme necessário...


# Exemplo de uso
if __name__ == "__main__":
    client = MiniCRMClient(base_url="https://seu-dominio.com")
    
    # Login
    client.login(email="admin@example.com", password="senha123")
    
    # Obter contatos
    contacts = client.get_contacts(status="Novo", source="WhatsApp")
    print(f"Contatos: {contacts}")
    
    # Criar um contato
    new_contact = client.create_contact({
        "name": "Maria Silva",
        "contact": "+5511888888888",
        "source": "Instagram",
        "status": "Novo",
        "notes": "Cliente viu nossa propaganda no Instagram"
    })
    print(f"Novo contato: {new_contact}")
    
    # Criar um webhook
    new_webhook = client.create_webhook({
        "name": "Notificação de Novo Contato",
        "url": "https://meu-sistema.com/webhooks/mini-crm",
        "events": ["contact.created"],
        "secret": "meu-segredo-secreto",
        "isActive": True
    })
    print(f"Novo webhook: {new_webhook}")`}
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
                  <CardDescription>Exemplos de como utilizar as APIs do Mini CRM com PHP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cliente PHP para a API do Mini CRM</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Classe de cliente completa</p>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>
                          {`<?php

class MiniCRMClient {
    private $baseUrl;
    private $token;
    
    public function __construct($baseUrl, $token = null) {
        $this->baseUrl = $baseUrl;
        $this->token = $token;
    }
    
    public function setToken($token) {
        $this->token = $token;
    }
    
    private function request($endpoint, $method = 'GET', $params = [], $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        // Adicionar parâmetros de consulta à URL
        if (!empty($params) && $method === 'GET') {
            $url .= '?' . http_build_query($params);
        }
        
        $headers = [];
        if ($this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }
        
        if ($data !== null) {
            $headers[] = 'Content-Type: application/json';
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($data !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            throw new Exception('Curl error: ' . curl_error($ch));
        }
        
        curl_close($ch);
        
        $responseData = json_decode($response, true);
        
        if ($httpCode >= 400) {
            $message = isset($responseData['message']) ? $responseData['message'] : "Error {$httpCode}";
            throw new Exception($message);
        }
        
        return $responseData;
    }
    
    // Autenticação
    public function login($email, $password) {
        $data = $this->request(
            '/api/auth/login',
            'POST',
            [],
            ['email' => $email, 'password' => $password]
        );
        
        if (isset($data['token'])) {
            $this->setToken($data['token']);
        }
        
        return $data;
    }
    
    // Contatos
    public function getContacts($status = null, $source = null, $query = null) {
        $params = [];
        if ($status !== null) $params['status'] = $status;
        if ($source !== null) $params['source'] = $source;
        if ($query !== null) $params['q'] = $query;
        
        return $this->request('/api/contacts', 'GET', $params);
    }
    
    public function getContact($contactId) {
        return $this->request("/api/contacts/{$contactId}");
    }
    
    public function createContact($contactData) {
        return $this->request('/api/contacts', 'POST', [], $contactData);
    }
    
    public function updateContact($contactId, $contactData) {
        return $this->request("/api/contacts/{$contactId}", 'PUT', [], $contactData);
    }
    
    public function deleteContact($contactId) {
        return $this->request("/api/contacts/{$contactId}", 'DELETE');
    }
    
    // Webhooks
    public function getWebhooks() {
        return $this->request('/api/webhooks');
    }
    
    public function createWebhook($webhookData) {
        return $this->request('/api/webhooks', 'POST', [], $webhookData);
    }
    
    // Adicione mais métodos conforme necessário...
}

// Exemplo de uso
$client = new MiniCRMClient('https://seu-dominio.com');

try {
    // Login
    $loginResult = $client->login('admin@example.com', 'senha123');
    echo "Login bem-sucedido: " . print_r($loginResult, true) . "\\n";
    
    // Obter contatos
    $contacts = $client->getContacts('Novo', 'WhatsApp');
    echo "Contatos: " . print_r($contacts, true) . "\\n";
    
    // Criar um contato
    $newContact = $client->createContact([
        'name' => 'Maria Silva',
        'contact' => '+5511888888888',
        'source' => 'Instagram',
        'status' => 'Novo',
        'notes' => 'Cliente viu nossa propaganda no Instagram'
    ]);
    echo "Novo contato: " . print_r($newContact, true) . "\\n";
    
    // Criar um webhook
    $newWebhook = $client->createWebhook([
        'name' => 'Notificação de Novo Contato',
        'url' => 'https://meu-sistema.com/webhooks/mini-crm',
        'events' => ['contact.created'],
        'secret' => 'meu-segredo-secreto',
        'isActive' => true
    ]);
    echo "Novo webhook: " . print_r($newWebhook, true) . "\\n";
    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\\n";
}
?>`}
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
                    Exemplos de como utilizar as APIs do Mini CRM com cURL na linha de comando
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
                          {`curl -X POST https://seu-dominio.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@example.com",
    "password": "senha123"
  }'`}
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
                          {`curl -X GET "https://seu-dominio.com/api/contacts?status=Novo&source=WhatsApp" \\
  -H "Authorization: Bearer seu-token-jwt"`}
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
                          {`curl -X POST https://seu-dominio.com/api/contacts \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer seu-token-jwt" \\
  -d '{
    "name": "Maria Silva",
    "contact": "+5511888888888",
    "source": "Instagram",
    "status": "Novo",
    "notes": "Cliente viu nossa propaganda no Instagram"
  }'`}
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
                          {`curl -X POST https://seu-dominio.com/api/webhooks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer seu-token-jwt" \\
  -d '{
    "name": "Notificação de Novo Contato",
    "url": "https://meu-sistema.com/webhooks/mini-crm",
    "events": ["contact.created"],
    "secret": "meu-segredo-secreto",
    "isActive": true
  }'`}
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
