import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminUsersManagement } from "@/components/admin/users-management"
import { AdminApiRoutesList } from "@/components/admin/api-routes-list"
import { AdminTokensManagement } from "@/components/admin/tokens-management"
import { ShieldAlert, Users, Key } from "lucide-react"

export const metadata: Metadata = {
  title: "Administração | Sistema CRM",
  description: "Painel de administração do sistema",
}

export default async function AdminPage() {
  // Verificar se o usuário está autenticado e é admin
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if ((session.user as any).role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">           
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <ShieldAlert className="h-8 w-8 text-primary" />
                <span>Administração do Sistema</span>
              </h1>
            </div>
          </div>    
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex items-center gap-1">
                <Key className="h-4 w-4" />
                <span>Tokens</span>
              </TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <AdminUsersManagement />
            </TabsContent>

            <TabsContent value="tokens" className="space-y-4">
              <AdminTokensManagement />
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <AdminApiRoutesList />
            </TabsContent>
          </Tabs>  
        </div>
      </main>
    </div>
  )
}
