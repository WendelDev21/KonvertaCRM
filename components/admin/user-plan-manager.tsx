"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { UserPlan } from "@/lib/types/user-types"

interface UserPlanManagerProps {
  userId: string
  userName: string
  currentPlan: UserPlan
  onPlanUpdated?: () => void
}

export function UserPlanManager({ userId, userName, currentPlan, onPlanUpdated }: UserPlanManagerProps) {
  const [selectedPlan, setSelectedPlan] = useState<UserPlan>(currentPlan)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdatePlan = async () => {
    if (selectedPlan === currentPlan) {
      toast({
        title: "Informação",
        description: "O usuário já está neste plano.",
      })
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch("/api/user/plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          plan: selectedPlan,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao atualizar plano")
      }

      toast({
        title: "Sucesso",
        description: `Plano de ${userName} atualizado para ${getPlanName(selectedPlan)}`,
        variant: "success",
      })

      if (onPlanUpdated) {
        onPlanUpdated()
      }
    } catch (error) {
      console.error("Erro ao atualizar plano:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar plano",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getPlanName = (plan: string) => {
    switch (plan) {
      case "starter":
        return "Starter"
      case "pro":
        return "Pro"
      case "business":
        return "Business"
      default:
        return "Desconhecido"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "starter":
        return "bg-blue-100 text-blue-800"
      case "pro":
        return "bg-purple-100 text-purple-800"
      case "business":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Plano de {userName}</h3>
        <Badge className={`${getPlanColor(currentPlan)}`}>{getPlanName(currentPlan)}</Badge>
      </div>

      <div className="flex items-center space-x-2">
        <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as UserPlan)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione um plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleUpdatePlan} disabled={isUpdating || selectedPlan === currentPlan}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            "Atualizar Plano"
          )}
        </Button>
      </div>
    </div>
  )
}
