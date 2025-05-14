"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Kanban, Menu, Users, Puzzle, Settings, PlusCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"

export function DashboardHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()

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

  const settingsNavItems = [
    {
      name: "Configurações",
      path: "/settings",
      icon: Settings,
    },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo e navegação principal */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/icon.png" alt="Konverta Logo" className="w-10 h-10" />              
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
            {/* Botão de novo contato */}
            <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
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
                    <img src="/icon.png" alt="Konverta Logo" className="w-10 h-10" />
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
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-destructive"
                            onClick={() => signOut()}
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
