"use client"

import { LoginForm } from "@/components/login-form"
import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"
import { BarChart3, Users, TrendingUp, Shield, Zap, Target } from "lucide-react"

// Create a client component that uses useSearchParams
function LoginPageContent() {
  const router = useRouter()
  const { status } = useSession()

  // Check if user is already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      // Use direct window location change for more reliable redirection
      window.location.href = "/dashboard"
    }
  }, [status])

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side - Brand and Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-slate-900 flex-col justify-center items-center p-8 relative">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating geometric shapes with enhanced visibility */}
          <div className="absolute top-16 left-16 w-4 h-4 bg-orange-400/40 rounded-full animate-bounce-slow"></div>
          <div
            className="absolute top-24 right-24 w-3 h-3 bg-white/50 rounded-full animate-pulse-visible"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-32 left-12 w-5 h-5 bg-blue-300/30 rounded-full animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-1/3 right-16 w-2 h-2 bg-orange-300/60 rounded-full animate-ping-slow"
            style={{ animationDelay: "3s" }}
          ></div>
          <div
            className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-white/40 rounded-full animate-bounce-slow"
            style={{ animationDelay: "4s" }}
          ></div>

          {/* Animated lines/connections */}
          <div className="absolute top-20 left-20 w-16 h-0.5 bg-gradient-to-r from-orange-400/30 to-transparent animate-pulse-line"></div>
          <div
            className="absolute bottom-40 right-20 w-12 h-0.5 bg-gradient-to-l from-white/30 to-transparent animate-pulse-line"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Floating icons */}
          <div className="absolute top-1/4 left-1/4 animate-float-slow">
            <Zap className="w-6 h-6 text-orange-400/30" />
          </div>
          <div className="absolute bottom-1/3 right-1/4 animate-float-slow" style={{ animationDelay: "1.5s" }}>
            <Target className="w-5 h-5 text-white/30" />
          </div>

          {/* Enhanced grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full animate-grid-fade"
              style={{
                backgroundImage: `
                linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)
              `,
                backgroundSize: "60px 60px",
              }}
            ></div>
          </div>

          {/* Gradient orbs */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-2xl animate-pulse-orb"></div>
          <div
            className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-tr from-blue-300/15 to-transparent rounded-full blur-3xl animate-pulse-orb"
            style={{ animationDelay: "3s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-lg text-center">
          {/* Logo with enhanced animation */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl mx-auto mb-6 flex items-center justify-center transform hover:scale-110 hover:rotate-3 transition-all duration-500 animate-logo-glow p-3">
              <Image src="/logo-konverta.png" alt="Konverta Logo" width={58} height={58} className="object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 animate-title-glow">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text">Konverta</span>
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed font-light">
              Plataforma completa para gestão de leads e oportunidades
            </p>
          </div>

          {/* Feature Cards with enhanced animations */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="group bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl hover:bg-white/20 hover:border-orange-400/30 transition-all duration-500 hover:transform hover:scale-105 animate-card-entrance">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-lg group-hover:bg-orange-400/30 transition-all duration-300 group-hover:scale-110">
                  <Users className="w-6 h-6 text-white group-hover:text-orange-100" />
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2 text-lg group-hover:text-orange-100 transition-colors">
                Gestão Simplificada
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed">Organize seus contatos de forma eficiente</p>
            </div>

            <div
              className="group bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl hover:bg-white/20 hover:border-orange-400/30 transition-all duration-500 hover:transform hover:scale-105 animate-card-entrance"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-lg group-hover:bg-orange-400/30 transition-all duration-300 group-hover:scale-110">
                  <BarChart3 className="w-6 h-6 text-white group-hover:text-orange-100" />
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2 text-lg group-hover:text-orange-100 transition-colors">
                Análise de Dados
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed">Visualize métricas importantes em tempo real</p>
            </div>
          </div>

          {/* Stats with enhanced animations */}
          <div className="flex justify-center space-x-12">
            <div className="text-center group animate-stat-entrance">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400 group-hover:scale-125 group-hover:text-orange-300 transition-all duration-300" />
              </div>
              <div className="text-xl font-bold text-white group-hover:text-orange-100 transition-colors">98%</div>
              <div className="text-blue-200 text-xs">Satisfação</div>
            </div>
            <div className="text-center group animate-stat-entrance" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-orange-400 group-hover:scale-125 group-hover:text-orange-300 transition-all duration-300" />
              </div>
              <div className="text-xl font-bold text-white group-hover:text-orange-100 transition-colors">100%</div>
              <div className="text-blue-200 text-xs">Segurança</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 dark:bg-slate-900 relative">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden flex flex-col items-center pt-8 pb-6 px-6">
          <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-3 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform duration-300 p-2">
            <Image src="/logo-konverta.png" alt="Konverta Logo" width={52} height={52} className="object-contain" />
          </div>
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text">Konverta</span>
          </h1>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md animate-form-entrance">
            {/* Form Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo de volta</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 lg:p-8 hover:shadow-2xl transition-shadow duration-300">
              <LoginForm />

              {/* Footer Links */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Não tem uma conta?{" "}
                  <Link
                    href="https://wa.me/5579991190534?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20os%20planos."
                    target="_blank"
                    className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors hover:underline"
                  >
                    Fale Conosco
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Konverta. Todos os direitos reservados. v1.1.2
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
        <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl mx-auto mb-4"></div>
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2"></div>
            <div className="h-4 w-60 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
