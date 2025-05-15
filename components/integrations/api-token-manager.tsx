"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Key, AlertTriangle, Check, Copy, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TokenInfo {
  id: string
  name: string
  createdAt: string
  lastUsed: string | null
  expiresAt: string | null
}

export function ApiTokenManager() {
  const [token, setToken] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Buscar informações do token atual
  const fetchTokenInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tokens")
      const data = await response.json()

      if (data.hasToken && data.tokenInfo) {
        setTokenInfo(data.tokenInfo)
      } else {
        setTokenInfo(null)
      }
    } catch (error) {
      console.error("Erro ao buscar informações do token:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar informações do token.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Gerar novo token - Versão simplificada
  const generateToken = async () => {
    setIsGenerating(true)
    try {
      // Simplificando a requisição
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "API Token" }),
      })

      // Log para depuração
      console.log("Status da resposta:", response.status)

      // Verificar se a resposta é OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erro na resposta:", errorText)
        throw new Error(`Erro ao gerar token: ${response.status} ${errorText}`)
      }

      // Tentar obter o JSON da resposta
      const data = await response.json()
      console.log("Dados da resposta:", data)

      // Verificar se o token foi retornado
      if (!data.token) {
        throw new Error("Token não retornado pelo servidor")
      }

      // Definir o token e atualizar informações
      setToken(data.token)
      await fetchTokenInfo()

      toast({
        title: "Token gerado com sucesso",
        description: "Um novo token de API foi gerado. Copie-o agora, pois ele não será mostrado novamente.",
      })
    } catch (error) {
      console.error("Erro ao gerar token:", error)
      toast({
        title: "Erro ao gerar token",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o token.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Copiar token para a área de transferência
  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      toast({
        title: "Token copiado",
        description: "O token foi copiado para a área de transferência.",
      })

      setTimeout(() => setCopied(false), 3000)
    }
  }

  // Carregar informações do token ao montar o componente
  useEffect(() => {
    fetchTokenInfo()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Tokens de API
        </CardTitle>
        <CardDescription>
          Gere tokens para acessar a API do sistema através de ferramentas externas como Postman ou curl.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tokenInfo ? (
          <div className="space-y-4">
            <div className="rounded-md border p-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Token ativo</p>
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                    <Check className="h-3 w-3" />
                    <span>Ativo</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Criado {formatDistanceToNow(new Date(tokenInfo.createdAt), { addSuffix: true, locale: ptBR })}
                </p>
                {tokenInfo.lastUsed && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Último uso {formatDistanceToNow(new Date(tokenInfo.lastUsed), { addSuffix: true, locale: ptBR })}
                  </p>
                )}
              </div>
            </div>

            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Gerar um novo token invalidará o token atual. Todas as integrações que usam o token atual precisarão ser
                atualizadas.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Alert>
            <Key className="h-4 w-4" />
            <AlertTitle>Nenhum token ativo</AlertTitle>
            <AlertDescription>
              Você ainda não possui um token de API ativo. Gere um novo token para acessar a API do sistema.
            </AlertDescription>
          </Alert>
        )}

        {token && (
          <div className="space-y-2">
            <Label htmlFor="token">Seu novo token (copie agora)</Label>
            <div className="flex items-center space-x-2">
              <Input id="token" value={token} readOnly className="font-mono text-sm" />
              <Button size="icon" variant="outline" onClick={copyToken}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Este token só será exibido uma vez. Copie-o agora e armazene-o em um local seguro.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Como usar seu token</h3>
          <div className="rounded-md bg-muted p-4">
            <pre className="text-xs overflow-x-auto">
              <code>
                curl -X GET https://seu-dominio.com/api/contacts \<br />
                -H "Authorization: Bearer seu_token_aqui"
              </code>
            </pre>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={generateToken} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Gerando token...
            </>
          ) : (
            <>
              <Key className="mr-2 h-4 w-4" />
              {tokenInfo ? "Gerar novo token" : "Gerar token"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
