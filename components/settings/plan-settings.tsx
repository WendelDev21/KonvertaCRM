"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PlanInfo {
  plan: string
  limits: {
    contacts: { max: number | null; current: number }
    webhooks: { max: number | null; current: number }
  }
}

export function PlanSettings() {
  const { data: session } = useSession()
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlanInfo() {
      try {
        const response = await fetch("/api/user/plan")
        if (!response.ok) throw new Error("Falha ao carregar informações do plano")
        const data = await response.json()
        setPlanInfo(data)
      } catch (error) {
        console.error("Erro ao carregar plano:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as informações do plano",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchPlanInfo()
    }
  }, [session])

  const formatLimit = (limit: number | null) => {
    return limit === null ? "Ilimitado" : limit.toString()
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

  const getUsagePercentage = (current: number, max: number | null) => {
    if (max === null) return 0
    return Math.min(100, Math.round((current / max) * 100))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando informações do plano...</span>
      </div>
    )
  }

  if (!planInfo) {
    return (
      <div className="flex justify-center items-center h-64 text-destructive">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>Não foi possível carregar as informações do plano</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Seu Plano</h2>
        <Badge className={`text-sm py-1 ${getPlanColor(planInfo.plan)}`}>{getPlanName(planInfo.plan)}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plano Starter */}
        <Card className={`border-2 ${planInfo.plan === "starter" ? "border-blue-500" : "border-transparent"}`}>
          <CardHeader>
            <CardTitle>Starter</CardTitle>
            <CardDescription>Para quem está começando</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Contatos</span>
                  <span className="font-medium">100</span>
                </div>
                <div className="flex justify-between">
                  <span>Webhooks</span>
                  <span className="font-medium">1</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {planInfo.plan === "starter" ? (
              <Button disabled className="w-full bg-blue-500 hover:bg-blue-600">
                <Check className="mr-2 h-4 w-4" />
                Plano Atual
              </Button>
            ) : (
              <Button disabled className="w-full">
                Fazer Downgrade
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Plano Pro */}
        <Card className={`border-2 ${planInfo.plan === "pro" ? "border-purple-500" : "border-transparent"}`}>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>Para profissionais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Contatos</span>
                  <span className="font-medium">Ilimitados</span>
                </div>
                <div className="flex justify-between">
                  <span>Webhooks</span>
                  <span className="font-medium">5</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {planInfo.plan === "pro" ? (
              <Button disabled className="w-full bg-purple-500 hover:bg-purple-600">
                <Check className="mr-2 h-4 w-4" />
                Plano Atual
              </Button>
            ) : (
              <Button disabled className="w-full">
                {planInfo.plan === "business" ? "Fazer Downgrade" : "Fazer Upgrade"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Plano Business */}
        <Card className={`border-2 ${planInfo.plan === "business" ? "border-green-500" : "border-transparent"}`}>
          <CardHeader>
            <CardTitle>Business</CardTitle>
            <CardDescription>Para empresas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Contatos</span>
                  <span className="font-medium">Ilimitados</span>
                </div>
                <div className="flex justify-between">
                  <span>Webhooks</span>
                  <span className="font-medium">Ilimitados</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {planInfo.plan === "business" ? (
              <Button disabled className="w-full bg-green-500 hover:bg-green-600">
                <Check className="mr-2 h-4 w-4" />
                Plano Atual
              </Button>
            ) : (
              <Button disabled className="w-full">
                Fazer Upgrade
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Uso Atual</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Contatos</span>
              <span>
                {planInfo.limits.contacts.current} / {formatLimit(planInfo.limits.contacts.max)}
              </span>
            </div>
            {planInfo.limits.contacts.max !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: `${getUsagePercentage(planInfo.limits.contacts.current, planInfo.limits.contacts.max)}%`,
                  }}
                ></div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Webhooks</span>
              <span>
                {planInfo.limits.webhooks.current} / {formatLimit(planInfo.limits.webhooks.max)}
              </span>
            </div>
            {planInfo.limits.webhooks.max !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: `${getUsagePercentage(planInfo.limits.webhooks.current, planInfo.limits.webhooks.max)}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>Para alterar seu plano, entre em contato com o suporte.</p>
      </div>
    </div>
  )
}
