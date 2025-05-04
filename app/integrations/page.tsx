import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WebhookList } from "@/components/integrations/webhook-list"
import { ApiRoutesList } from "@/components/integrations/api-routes-list"

export default function IntegrationsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">Integrações</h1>
          </div>

          <Tabs defaultValue="webhooks" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="apis">APIs</TabsTrigger>
              <TabsTrigger value="external" disabled>
                Serviços Externos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webhooks">
              <div className="space-y-4">
                <div className="max-w-3xl">
                  <p className="text-muted-foreground mb-6">
                    Configure webhooks para notificar sistemas externos quando eventos ocorrerem no Mini CRM, como a
                    criação de um novo contato ou a mudança de status.
                  </p>
                </div>

                <WebhookList />
              </div>
            </TabsContent>

            <TabsContent value="apis">
              <div className="space-y-4">
                <div className="max-w-3xl">
                  <p className="text-muted-foreground mb-6">
                    Utilize as APIs do Mini CRM para integrar com outros sistemas e aplicações. Abaixo estão as rotas
                    básicas disponíveis para uso.
                  </p>
                </div>

                <ApiRoutesList />
              </div>
            </TabsContent>

            <TabsContent value="external">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Integração com serviços externos em desenvolvimento.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
