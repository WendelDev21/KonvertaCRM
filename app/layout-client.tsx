"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { DashboardHeader } from "@/components/dashboard-header"
import type { ReactNode } from "react"

export function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { status } = useSession()

  // Não mostrar o header nas páginas de login e registro
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const showHeader = !isAuthPage || status === "authenticated"

  return (
    <div className="main-layout">
      {showHeader && <DashboardHeader />}
      <div className="main-content">{children}</div>
    </div>
  )
}
