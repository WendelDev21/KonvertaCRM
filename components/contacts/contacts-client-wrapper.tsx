"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import components with SSR disabled
const ContactFilters = dynamic(
  () => import("@/components/contact-filters").then((mod) => ({ default: mod.ContactFilters })),
  { ssr: false },
)

const ContactsTable = dynamic(
  () => import("@/components/contacts-table").then((mod) => ({ default: mod.ContactsTable })),
  { ssr: false },
)

export function ContactsClientWrapper() {
  return (
    <div className="shadow-sm rounded-lg border bg-card text-card-foreground">
      <div className="p-6">
        <Suspense fallback={<div className="h-16 flex items-center justify-center">Carregando filtros...</div>}>
          <ContactFilters />
        </Suspense>
        <div className="mt-4">
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Carregando contatos...</div>}>
            <ContactsTable />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
