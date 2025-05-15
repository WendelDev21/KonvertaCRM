import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Obter usuário atual
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    // Verificar se o usuário existe no banco
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            apiTokens: true,
            contacts: true,
            webhooks: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado no banco de dados",
          currentUser: {
            id: userId,
            email: (currentUser as any).email,
          },
        },
        { status: 404 },
      )
    }

    // Verificar tabela ApiToken
    let apiTokenTableExists = true
    try {
      await prisma.apiToken.findFirst()
    } catch (error) {
      apiTokenTableExists = false
    }

    return NextResponse.json({
      user,
      session: {
        id: userId,
        email: (currentUser as any).email,
      },
      database: {
        apiTokenTableExists,
      },
    })
  } catch (error) {
    console.error("Erro ao obter informações de diagnóstico:", error)
    return NextResponse.json({ error: "Erro ao obter informações de diagnóstico" }, { status: 500 })
  }
}
