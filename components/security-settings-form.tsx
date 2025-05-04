"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Shield, Key, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function SecuritySettingsForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Estados para as configurações de segurança
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: "30",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSecurityChange = (name: string, value: string | boolean) => {
    setSecuritySettings((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulando envio para API
      console.log("Configurações de segurança:", securitySettings)

      // Verificar se está alterando a senha
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem!",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        console.log("Alteração de senha solicitada")
      }

      // Aguardar um pouco para simular o envio
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mostrar mensagem de sucesso
      toast({
        title: "Configurações salvas",
        description: "Configurações de segurança salvas com sucesso!",
        variant: "success",
      })

      // Limpar campos de senha
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações de segurança:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de segurança.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Configurações de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>Configure as opções de segurança para proteger sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="twoFactorAuth">Autenticação de dois fatores</Label>
              <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança à sua conta</p>
            </div>
            <Switch
              id="twoFactorAuth"
              checked={securitySettings.twoFactorAuth}
              onCheckedChange={(checked) => handleSecurityChange("twoFactorAuth", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="loginNotifications">Notificações de login</Label>
              <p className="text-sm text-muted-foreground">Receba notificações quando sua conta for acessada</p>
            </div>
            <Switch
              id="loginNotifications"
              checked={securitySettings.loginNotifications}
              onCheckedChange={(checked) => handleSecurityChange("loginNotifications", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Tempo limite da sessão (minutos)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min="5"
              max="120"
              value={securitySettings.sessionTimeout}
              onChange={(e) => handleSecurityChange("sessionTimeout", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Sua sessão será encerrada após este período de inatividade</p>
          </div>
        </CardContent>
      </Card>

      {/* Alteração de Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Atualize sua senha para manter sua conta segura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Escolha uma senha forte com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e
              símbolos.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/settings")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Configurações
        </Button>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            "Salvando..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
