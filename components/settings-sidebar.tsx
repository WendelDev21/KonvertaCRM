"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { User, Shield, CreditCard, Bell, Webhook, Key } from "lucide-react"
import { useSession } from "next-auth/react"

export function SettingsSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const sidebarItems = [
    {
      title: "Perfil",
      href: "/settings",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      title: "Segurança",
      href: "/settings/security",
      icon: <Shield className="h-4 w-4 mr-2" />,
    },
    {
      title: "Plano",
      href: "/settings/plan",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
    {
      title: "Notificações",
      href: "/settings/notifications",
      icon: <Bell className="h-4 w-4 mr-2" />,
    },
    {
      title: "Webhooks",
      href: "/settings/webhooks",
      icon: <Webhook className="h-4 w-4 mr-2" />,
    },
    {
      title: "API Keys",
      href: "/settings/api-keys",
      icon: <Key className="h-4 w-4 mr-2" />,
    },
  ]

  // Adicionar item de usuários apenas para admins
  if (session?.user?.role === "admin") {
    sidebarItems.push({
      title: "Usuários",
      href: "/settings/users",
      icon: <User className="h-4 w-4 mr-2" />,
    })
  }

  return (
    <div className="w-full md:w-64 space-y-4">
      <div className="space-y-1">
        {sidebarItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
            )}
            asChild
          >
            <Link href={item.href}>
              {item.icon}
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
