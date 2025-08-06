"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DollarSign, Wallet, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

export default function CreditsPage() {
  const { data: session, update } = useSession()
  const [userCredits, setUserCredits] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [recharging, setRecharging] = useState<number | null>(null)

  useEffect(() => {
    // Only load credits if the user session is available and the user ID is stable
    if (session?.user?.id) {
      loadUserCredits()
    }
  }, [session?.user?.id]) // Depend on session.user.id to prevent unnecessary re-fetches

  const loadUserCredits = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users/me")
      if (response.ok) {
        const data = await response.json()
        const credits = typeof data.credits === 'number' ? data.credits : 0;
        setUserCredits(credits)
        // Only update session if the credits value has actually changed to avoid infinite loops
        if (session?.user && (session.user as any).credits !== credits) {
          update({ credits: credits })
        }
      } else {
        toast.error("Erro ao carregar créditos do usuário.")
      }
    } catch (error) {
      console.error("Error loading user credits:", error)
      toast.error("Erro ao carregar créditos do usuário.")
    } finally {
      setLoading(false)
    }
  }

  const handleRecharge = async (amount: number) => {
    setRecharging(amount)
    try {
      const response = await fetch("/api/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        const data = await response.json()
        const newCredits = typeof data.credits === 'number' ? data.credits : 0;
        setUserCredits(newCredits)
        update({ credits: newCredits }) // Update session with latest credits
        toast.success(`Recarga de R$${amount.toFixed(2)} realizada com sucesso!`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao realizar recarga.")
      }
    } catch (error) {
      console.error("Error recharging credits:", error)
      toast.error("Erro ao realizar recarga.")
    } finally {
      setRecharging(null)
    }
  }

  const rechargeOptions = [20, 50, 100]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span>Recarga de Créditos</span>
          </h1>
          <p className="text-muted-foreground">Adicione créditos para enviar suas campanhas de mensagens</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Campanhas
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span>Seu Saldo Atual</span>
          </CardTitle>
          <CardDescription className="text-4xl font-bold text-green-600">
            R$ {loading ? <span className="animate-pulse">...</span> : userCredits.toFixed(2)}
          </CardDescription>
          <p className="text-sm text-muted-foreground">Cada mensagem custa R$0,09. Créditos nunca expiram.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Button onClick={loadUserCredits} variant="outline" disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Saldo
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Escolha um valor para recarregar:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {rechargeOptions.map((amount) => (
                <Button
                  key={amount}
                  variant="default"
                  size="lg"
                  className="h-20 text-xl font-bold flex flex-col items-center justify-center space-y-1"
                  onClick={() => handleRecharge(amount)}
                  disabled={recharging === amount || loading}
                >
                  {recharging === amount ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <DollarSign className="h-6 w-6" />
                  )}
                  <span>R$ {amount.toFixed(2)}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Ao recarregar, você concorda com os termos de serviço.</p>
            <p>Para outros valores ou métodos de pagamento, entre em contato com o suporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
