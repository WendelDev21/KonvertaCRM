"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Key, AlertTriangle, Check, Copy, Clock, Shield, Calendar, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface TokenInfo {
  id: string
  name: string
  createdAt: string
  lastUsed: string | null
  expiresAt: string | null
  isActive: boolean
}

export function ApiTokenManager() {
  const [token, setToken] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { toast } = useToast()

  // Buscar informações do token atual
  const fetchTokenInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tokens")

      if (!response.ok) {
        if (response.status === 404) {
          // Não há tokens, isso é esperado para novos usuários
          setTokenInfo(null)
          return
        }
        throw new Error(`Erro ao buscar tokens: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.tokens && data.tokens.length > 0) {
        // Encontrar o token ativo
        const activeToken = data.tokens.find((t: TokenInfo) => t.isActive)
        setTokenInfo(activeToken || null)
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

  // Gerar novo token
  const generateToken = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "API Token" }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao gerar token: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      if (!data.token) {
        throw new Error("Token não retornado pelo servidor")
      }

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
      setShowConfirmDialog(false)
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

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      relative: formatDistanceToNow(date, { addSuffix: true, locale: ptBR }),
      full: format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
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
        {isLoading ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tokenInfo ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Token ativo</p>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700 text-white px-2 py-1">
                    <Check className="mr-1 h-3 w-3" />
                    Ativo
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <div>
                    <p>Criado {formatDate(tokenInfo.createdAt).relative}</p>
                    <p className="text-[10px] opacity-80">{formatDate(tokenInfo.createdAt).full}</p>
                  </div>
                </div>

                {tokenInfo.lastUsed && (
                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                    <Clock className="h-3.5 w-3.5" />
                    <div>
                      <p>Último uso {formatDate(tokenInfo.lastUsed).relative}</p>
                      <p className="text-[10px] opacity-80">{formatDate(tokenInfo.lastUsed).full}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-md border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/40 p-4 shadow-[0_0_15px_rgba(255,0,0,0.15)] dark:shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-red-600 dark:text-red-500">ATENÇÃO</h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Gerar um novo token <span className="font-bold">invalidará imediatamente</span> o token atual. Todas
                    as integrações que usam o token atual precisarão ser atualizadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Nenhum token ativo</AlertTitle>
              <AlertDescription>
                Você ainda não possui um token de API ativo. Gere um novo token para acessar a API do sistema.
              </AlertDescription>
            </Alert>

            <div className="rounded-md border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/40 p-4 shadow-[0_0_15px_rgba(255,0,0,0.15)] dark:shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-red-600 dark:text-red-500">IMPORTANTE</h3>
                  <div className="text-sm text-red-700 dark:text-red-400">
                    <p className="mb-2">Ao gerar um token de API:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        <span className="font-semibold">Copie e guarde</span> o token em um local seguro
                      </li>
                      <li>
                        O token <span className="font-semibold">só será exibido uma única vez</span>
                      </li>
                      <li>
                        Se você gerar um novo token, o anterior será <span className="font-semibold">invalidado</span>
                      </li>
                      <li>
                        <span className="font-semibold">Não compartilhe</span> seu token com terceiros
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {token && (
          <div className="space-y-2 bg-muted p-4 rounded-md border border-primary">
            <div className="flex items-center justify-between">
              <Label htmlFor="token" className="text-primary font-medium">
                Seu novo token (copie agora)
              </Label>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Novo
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="token"
                value={token}
                readOnly
                className="font-mono text-sm bg-background border-primary/50 focus-visible:ring-primary"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copyToken}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              ⚠️ Este token só será exibido uma vez. Copie-o agora e armazene-o em um local seguro.
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
        {tokenInfo ? (
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Gerar novo token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar geração de novo token</DialogTitle>
                <DialogDescription>
                  Ao gerar um novo token, o token atual será invalidado imediatamente. Todas as integrações que usam o
                  token atual precisarão ser atualizadas.
                </DialogDescription>
              </DialogHeader>
              <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 dark:border-red-600 rounded-md p-3 mt-2 shadow-[0_0_15px_rgba(255,0,0,0.15)] dark:shadow-[0_0_15px_rgba(255,0,0,0.25)]">
                <div className="flex gap-2 text-red-600 dark:text-red-500">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-semibold">
                    Esta ação não pode ser desfeita. O token atual deixará de funcionar.
                  </p>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={generateToken}
                  disabled={isGenerating}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar novo token"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button onClick={generateToken} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Gerando token...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Gerar token
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
