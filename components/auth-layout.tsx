"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { MainNav } from "@/components/main-nav"
import type { ReactNode } from "react"

export function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { status } = useSession()

  // Páginas que não devem mostrar o header quando não autenticado
  const publicPages = ["/login", "/register"]
  const isPublicPage = publicPages.includes(pathname || "")

  // Só mostra o header se o usuário estiver autenticado ou se não for uma página pública
  const showHeader = status === "authenticated" || !isPublicPage

  return (
    <>
      {showHeader && <MainNav />}
      {children}
    </>
  )
}
