import { type NextRequest, NextResponse } from "next/server"
import { apiAuthMiddleware } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import crypto from "crypto"

/**
 * GET /api/tokens
 * Obtém informações sobre o token do usuário atual
 */
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Buscar tokens do usuário
      const tokens = await prisma.apiToken.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        select: {
          id: true,
          token: true,
          name: true,
          lastUsed: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json({ tokens })
    } catch (error) {
      console.error("Erro ao buscar tokens:", error)
      return NextResponse.json({ error: "Erro ao buscar tokens" }, { status: 500 })
    }
  })
}

/**
 * POST /api/tokens
 * Gera um novo token para o usuário atual
 */
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o corpo da requisição existe e não está vazio
      const contentType = req.headers.get("content-type") || ""
      let name = "API Token" // Valor padrão para o nome do token

      // Só tenta fazer o parse do JSON se o content-type for application/json e o corpo não estiver vazio
      if (contentType.includes("application/json")) {
        try {
          // Obter o texto do corpo da requisição
          const text = await req.text()

          if (text && text.trim() !== "") {
            // Fazer o parse do JSON
            const body = JSON.parse(text)
            // Se o nome foi fornecido, usar o nome fornecido
            if (body && body.name) {
              name = body.name
            }
          }
        } catch (parseError) {
          console.error("Erro ao fazer parse do JSON:", parseError)
          // Continuar com o valor padrão para o nome
        }
      }

      console.log(`Gerando token com nome "${name}" para usuário ${userId}`)

      // Gerar token aleatório
      const token = crypto.randomBytes(32).toString("hex")

      // Criar token no banco de dados
      const apiToken = await prisma.apiToken.create({
        data: {
          token,
          name,
          userId,
          lastUsed: null,
          expiresAt: null, // Sem data de expiração por enquanto
          isActive: true,
        },
      })

      return NextResponse.json({
        id: apiToken.id,
        token: apiToken.token,
        name: apiToken.name,
        createdAt: apiToken.createdAt,
      })
    } catch (error) {
      console.error("Erro ao criar token:", error)
      return NextResponse.json({ error: "Erro ao criar token" }, { status: 500 })
    }
  })
}

/**
 * DELETE /api/tokens
 * Revoga o token do usuário atual
 */
export async function DELETE(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url)
      const tokenId = searchParams.get("id")

      if (!tokenId) {
        return NextResponse.json({ error: "ID do token é obrigatório" }, { status: 400 })
      }

      // Verificar se o token pertence ao usuário
      const token = await prisma.apiToken.findUnique({
        where: {
          id: tokenId,
          userId,
        },
      })

      if (!token) {
        return NextResponse.json({ error: "Token não encontrado" }, { status: 404 })
      }

      // Desativar o token (não excluir)
      await prisma.apiToken.update({
        where: {
          id: tokenId,
        },
        data: {
          isActive: false,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Erro ao revogar token:", error)
      return NextResponse.json({ error: "Erro ao revogar token" }, { status: 500 })
    }
  })
}
