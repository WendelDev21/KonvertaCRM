import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function apiAuthMiddleware(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>,
) {
  try {
    // Verifica token de API no cabeçalho Authorization
    const authHeader = request.headers.get("Authorization")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)

      // Busca o token no banco de dados
      const apiToken = await prisma.apiToken.findFirst({
        where: {
          token,
          isActive: true,
        },
        include: {
          user: true,
        },
      })

      // Se o token existir e estiver ativo
      if (apiToken) {
        // Atualiza a data de último uso
        await prisma.apiToken.update({
          where: { id: apiToken.id },
          data: { lastUsed: new Date() },
        })

        // Chama o handler com o userId
        return handler(request, apiToken.userId)
      }
    }

    // Se não tiver token de API ou o token for inválido,
    // tenta autenticação por sessão do Next Auth
    // Esta parte seria implementada conforme sua lógica de autenticação

    // Por enquanto, retornamos erro de não autorizado
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  } catch (error) {
    console.error("Erro na autenticação de API:", error)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
