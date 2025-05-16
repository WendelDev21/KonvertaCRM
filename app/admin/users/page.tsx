import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UsersManagement } from "@/components/admin/users-management"

export const metadata: Metadata = {
  title: "Gerenciamento de Usuários | Konverta CRM",
  description: "Gerenciamento de usuários do Konverta CRM",
}

export default async function UsersManagementPage() {
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
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Usuários</h1>
      <UsersManagement />
    </div>
  )
}
