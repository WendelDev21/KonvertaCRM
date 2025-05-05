"use client"

import { LoginForm } from "@/components/login-form"
import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">MC</span>
            </div>
            <h1 className="text-2xl font-bold">Mini CRM</h1>
          </div>
          <ThemeToggle />
        </div>

        <Card className="border-2 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Konverta CRM</CardTitle>
            <CardDescription className="text-center">Entre com suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-4">
            <div className="text-center text-sm">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Registre-se
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Mini CRM. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

// Main page component with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
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
