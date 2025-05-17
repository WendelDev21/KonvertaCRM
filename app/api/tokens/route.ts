import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { randomBytes, createHash } from "crypto"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/tokens - Listar tokens do usuário
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      console.log("[API] Buscando tokens para usuário:", userId)

      const tokens = await prisma.apiToken.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsed: true,
          expiresAt: true,
          isActive: true,
        },
      })

      return NextResponse.json({
        success: true,
        tokens: tokens.map((token) => ({
          id: token.id,
          name: token.name || "API Token",
          createdAt: token.createdAt,
          lastUsed: token.lastUsed,
          expiresAt: token.expiresAt,
          isActive: token.isActive,
        })),
      })
    } catch (error) {
      console.error("[API] Erro ao listar tokens:", error)
      return NextResponse.json({ success: false, error: "Erro ao listar tokens" }, { status: 500 })
    }
  })
}

// POST /api/tokens - Gerar novo token
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      console.log("[API] Gerando novo token para usuário:", userId)

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!user) {
        console.error("[API] Usuário não encontrado:", userId)
        return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 })
      }

      // Gerar token aleatório
      const tokenValue = randomBytes(32).toString("hex")
      const hashedToken = createHash("sha256").update(tokenValue).digest("hex")

      // Desativar tokens anteriores
      await prisma.apiToken.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      })

      // Criar novo token
      const newToken = await prisma.apiToken.create({
        data: {
          token: hashedToken,
          name: "API Token",
          userId,
          isActive: true,
        },
      })

      console.log("[API] Token gerado com sucesso, ID:", newToken.id)

      return NextResponse.json({ success: true, token: tokenValue })
    } catch (error) {
      console.error("[API] Erro ao gerar token:", error)
      return NextResponse.json({ success: false, error: "Erro ao gerar token" }, { status: 500 })
    }
  })
}
