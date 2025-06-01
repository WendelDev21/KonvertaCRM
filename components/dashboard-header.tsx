"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Kanban, Menu, Users, Puzzle, Settings, PlusCircle, ShieldAlert, Wallet, HelpCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"

export function DashboardHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Add this line to get the user's plan
  const userPlan = session?.user ? (session.user as any).plan || "Starter" : "Starter"

  // Add a function to get the badge color based on the plan
  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "Pro":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Business":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      default: // Starter
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    }
  }

  // Verificar se o usuário é admin
  const isAdmin = session?.user && (session.user as any).role === "admin"

  const mainNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Contatos",
      path: "/contacts",
      icon: Users,
    },
    {
      name: "Kanban",
      path: "/kanban",
      icon: Kanban,
    },
    {
      name: "Integrações",
      path: "/integrations",
      icon: Puzzle,
    },
  ]

  // Adicionar link de administração apenas para admins
  if (isAdmin) {
    mainNavItems.push({
      path: "/admin",
      name: "Administração",
      icon: ShieldAlert,
      active: pathname === "/admin" || pathname.startsWith("/admin/"),
    })
  }

  const settingsNavItems = [
    {
      name: "Configurações",
      path: "/settings",
      icon: Settings,
    },
    {
      name: "Upgrades",
      path: "/settings/upgrades",
      icon: Wallet,
    },
    {
      name: "Suporte",
      path: "/settings/help",
      icon: HelpCircle,
    },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo e navegação principal */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/favicon.png" alt="Konverta Logo" className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Konverta</span>
            </Link>

            {/* Menu para desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.path
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn("nav-item", isActive ? "nav-item-active" : "nav-item-inactive")}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Ações e perfil */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center ml-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPlanBadgeColor(userPlan)}`}>
                {userPlan}
              </span>
            </div>
            {/* Botão de novo contato */}
              <Button variant="default" size="sm" className="hidden sm:flex" asChild>
                <Link href="/contacts/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Novo Contato</span>
                </Link>
              </Button>
            {/* Alternador de tema */}
            <ThemeToggle />

            {/* Avatar do usuário */}
            <UserAvatar />           

            {/* Menu móvel */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="py-4">
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/favicon.png" alt="Konverta Logo" className="w-10 h-10" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Konverta</span>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {/* Itens principais */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Principal</h3>
                      {mainNavItems.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            pathname === item.path
                              ? "bg-primary/10 text-primary dark:bg-primary/20"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Configurações */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Configurações</h3>
                      {settingsNavItems.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            pathname === item.path
                              ? "bg-primary/10 text-primary dark:bg-primary/20"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Ações rápidas */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Ações</h3>
                      <Button variant="default" className="w-full justify-start" asChild>
                        <Link href="/contacts/new">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Novo Contato
                        </Link>
                      </Button>
                    </div>

                    {/* Perfil e logout */}
                    {session?.user && (
                      <div className="mt-auto pt-6">
                        <div className="px-2 py-4 border-t">
                          <div className="flex items-center gap-3 mb-4">
                            <UserAvatar />
                            <div>
                              <p className="font-medium">{session.user.name}</p>
                              <p className="text-xs text-muted-foreground">{session.user.email}</p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${getPlanBadgeColor(userPlan)}`}
                              >
                                {userPlan}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-destructive"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                          >
                            <span>Sair</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
