import { ReportsClient } from "@/components/reports/reports-client"
import { FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <FileText className="h-8 w-8 text-primary" />
                <span>Relatórios</span>
              </h1>
              <p className="text-muted-foreground mt-1">Obtenha insights valiosos sobre seus dados</p>
            </div>
          </div>
          <div className="h-full">
            <ReportsClient />
          </div>
        </div>
      </main>
    </div>
  )
}
