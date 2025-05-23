import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown } from "lucide-react"
import { getCurrentUser } from "@/lib/session"
import { getUserById } from "@/lib/services/user-service"
import { redirect } from "next/navigation"

export default async function UpgradesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar dados completos do usuário para obter o plano atual
  const [userData, error] = await getUserById(user.id)

  if (error || !userData) {
    redirect("/login")
  }

  const currentPlan = userData.plan || "Starter"

  const plans = [
    {
      id: "Starter",
      name: "Starter",
      description: "Ideal para pequenos negócios",
      price: "R$49,90",
      period: "/mês",
      features: [
        "Até 100 contatos", 
        "Até 1 webhook",
        "Kanban board", 
        "API de integração"],
      popular: false,
    },
    {
      id: "Pro",
      name: "Pro",
      description: "Para empresas em crescimento",
      price: "R$99,90",
      period: "/mês",
      features: [
        "Contatos ilimitados",
        "Até 5 webhooks",
        "Kanban board",
        "Suporte prioritário",
        "API de integração",
      ],
      popular: true,
    },
    {
      id: "Business",
      name: "Business",
      description: "Para empresas estabelecidas",
      price: "R$249",
      period: "/mês",
      features: [
        "Contatos ilimitados",
        "Webhooks ilimitados",
        "Kanban board",
        "Suporte 24/7",
        "API de integração",
        "Integrações gratuitas",
      ],
      popular: false,
    },
  ]

  const getButtonText = (planId: string) => {
    if (planId === currentPlan) {
      return "Plano Atual"
    }

    const planOrder = ["Starter", "Pro", "Business"]
    const currentIndex = planOrder.indexOf(currentPlan)
    const targetIndex = planOrder.indexOf(planId)

    if (targetIndex > currentIndex) {
      return "Fazer Upgrade"
    } else {
      return "Fazer Downgrade"
    }
  }

  const getButtonVariant = (planId: string) => {
    if (planId === currentPlan) {
      return "secondary"
    }

    const planOrder = ["Starter", "Pro", "Business"]
    const currentIndex = planOrder.indexOf(currentPlan)
    const targetIndex = planOrder.indexOf(planId)

    if (targetIndex > currentIndex) {
      return "default"
    } else {
      return "outline"
    }
  }

  const isCurrentPlan = (planId: string) => planId === currentPlan

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upgrades</h1>
            <p className="text-muted-foreground">
              Escolha o plano ideal para o seu negócio. Plano atual:{" "}
              <span className="font-semibold text-foreground">{currentPlan}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`border-2 flex flex-col relative overflow-hidden transition-all duration-200 ${
                  isCurrentPlan(plan.id)
                    ? "border-primary bg-primary/5 shadow-lg"
                    : plan.popular
                      ? "border-primary"
                      : "border-muted hover:border-primary/50"
                }`}
              >
                {/* Badge para plano atual */}
                {isCurrentPlan(plan.id) && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Atual
                  </div>
                )}

                {/* Badge para plano popular (apenas se não for o atual) */}
                {plan.popular && !isCurrentPlan(plan.id) && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    Popular
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {isCurrentPlan(plan.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Seu plano
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button className="w-full" variant={getButtonVariant(plan.id)} disabled={isCurrentPlan(plan.id)}>
                    {getButtonText(plan.id)}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Informações adicionais */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Todos os planos incluem 30 dias. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
