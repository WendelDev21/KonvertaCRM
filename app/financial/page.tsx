import { FinancialClient } from "@/components/financial/financeiro-client"

export default function financialPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="container mx-auto py-6">
              <h1 className="text-3xl font-bold mb-6">Financeiro</h1>
              <FinancialClient />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
