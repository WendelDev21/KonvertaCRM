import { UsersManagement } from "@/components/users-management"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!user || (user as any).role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
          <UsersManagement />
        </div>
      </main>
    </div>
  )
}
