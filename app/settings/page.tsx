import { SettingsForm } from "@/components/settings-form"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-3xl font-bold mb-6">Configurações</h1>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <SettingsForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
