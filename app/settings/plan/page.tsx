import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PlanSettings } from "@/components/settings/plan-settings"

export const metadata: Metadata = {
  title: "Plano | Konverta CRM",
  description: "Gerenciamento de plano do Konverta CRM",
}

export default async function PlanPage() {
  // Verificar se o usuário está autenticado
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Seu Plano</h1>
      <PlanSettings />
    </div>
  )
}
