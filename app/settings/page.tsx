import { SettingsForm } from "@/components/settings-form"
import { Card, CardContent } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Settings className="h-8 w-8 text-primary" />
            <span>Configurações</span>
          </h1>
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <SettingsForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
