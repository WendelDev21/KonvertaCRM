"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, HelpCircle } from "lucide-react"

export function SettingsSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const menuItems = [
    {
      title: "Segurança",
      icon: Shield,
      href: "/settings/security",
      active: isActive("/settings/security"),
    },
    {
      title: "Ajuda",
      icon: HelpCircle,
      href: "/settings/help",
      active: isActive("/settings/help"),
    },
  ]

  return (
    <div className="w-full md:w-64 mb-6 md:mb-0">
      <div className="space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.href}
            variant={item.active ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
