"use client"

import { HelpCircle, LogOut, Settings, Wallet, FileText, Puzzle, Share2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function UserAvatar() {
  const { data: session } = useSession()
  const router = useRouter()

  // Get user data from session
  const userData = {
    name: session?.user?.name || "Usuário",
    email: session?.user?.email || "usuario@exemplo.com",
    role: (session?.user as any)?.role || "user",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User Avatar"} />
            <AvatarFallback>{session?.user?.name?.slice(0, 2).toUpperCase() ?? "US"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
            {userData.role === "admin" && <p className="text-xs font-medium text-primary">Administrador</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/integrations")}>
          <Puzzle className="mr-2 h-4 w-4" />
          <span>Integrações</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/connections")}>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Conexões</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings/upgrades")}>
          <Wallet className="mr-2 h-4 w-4" />
          <span>Upgrades</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/reports")}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Relatórios</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings/help")}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Suporte</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}>
          <LogOut className="mr-2 h-4 w-full justify-start text-destructive" />
          <span className="justify-start text-destructive">Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
