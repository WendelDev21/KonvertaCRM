import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * GET /api/webhooks
 * Lista todos os webhooks do usuário atual
 */
export async function GET(request: NextRequest) {
  try {
    // Obter a sessão do usuário
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
    }

    // Buscar webhooks do usuário
    const webhooks = await prisma.webhook.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error("Erro ao buscar webhooks:", error)
    return NextResponse.json({ error: "Erro ao buscar webhooks" }, { status: 500 })
  }
}

/**
 * POST /api/webhooks
 * Cria um novo webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Obter a sessão do usuário
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
    }

    // Obter dados do corpo da requisição
    const body = await request.json()
    const { name, url, events, secret } = body

    if (!name || !url || !events) {
      return NextResponse.json({ error: "Nome, URL e eventos são obrigatórios" }, { status: 400 })
    }

    // Criar webhook
    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: typeof events === "string" ? events : JSON.stringify(events),
        secret,
        userId: user.id,
      },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error("Erro ao criar webhook:", error)
    return NextResponse.json({ error: "Erro ao criar webhook" }, { status: 500 })
  }
}
