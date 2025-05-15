import { type NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-token"
import { getToken } from "next-auth/jwt"

// Middleware para autenticação de API - agora suporta todos os métodos HTTP
export async function apiAuthMiddleware(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
) {
  // Tentar autenticar via token de API
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    const { isValid, userId } = await verifyApiToken(token)

    if (isValid && userId) {
      return handler(req, userId)
    }

    // Token inválido
    return NextResponse.json({ error: "Token de API inválido ou expirado" }, { status: 401 })
  }

  // Tentar autenticar via sessão
  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (session?.sub) {
    return handler(req, session.sub)
  }

  // Nenhuma autenticação válida
  return NextResponse.json(
    { error: "Autenticação necessária. Forneça um token de API válido ou faça login." },
    { status: 401 },
  )
}
