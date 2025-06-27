import { WebhookList } from "@/components/integrations/webhook-list"
import { Button } from "@/components/ui/button"
import { ExternalLink, Book, Puzzle } from "lucide-react"
import Link from "next/link"

export default function IntegrationsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Puzzle className="h-8 w-8 text-primary" />
                <span>Integrações</span>
              </h1>
              <p className="text-muted-foreground mt-1">Gerencie suas integrações com facilidade</p>
            </div>
          </div>

          <div className="space-y-6">
            <WebhookList />

            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-muted/50 rounded-lg border">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Documentação da API
                  </h3>
                  <p className="text-muted-foreground">
                    Acesse a documentação completa da API para integrar com sistemas externos
                  </p>
                </div>
                <Button asChild>
                  <Link href="/api-docs" className="flex items-center gap-2">
                    Ver Documentação
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
