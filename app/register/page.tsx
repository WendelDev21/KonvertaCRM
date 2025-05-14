"use client"

import { RegisterForm } from "@/components/register-form"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const { status } = useSession()

  // Check if user is already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [router, status])

  return (
    <div className="h-screen flex items-stretch overflow-hidden">
      {/* Left side - Decorative with updated gradient colors as requested */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex-col justify-center items-center p-6 relative">
        <div className="max-w-md text-center">
          <Image src="/icon.png" alt="Konverta Logo" width={120} height={120} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Konverta</h1>
          <p className="text-white/90 text-lg mb-6">
            Transforme seus leads em clientes com nossa plataforma inteligente
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-white font-medium mb-1">Kanban Intuitivo</h3>
              <p className="text-white/80 text-sm">Visualize e gerencie seu funil de vendas</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-white font-medium mb-1">Integrações</h3>
              <p className="text-white/80 text-sm">Conecte com suas ferramentas favoritas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 bg-background relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Mobile only logo */}
        <div className="md:hidden flex flex-col items-center mb-6">
          <Image src="/icon.png" alt="Konverta Logo" width={64} height={64} className="mb-2" />
          <h1 className="text-2xl font-bold">Konverta</h1>
        </div>

        <div className="w-full max-w-md">
          <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Crie sua conta</CardTitle>
              <CardDescription className="text-center">
                Preencha os dados abaixo para começar a usar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-4">
              <div className="text-center text-sm">
                Já possui uma conta?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Faça login
                </Link>
              </div>
            </CardFooter>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            &copy; {new Date().getFullYear()} Konverta. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
