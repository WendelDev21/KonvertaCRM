"use client"

import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const inter = Inter({ subsets: ["latin"] })

function MainLayout({ children }: { children: React.ReactNode }) {
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <MainLayout>{children}</MainLayout>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
