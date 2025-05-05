"use client"

import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

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
                  <CardTitle>JavaScript / Node.js</CardTitle>
                  <CardDescription>
                    Exemplos de como utilizar as APIs do Mini CRM com JavaScript e Node.js
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação e Obtenção de Token</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`// Usando fetch (navegador ou Node.js moderno)
async function obterToken(email, senha) {
  const resposta = await fetch('https://seu-dominio.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: senha
    })
  });
  
  const dados = await resposta.json();
  
  if (!resposta.ok) {
    throw new Error(\`Erro: ${dados.message || resposta.statusText}\`);
  }
  
  return dados.token;
}

// Exemplo de uso
obterToken('usuario@exemplo.com', 'senha123')
  .then(token => {
    console.log('Token obtido:', token);
    // Armazene o token para uso em outras requisições
  })
  .catch(erro => {
    console.error('Falha na autenticação:', erro);
  });`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Listando Contatos</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`// Usando fetch com token JWT
async function listarContatos(token, filtros = {}) {
  // Construir query string a partir dos filtros
  const queryParams = new URLSearchParams();
  
  if (filtros.status) queryParams.append('status', filtros.status);
  if (filtros.source) queryParams.append('source', filtros.source);
  if (filtros.q) queryParams.append('q', filtros.q);
  
  const queryString = queryParams.toString();
  const url = \`https://seu-dominio.com/api/contacts\${queryString ? '?' + queryString : ''}\`;
  
  const resposta = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  });
  
  const dados = await resposta.json();
  
  if (!resposta.ok) {
    throw new Error(\`Erro: \${dados.message || resposta.statusText}\`);
  }
  
  return dados;
}

// Exemplo de uso
const token = 'seu-token-jwt';
listarContatos(token, { status: 'Novo', source: 'WhatsApp' })
  .then(contatos => {
    console.log('Contatos encontrados:', contatos.length);
    contatos.forEach(contato => {
      console.log(\`\${contato.name} - \${contato.status}\`);
    });
  })
  .catch(erro => {
    console.error('Falha ao listar contatos:', erro);
  });`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Criando um Novo Contato</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`async function criarContato(token, dadosContato) {
  const resposta = await fetch('https://seu-dominio.com/api/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify(dadosContato)
  });
  
  const dados = await resposta.json();
  
  if (!resposta.ok) {
    throw new Error(\`Erro: \${dados.message || resposta.statusText}\`);
  }
  
  return dados;
}

// Exemplo de uso
const token = 'seu-token-jwt';
const novoContato = {
  name: 'Maria Silva',
  contact: '+5511988888888',
  source: 'Instagram',
  status: 'Novo',
  notes: 'Cliente interessada em nosso serviço premium'
};

criarContato(token, novoContato)
  .then(contatoCriado => {
    console.log('Contato criado com sucesso:', contatoCriado);
  })
  .catch(erro => {
    console.error('Falha ao criar contato:', erro);
  });`}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="python">
              <Card>
                <CardHeader>
                  <CardTitle>Python</CardTitle>
                  <CardDescription>Exemplos de como utilizar as APIs do Mini CRM com Python</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação e Obtenção de Token</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`import requests

def obter_token(email, senha):
    url = "https://seu-dominio.com/api/auth/login"
    payload = {
        "email": email,
        "password": senha
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"Erro: {response.json().get('message', response.reason)}")
    
    return response.json()["token"]

# Exemplo de uso
try:
    token = obter_token("usuario@exemplo.com", "senha123")
    print(f"Token obtido: {token}")
    # Armazene o token para uso em outras requisições
except Exception as e:
    print(f"Falha na autenticação: {e}")`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Listando Contatos</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`import requests

def listar_contatos(token, filtros=None):
    url = "https://seu-dominio.com/api/contacts"
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Adicionar parâmetros de consulta se fornecidos
    params = {}
    if filtros:
        if "status" in filtros:
            params["status"] = filtros["status"]
        if "source" in filtros:
            params["source"] = filtros["source"]
        if "q" in filtros:
            params["q"] = filtros["q"]
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        raise Exception(f"Erro: {response.json().get('message', response.reason)}")
    
    return response.json()

# Exemplo de uso
try:
    token = "seu-token-jwt"
    contatos = listar_contatos(token, {"status": "Novo", "source": "WhatsApp"})
    
    print(f"Contatos encontrados: {len(contatos)}")
    for contato in contatos:
        print(f"{contato['name']} - {contato['status']}")
except Exception as e:
    print(f"Falha ao listar contatos: {e}")`}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="php">
              <Card>
                <CardHeader>
                  <CardTitle>PHP</CardTitle>
                  <CardDescription>Exemplos de como utilizar as APIs do Mini CRM com PHP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação e Obtenção de Token</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`<?php
function obterToken($email, $senha) {
    $url = 'https://seu-dominio.com/api/auth/login';
    $dados = [
        'email' => $email,
        'password' => $senha
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dados));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $resposta = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $respostaObj = json_decode($resposta);
    
    if ($statusCode !== 200) {
        throw new Exception('Erro: ' . ($respostaObj->message ?? 'Falha na requisição'));
    }
    
    return $respostaObj->token;
}

// Exemplo de uso
try {
    $token = obterToken('usuario@exemplo.com', 'senha123');
    echo "Token obtido: " . $token;
    // Armazene o token para uso em outras requisições
} catch (Exception $e) {
    echo "Falha na autenticação: " . $e->getMessage();
}
?>`}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curl">
              <Card>
                <CardHeader>
                  <CardTitle>cURL (Linha de Comando)</CardTitle>
                  <CardDescription>
                    Exemplos de como utilizar as APIs do Mini CRM com cURL na linha de comando
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Autenticação e Obtenção de Token</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`curl -X POST \\
  https://seu-dominio.com/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Listando Contatos</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`curl -X GET \\
  'https://seu-dominio.com/api/contacts?status=Novo&source=WhatsApp' \\
  -H 'Authorization: Bearer seu-token-jwt'`}</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Criando um Novo Contato</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="bg-background p-3 rounded text-sm font-mono">
                        <pre>{`curl -X POST \\
  https://seu-dominio.com/api/contacts \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer seu-token-jwt' \\
  -d '{
    "name": "Maria Silva",
    "contact": "+5511988888888",
    "source": "Instagram",
    "status": "Novo",
    "notes": "Cliente interessada em nosso serviço premium"
  }'`}</pre>
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
