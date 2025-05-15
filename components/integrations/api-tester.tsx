"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function ApiTester() {
  const [method, setMethod] = useState("GET")
  const [url, setUrl] = useState("/api/webhooks")
  const [body, setBody] = useState("")
  const [token, setToken] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleTest = async () => {
    setLoading(true)
    setResponse("")

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      }

      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }

      if (method !== "GET" && method !== "DELETE" && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const data = await res.json()

      setResponse(JSON.stringify(data, null, 2))

      toast({
        title: `${method} Request Completed`,
        description: `Status: ${res.status} ${res.statusText}`,
        variant: res.ok ? "default" : "destructive",
      })
    } catch (error) {
      console.error("API test error:", error)
      setResponse(error instanceof Error ? error.message : String(error))

      toast({
        title: "Error",
        description: "Failed to complete the request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Tester</CardTitle>
        <CardDescription>Test API endpoints directly from the browser</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="w-1/4">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input placeholder="URL (e.g., /api/webhooks)" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        </div>

        <div>
          <Input placeholder="API Token (optional)" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>

        {(method === "POST" || method === "PUT") && (
          <div>
            <Textarea
              placeholder="Request Body (JSON)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>
        )}

        <Button onClick={handleTest} disabled={loading}>
          {loading ? "Sending..." : "Send Request"}
        </Button>

        {response && (
          <div>
            <h4 className="text-sm font-medium mb-2">Response:</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs max-h-[300px] overflow-y-auto">
              <code>{response}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
