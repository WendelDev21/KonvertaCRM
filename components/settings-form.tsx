"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, User, Bell, Loader2, Key, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

export function SettingsForm() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { data: session, update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Estados para as configurações
  const [profileSettings, setProfileSettings] = useState({
    name: "",
    email: "",
  })

  // Estado para alteração de senha
  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newContactAlert: true,
    statusChangeAlert: true,
    dailySummary: false,
  })

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "system",
  })

  // Buscar dados do usuário
  const fetchUserData = async () => {
    setIsLoadingData(true)
    try {
      try {
        // Tentar buscar do servidor primeiro
        const response = await fetch("/api/users/me")

        if (!response.ok) {
          console.warn("API de busca falhou, usando localStorage como fallback")
        } else {
          const userData = await response.json()

          // Atualizar estados com os dados do usuário
          setProfileSettings({
            name: userData.name || "",
            email: userData.email || "",
          })

          // Configurações de notificação
          if (userData.notificationSettings) {
            try {
              const notifSettings =
                typeof userData.notificationSettings === "string"
                  ? JSON.parse(userData.notificationSettings)
                  : userData.notificationSettings

              setNotificationSettings({
                emailNotifications: notifSettings.emailNotifications ?? true,
                newContactAlert: notifSettings.newContactAlert ?? true,
                statusChangeAlert: notifSettings.statusChangeAlert ?? true,
                dailySummary: notifSettings.dailySummary ?? false,
              })
            } catch (e) {
              console.error("Erro ao processar configurações de notificação:", e)
            }
          }

          // Configurações de aparência
          setAppearanceSettings({
            theme: userData.theme || theme || "system",
          })

          setIsLoadingData(false)
          return
        }
      } catch (error) {
        console.error("Erro ao buscar do servidor:", error)
        // Continuamos com o fallback local
      }

      // Buscar do localStorage como fallback
      if (typeof window !== "undefined") {
        // Buscar configurações
        const savedSettings = localStorage.getItem("userSettings")
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings)

            setProfileSettings({
              name: session?.user?.name || "",
              email: session?.user?.email || "",
            })

            if (parsedSettings.notificationSettings) {
              setNotificationSettings(parsedSettings.notificationSettings)
            }

            if (parsedSettings.theme) {
              setAppearanceSettings({
                theme: parsedSettings.theme,
              })
            }
          } catch (e) {
            console.error("Erro ao processar configurações salvas:", e)
          }
        } else {
          // Se não houver configurações salvas, usar dados da sessão
          setProfileSettings({
            name: session?.user?.name || "",
            email: session?.user?.email || "",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas configurações.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Evitar problemas de hidratação e carregar dados do usuário
  useEffect(() => {
    setMounted(true)
    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  // Atualizar tema quando mudar
  useEffect(() => {
    if (mounted) {
      // Sincronizar o estado local com o tema atual
      if (theme && appearanceSettings.theme !== theme) {
        setAppearanceSettings((prev) => ({ ...prev, theme }))
      } else if (appearanceSettings.theme) {
        setTheme(appearanceSettings.theme)
      }
    }
  }, [mounted, appearanceSettings.theme, theme, setTheme])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleAppearanceChange = (name: string, value: string | boolean) => {
    if (name === "theme") {
      setTheme(value as string)
      // Atualizar o estado local após definir o tema
      setAppearanceSettings((prev) => ({ ...prev, [name]: value }))
    } else {
      setAppearanceSettings((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Verificar se as senhas coincidem caso esteja alterando a senha
      if (passwordSettings.newPassword || passwordSettings.confirmPassword) {
        if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem. Por favor, verifique e tente novamente.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        if (!passwordSettings.currentPassword) {
          toast({
            title: "Erro",
            description: "Por favor, informe sua senha atual para alterá-la.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // Preparar dados para enviar
      const userData = {
        name: profileSettings.name,
        email: profileSettings.email,
        theme: appearanceSettings.theme,
        notificationSettings: notificationSettings,
      }

      // Adicionar dados de senha apenas se estiver alterando a senha
      if (passwordSettings.newPassword && passwordSettings.currentPassword) {
        Object.assign(userData, {
          currentPassword: passwordSettings.currentPassword,
          newPassword: passwordSettings.newPassword,
        })
      }

      try {
        // Tentar enviar para o servidor primeiro
        const response = await fetch("/api/users/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao atualizar configurações")
        } else {
          const updatedUser = await response.json()

          // Atualizar a sessão com os novos dados
          if (session) {
            await updateSession({
              ...session,
              user: {
                ...session.user,
                name: updatedUser.name,
                email: updatedUser.email,
              },
            })
          }

          // Limpar campos de senha
          setPasswordSettings({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })

          toast({
            title: "Configurações salvas",
            description: "Suas configurações foram salvas com sucesso.",
            variant: "success",
          })

          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error("Erro ao atualizar no servidor:", error)
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao atualizar configurações",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar suas configurações.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2" disabled>
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
        </TabsList>

        {/* Configurações de Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Gerencie suas informações pessoais e como elas aparecem no sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={profileSettings.name}
                  onChange={handleProfileChange}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileSettings.email}
                  onChange={handleProfileChange}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  value={appearanceSettings.theme}
                  onValueChange={(value) => handleAppearanceChange("theme", value)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha para manter sua conta segura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordSettings.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordSettings.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua nova senha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordSettings.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirme sua nova senha"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-md">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">
                  Escolha uma senha forte com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números
                  e símbolos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure como e quando você deseja receber notificações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Notificações por email</Label>
                  <p className="text-sm text-muted-foreground">Receba atualizações por email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newContactAlert">Alerta de novos contatos</Label>
                  <p className="text-sm text-muted-foreground">Seja notificado quando um novo contato for adicionado</p>
                </div>
                <Switch
                  id="newContactAlert"
                  checked={notificationSettings.newContactAlert}
                  onCheckedChange={(checked) => handleNotificationChange("newContactAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="statusChangeAlert">Alerta de mudança de status</Label>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado quando o status de um contato for alterado
                  </p>
                </div>
                <Switch
                  id="statusChangeAlert"
                  checked={notificationSettings.statusChangeAlert}
                  onCheckedChange={(checked) => handleNotificationChange("statusChangeAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dailySummary">Resumo diário</Label>
                  <p className="text-sm text-muted-foreground">Receba um resumo diário das atividades</p>
                </div>
                <Switch
                  id="dailySummary"
                  checked={notificationSettings.dailySummary}
                  onCheckedChange={(checked) => handleNotificationChange("dailySummary", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
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
