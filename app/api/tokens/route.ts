import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import prisma from "@/lib/prisma"
import { randomBytes, createHash } from "crypto"

// Função simplificada para gerar token
async function generateToken(userId: string): Promise<string | null> {
  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error(`Usuário com ID ${userId} não encontrado`)
      return null
    }

    // Gerar token aleatório
    const tokenValue = randomBytes(32).toString("hex")
    const hashedToken = createHash("sha256").update(tokenValue).digest("hex")

    // Desativar tokens anteriores
    await prisma.apiToken.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    })

    // Criar novo token
    await prisma.apiToken.create({
      data: {
        token: hashedToken,
        name: "API Token",
        userId,
        isActive: true,
      },
    })

    return tokenValue
  } catch (error) {
    console.error("Erro ao gerar token:", error)
    return null
  }
}

// GET /api/tokens - Obter o token atual do usuário
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    // Buscar token ativo
    const token = await prisma.apiToken.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      hasToken: !!token,
      tokenInfo: token
        ? {
            id: token.id,
            name: token.name || "API Token",
            createdAt: token.createdAt,
            lastUsed: token.lastUsed,
            expiresAt: token.expiresAt,
          }
        : null,
    })
  } catch (error) {
    console.error("Erro ao obter token:", error)
    return NextResponse.json({ error: "Erro ao obter token" }, { status: 500 })
  }
}

// POST /api/tokens - Gerar um novo token
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    console.log("Gerando token para usuário:", userId)

    // Gerar token diretamente aqui
    const token = await generateToken(userId)

    if (!token) {
      return NextResponse.json({ error: "Erro ao gerar token" }, { status: 500 })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Erro ao gerar token:", error)
    return NextResponse.json({ error: "Erro ao gerar token" }, { status: 500 })
  }
}

// DELETE /api/tokens - Revogar um token
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("id")

    if (!tokenId) {
      return NextResponse.json({ error: "ID do token não fornecido" }, { status: 400 })
    }

    // Revogar token
    const result = await prisma.apiToken.updateMany({
      where: {
        id: tokenId,
        userId,
      },
      data: {
        isActive: false,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao revogar token:", error)
    return NextResponse.json({ error: "Erro ao revogar token" }, { status: 500 })
  }
}
