import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiTokenManager } from "@/components/integrations/api-token-manager"
import { ApiRoutesList } from "@/components/integrations/api-routes-list"
import { WebhookList } from "@/components/integrations/webhook-list"

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Integrações</h1>

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
  )
}
