import { SecuritySettingsForm } from "@/components/security-settings-form"

export default function SecuritySettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Configurações de Segurança</h1>
          <SecuritySettingsForm />
        </div>
      </main>
    </div>
  )
}
