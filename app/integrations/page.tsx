import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiTokenManager } from "@/components/integrations/api-token-manager"
import { ApiRoutesList } from "@/components/integrations/api-routes-list"
import { WebhookList } from "@/components/integrations/webhook-list"

export default function IntegrationsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Integrações</h1>
              <p className="text-muted-foreground mt-1">Gerencie suas integrações com facilidade</p>
            </div>
          </div>
          <Tabs defaultValue="webhooks">
            <TabsList className="mb-4">
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>
    
            <TabsContent value="webhooks" className="space-y-6">
              <WebhookList />
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <ApiTokenManager />
              <ApiRoutesList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
