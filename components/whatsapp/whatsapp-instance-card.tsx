"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Wifi,
  WifiOff,
  QrCode,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  LogOut,
} from "lucide-react"
import { toast } from "sonner"

interface WhatsAppInstance {
  id: string
  instanceName: string
  status: string
  qrCode: string | null
  createdAt: string
  updatedAt: string
}

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance
  onInstanceUpdated: () => void
  onInstanceDeleted: () => void
}

export function WhatsAppInstanceCard({ instance, onInstanceUpdated, onInstanceDeleted }: WhatsAppInstanceCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return {
          label: "Conectado",
          icon: <CheckCircle className="h-4 w-4" />,
          color: "bg-green-500 text-white",
          variant: "default" as const,
        }
      case "CONNECTING":
        return {
          label: "Conectando",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: "bg-yellow-500 text-white",
          variant: "secondary" as const,
        }
      case "QR_UPDATED":
        return {
          label: "QR Code Disponível",
          icon: <QrCode className="h-4 w-4" />,
          color: "bg-blue-500 text-white",
          variant: "secondary" as const,
        }
      case "DISCONNECTED":
        return {
          label: "Desconectado",
          icon: <WifiOff className="h-4 w-4" />,
          color: "bg-red-500 text-white",
          variant: "destructive" as const,
        }
      case "CREATED":
        return {
          label: "Criado",
          icon: <Clock className="h-4 w-4" />,
          color: "bg-gray-500 text-white",
          variant: "outline" as const,
        }
      default:
        return {
          label: "Desconhecido",
          icon: <AlertCircle className="h-4 w-4" />,
          color: "bg-gray-500 text-white",
          variant: "outline" as const,
        }
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      console.log(`[Instance Card] Refreshing instance: ${instance.instanceName}`)
      const response = await fetch(`/api/connections/instances/${instance.instanceName}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar instância")
      }

      const data = await response.json()
      console.log(`[Instance Card] Refresh response:`, data)

      toast.success("Status atualizado com sucesso!")
      onInstanceUpdated()
    } catch (error) {
      console.error("Error refreshing instance:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar instância")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      console.log(`[Instance Card] Logging out instance: ${instance.instanceName}`)

      const response = await fetch(`/api/connections/instances/${instance.instanceName}/logout`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[Instance Card] Logout error response:", errorData)
        throw new Error(errorData.error || "Erro ao desconectar instância")
      }

      const data = await response.json()
      console.log("[Instance Card] Logout success response:", data)

      toast.success(`Instância "${instance.instanceName}" desconectada com sucesso!`)
      onInstanceUpdated()
    } catch (error) {
      console.error("Error logging out instance:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar instância")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log(`[Instance Card] Deleting instance: ${instance.instanceName}`)

      const response = await fetch(
        `/api/connections/instances?instanceName=${encodeURIComponent(instance.instanceName)}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[Instance Card] Delete error response:", errorData)
        throw new Error(errorData.error || "Erro ao deletar instância")
      }

      const data = await response.json()
      console.log("[Instance Card] Delete success response:", data)

      toast.success(`Instância "${instance.instanceName}" deletada com sucesso!`)
      onInstanceDeleted()
    } catch (error) {
      console.error("Error deleting instance:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao deletar instância")
    } finally {
      setIsDeleting(false)
    }
  }

  const statusInfo = getStatusInfo(instance.status)

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold truncate">{instance.instanceName}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={statusInfo.color}>
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        {instance.qrCode && instance.status !== "CONNECTED" && (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground text-center font-medium">
              Escaneie o QR Code com seu WhatsApp para conectar:
            </p>
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-blue-300">
              <img
                src={`data:image/png;base64,${instance.qrCode}`}
                alt="QR Code para conectar WhatsApp"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  console.error("Error loading QR code image")
                  e.currentTarget.style.display = "none"
                }}
                onLoad={() => {
                  console.log("QR code image loaded successfully")
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p className="font-medium">Como conectar:</p>
              <p>1. Abra o WhatsApp no seu celular</p>
              <p>2. Vá em Menu (⋮) → Dispositivos conectados</p>
              <p>3. Toque em "Conectar um dispositivo"</p>
              <p>4. Escaneie este código QR</p>
            </div>
          </div>
        )}

        {/* Connected Status */}
        {instance.status === "CONNECTED" && (
          <div className="flex flex-col items-center space-y-2 p-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg border">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <div className="relative">
                <Wifi className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-2 h-2 text-white" />
                </div>
              </div>
              <span className="font-semibold">WhatsApp Conectado!</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 text-center">
              Sua instância está online e pronta para enviar e receber mensagens.
            </p>
            <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Status: Online
            </div>
          </div>
        )}

        {/* No QR Code Available */}
        {!instance.qrCode && instance.status !== "CONNECTED" && (
          <div className="flex flex-col items-center space-y-2 p-4 text-muted-foreground">
            <QrCode className="h-8 w-8" />
            <p className="font-medium text-sm">QR Code não disponível</p>
            <p className="text-xs text-center">
              {instance.status === "CREATED"
                ? "Instância criada. Clique em 'Atualizar Status' para gerar o QR Code."
                : "Clique em 'Atualizar Status' para verificar a conexão."}
            </p>
          </div>
        )}

        {/* Instance Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>Criado: {new Date(instance.createdAt).toLocaleString("pt-BR")}</p>
          <p>Atualizado: {new Date(instance.updatedAt).toLocaleString("pt-BR")}</p>
        </div>

        {/* Action Buttons - Compact layout */}
        <div className="space-y-2 pt-2 border-t">
          {/* Primary Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full h-8 text-xs bg-transparent"
          >
            {isRefreshing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Atualizar Status
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            {instance.status === "CONNECTED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="h-8 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950 bg-transparent"
              >
                {isLoggingOut ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LogOut className="mr-1 h-3 w-3" />}
                Desconectar
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  className={`h-8 text-xs ${instance.status === "CONNECTED" ? "" : "col-span-2"}`}
                >
                  {isDeleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar a instância <strong>"{instance.instanceName}"</strong>?
                    <br />
                    <br />
                    Esta ação não pode ser desfeita e todas as mensagens associadas serão perdidas permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Deletar Instância
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
