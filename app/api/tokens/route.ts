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

// POST /api/tokens - Gerar um ou múltiplos tokens
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      console.log("[API] Gerando token(s) para usuário:", userId)

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!user) {
        console.error("[API] Usuário não encontrado:", userId)
        return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 })
      }

      // Tratar o corpo da requisição com segurança
      let body = {}
      try {
        // Verificar se o corpo da requisição não está vazio
        const text = await req.text()
        if (text && text.trim()) {
          body = JSON.parse(text)
        }
      } catch (error) {
        console.warn("[API] Erro ao fazer parse do JSON:", error)
        // Continuar com objeto vazio se o parse falhar
      }

      // Detectar se é operação em lote ou individual
      const isBatch = Array.isArray(body)
      const tokenRequests = isBatch ? body : [body || {}]

      // Se não houver requisições válidas, criar pelo menos uma com valores padrão
      if (tokenRequests.length === 0) {
        tokenRequests.push({})
      }

      const results = []
      const errors = []

      for (let i = 0; i < tokenRequests.length; i++) {
        const tokenData = tokenRequests[i] || {}

        try {
          // Gerar token aleatório
          const tokenValue = randomBytes(32).toString("hex")
          const hashedToken = createHash("sha256").update(tokenValue).digest("hex")

          // Para operações em lote, não desativar tokens anteriores automaticamente
          if (!isBatch) {
            // Desativar tokens anteriores apenas para operação individual
            await prisma.apiToken.updateMany({
              where: {
                userId,
                isActive: true,
              },
              data: {
                isActive: false,
              },
            })
          }

          // Criar novo token
          const newToken = await prisma.apiToken.create({
            data: {
              token: hashedToken,
              name: tokenData.name || "API Token",
              userId,
              isActive: true,
            },
          })

          console.log("[API] Token gerado com sucesso, ID:", newToken.id)
          results.push({ success: true, token: tokenValue, id: newToken.id, name: newToken.name })
        } catch (error) {
          console.error(`[API] Erro ao gerar token ${i + 1}:`, error)
          errors.push({ index: i, error: "Erro ao gerar token" })
        }
      }

      // Retornar resultado apropriado
      if (isBatch) {
        return NextResponse.json({
          success: results.length > 0,
          created: results.length,
          total: tokenRequests.length,
          results,
          errors: errors.length > 0 ? errors : undefined,
        })
      } else {
        if (results.length > 0) {
          return NextResponse.json(results[0])
        } else {
          return NextResponse.json(
            { success: false, error: errors[0]?.error || "Erro ao gerar token" },
            { status: 500 },
          )
        }
      }
    } catch (error) {
      console.error("[API] Erro ao gerar token(s):", error)
      return NextResponse.json({ success: false, error: "Erro ao gerar token(s)" }, { status: 500 })
    }
  })
}
