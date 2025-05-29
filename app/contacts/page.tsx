import { Suspense } from "react"
import { ContactsTable } from "@/components/contacts-table"
import { ContactFilters } from "@/components/contact-filters"
import { Card, CardContent } from "@/components/ui/card"

export default function ContactsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Contatos</h1>
              <p className="text-muted-foreground mt-1">Gerencie todos os seus contatos em um só lugar</p>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Suspense fallback={<div className="py-10 text-center">Carregando filtros...</div>}>
                <ContactFilters />
              </Suspense>
              <div className="mt-4">
                <Suspense fallback={<div className="py-10 text-center">Carregando contatos...</div>}>
                  <ContactsTable />
                </Suspense>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
