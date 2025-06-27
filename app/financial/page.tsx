import { FinancialClient } from "@/components/financial/financeiro-client"
import { DollarSign } from "lucide-react"

export default function financialPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-primary" />
                <span>Financeiro</span>
              </h1>
              <p className="text-muted-foreground mt-1">Gerencie suas finanças com facilidade</p> 
            </div>
          </div>
          <FinancialClient />
        </div>
      </main>
    </div>
  )
}
