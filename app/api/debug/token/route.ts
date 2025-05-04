import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Obter o token JWT da sessão
    // Nota: Esta é uma implementação simplificada para fins de depuração
    // Em produção, você nunca deve expor o token completo

    return NextResponse.json({
      message: "Informações de autenticação",
      user: session.user,
      // Exibimos apenas parte do token por segurança
      tokenPreview: "Use os métodos descritos na documentação para obter o token completo",
    })
  } catch (error) {
    console.error("Erro ao obter informações de token:", error)
    return NextResponse.json({ error: "Erro ao obter informações de autenticação" }, { status: 500 })
  }
}
