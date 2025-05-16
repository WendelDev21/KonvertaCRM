import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Administração | Konverta CRM",
  description: "Painel administrativo do Konverta CRM",
}

export default async function AdminPage() {
  // Verificar se o usuário está autenticado e é admin
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
      <AdminDashboard />
    </div>
  )
}
