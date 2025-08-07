"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DollarSign, Wallet, RefreshCw, ArrowLeft, MessageCircle, Star } from 'lucide-react'
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function CreditsPage() {
  const { data: session, update } = useSession()
  const [userCredits, setUserCredits] = useState<number>(0)
  const [loading, setLoading] = useState(false)

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

  const handleWhatsAppRedirect = (amount: number) => {
    const messages = {
      20: "Olá! Gostaria de fazer uma recarga de R$20,00 na minha conta da plataforma.",
      50: "Olá! Gostaria de fazer uma recarga de R$50,00 na minha conta da plataforma.",
      100: "Olá! Gostaria de fazer uma recarga de R$100,00 na minha conta da plataforma."
    }
    
    const message = messages[amount as keyof typeof messages]
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/5579991190534?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  const rechargeOptions = [
    { 
      amount: 20, 
      popular: false,
      messages: Math.floor(20 / 0.09)
    },
    { 
      amount: 50, 
      popular: true,
      messages: Math.floor(50 / 0.09)
    },
    { 
      amount: 100, 
      popular: false,
      messages: Math.floor(100 / 0.09)
    }
  ]

  const messagesFromCredits = Math.floor(userCredits / 0.09)

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
            <DollarSign className="h-6 w-6 text-primary" />
            <span>Seu Saldo Atual</span>
          </CardTitle>
          <CardDescription className="text-4xl font-bold text-primary">
            R$ {loading ? <span className="animate-pulse">...</span> : userCredits.toFixed(2)}
          </CardDescription>
          <p className="text-sm text-muted-foreground">
            {loading ? "Carregando..." : `${messagesFromCredits} mensagens disponíveis • Cada mensagem custa R$0,09`}
          </p>
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
        </CardContent>
      </Card>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Escolha um valor para recarregar</h2>
          <p className="text-muted-foreground">Clique no valor desejado para falar conosco no WhatsApp</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rechargeOptions.map((option) => (
            <Card 
              key={option.amount} 
              className={`relative transition-all hover:shadow-md ${
                option.popular ? 'border-primary' : ''
              }`}
            >
              {option.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Mais Popular</span>
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-bold">
                  R$ {option.amount.toFixed(2)}
                </CardTitle>
                <CardDescription>
                  {option.messages} mensagens
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center text-sm text-muted-foreground space-y-1">
                  <p>• Créditos nunca expiram</p>
                  <p>• Suporte via WhatsApp</p>
                  <p>• Ativação após confirmação</p>
                </div>
                
                <Button
                  onClick={() => handleWhatsAppRedirect(option.amount)}
                  className="w-full"
                  variant={option.popular ? "default" : "outline"}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Recarregar via WhatsApp
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Como funciona a recarga?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                1
              </div>
              <h4 className="font-semibold">Escolha o valor</h4>
              <p className="text-sm text-muted-foreground">
                Selecione o plano que melhor atende suas necessidades
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                2
              </div>
              <h4 className="font-semibold">Fale no WhatsApp</h4>
              <p className="text-sm text-muted-foreground">
                Clique no botão e será redirecionado para nosso WhatsApp
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                3
              </div>
              <h4 className="font-semibold">Receba os créditos</h4>
              <p className="text-sm text-muted-foreground">
                Após o pagamento, seus créditos são adicionados automaticamente
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-center">
              <strong>Dúvidas?</strong> Nossa equipe está disponível no WhatsApp para te ajudar com qualquer questão sobre recargas e pagamentos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
