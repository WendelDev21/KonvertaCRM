"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function ApiTester() {
  const [endpoint, setEndpoint] = useState("/api/contacts")
  const [method, setMethod] = useState("GET")
  const [requestBody, setRequestBody] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      }

      if (method !== "GET" && requestBody) {
        try {
          options.body = requestBody
        } catch (e) {
          setResponse("Erro: Body JSON inválido")
          setLoading(false)
          return
        }
      }

      const res = await fetch(endpoint, options)
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Erro: ${error instanceof Error ? error.message : String(error)}`)
    }
    setLoading(false)
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Testador de API</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requisição</CardTitle>
            <CardDescription>Configure sua requisição API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/contacts"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method !== "GET" && (
              <div className="space-y-2">
                <Label htmlFor="body">Corpo da Requisição (JSON)</Label>
                <Textarea
                  id="body"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder='{"name": "Teste", "email": "teste@exemplo.com"}'
                  rows={8}
                />
              </div>
            )}

            <Button onClick={handleTest} disabled={loading}>
              {loading ? "Enviando..." : "Enviar Requisição"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resposta</CardTitle>
            <CardDescription>Resultado da requisição</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-sm">
              {response || "Nenhuma resposta ainda"}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
