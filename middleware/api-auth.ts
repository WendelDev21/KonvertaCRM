import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

export async function apiAuthMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
) {
  try {
    // Verificar token JWT
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      // Verificar token de API no cabeçalho Authorization
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const apiToken = authHeader.substring(7) // Remover "Bearer "
      const user = await validateApiToken(apiToken)

      if (!user) {
        return NextResponse.json({ error: "Invalid API token" }, { status: 401 })
      }

      // Atualizar lastUsed do token
      await updateTokenLastUsed(apiToken)

      // Chamar o handler com o ID do usuário
      return handler(request, user.id)
    }

    // Se temos um token JWT válido, chamar o handler com o ID do usuário
    return handler(request, token.sub as string)
  } catch (error) {
    console.error("Auth middleware error:", error)
    return NextResponse.json({ error: "Authentication error" }, { status: 500 })
  }
}

// Função para validar token de API
async function validateApiToken(tokenValue: string) {
  try {
    // Buscar token ativo
    const hashedToken = require("crypto").createHash("sha256").update(tokenValue).digest("hex")

    const token = await prisma.apiToken.findFirst({
      where: {
        token: hashedToken,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    })

    if (!token) return null

    return token.user
  } catch (error) {
    console.error("Error validating API token:", error)
    return null
  }
}

// Função para atualizar lastUsed do token
async function updateTokenLastUsed(tokenValue: string) {
  try {
    const hashedToken = require("crypto").createHash("sha256").update(tokenValue).digest("hex")

    await prisma.apiToken.updateMany({
      where: {
        token: hashedToken,
        isActive: true,
      },
      data: {
        lastUsed: new Date(),
      },
    })
  } catch (error) {
    console.error("Error updating token lastUsed:", error)
  }
}
