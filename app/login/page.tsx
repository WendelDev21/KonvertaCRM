"use client"

import { LoginForm } from "@/components/login-form"
import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"

// Create a client component that uses useSearchParams
function LoginPageContent() {
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
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#1e3c72] to-[#2a5298] flex-col justify-center items-center p-6 relative">
        <div className="max-w-md text-center">
          <Image src="/favicon.png" alt="Konverta Logo" width={120} height={120} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Konverta</h1>
          <p className="text-white/90 text-lg mb-6">Plataforma completa para gestão de leads e oportunidades</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-white font-medium mb-1">Gestão Simplificada</h3>
              <p className="text-white/80 text-sm">Organize seus contatos de forma eficiente</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="text-white font-medium mb-1">Análise de Dados</h3>
              <p className="text-white/80 text-sm">Visualize métricas importantes em tempo real</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
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
          <Card className="border shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Bem-vindo de volta</CardTitle>
              <CardDescription className="text-center">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-4">
              <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <Link href="#" className="text-primary font-medium hover:underline">
                  Fale Conosco
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

// Main page component with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-10 w-40 bg-muted rounded mx-auto mb-4"></div>
            <div className="h-6 w-60 bg-muted rounded mx-auto"></div>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
