"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export function SetupApiTokenTable() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const setupTable = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/setup/api-token-table")
      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || "Erro desconhecido" })
      }
    } catch (error) {
      setResult({ success: false, message: "Erro ao conectar com o servidor" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuração da Tabela ApiToken</h3>
        <Button onClick={setupTable} disabled={isLoading}>
          {isLoading ? "Configurando..." : "Configurar Tabela ApiToken"}
        </Button>
      </div>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Sucesso" : "Erro"}</AlertTitle>
          </div>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground">
        <p>Este botão irá criar a tabela ApiToken no banco de dados se ela não existir.</p>
        <p>Use esta opção se você estiver enfrentando erros relacionados à tabela ApiToken.</p>
      </div>
    </div>
  )
}
