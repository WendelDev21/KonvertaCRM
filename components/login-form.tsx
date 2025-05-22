"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, Mail, Lock } from "lucide-react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Add this near the top of your component where you handle errors
  const error = searchParams?.get("error")

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    remember: false,
  })

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRememberChange = (checked: boolean) => {
    setLoginData((prev) => ({ ...prev, remember: checked }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null) // Clear previous errors

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })

      if (result?.error) {
        // Set a more user-friendly error message
        setFormError("Email ou senha incorretos. Verifique suas credenciais ou registre-se para criar uma conta.")
        toast({
          title: "Falha no login",
          description: "Email ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Redirecionando para o dashboard...",
        variant: "success",
      })

      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      setFormError("Ocorreu um erro ao tentar fazer login. Tente novamente.")
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro ao tentar fazer login. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={loginData.email}
              onChange={handleLoginChange}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              value={loginData.password}
              onChange={handleLoginChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="remember" checked={loginData.remember} onCheckedChange={handleRememberChange} />
          <label
            htmlFor="remember"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Lembrar de mim
          </label>
        </div>

        {error === "AccountDisabled" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p className="font-bold">Conta desativada</p>
            <p>Sua conta foi desativada. Entre em contato com o administrador do sistema.</p>
          </div>
        )}

        {formError && <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">{formError}</div>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </div>
  )
}
