"use client"

import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function LoginClientWrapper() {
  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Konverta</CardTitle>
        <CardDescription className="text-center">Entre com suas credenciais para acessar o sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-[300px] flex items-center justify-center">Carregando formulário...</div>}>
          <LoginForm />
        </Suspense>
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
  )
}
