import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * GET /api/webhooks/[id]
 * Obtém detalhes de um webhook específico
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Buscar webhook
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: params.id,
        userId: user.id, // Garantir que o webhook pertence ao usuário
      },
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error("Erro ao buscar webhook:", error)
    return NextResponse.json({ error: "Erro ao buscar webhook" }, { status: 500 })
  }
}

/**
 * PUT /api/webhooks/[id]
 * Atualiza um webhook
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verificar se o webhook existe e pertence ao usuário
    const existingWebhook = await prisma.webhook.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingWebhook) {
      return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 })
    }

    // Obter dados do corpo da requisição
    const body = await request.json()
    const { name, url, events, secret, isActive } = body

    // Atualizar webhook
    const webhook = await prisma.webhook.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : undefined,
        url: url !== undefined ? url : undefined,
        events: events !== undefined ? (typeof events === "string" ? events : JSON.stringify(events)) : undefined,
        secret: secret !== undefined ? secret : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error("Erro ao atualizar webhook:", error)
    return NextResponse.json({ error: "Erro ao atualizar webhook" }, { status: 500 })
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Exclui um webhook
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verificar se o webhook existe e pertence ao usuário
    const existingWebhook = await prisma.webhook.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingWebhook) {
      return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 })
    }

    // Excluir webhook
    await prisma.webhook.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir webhook:", error)
    return NextResponse.json({ error: "Erro ao excluir webhook" }, { status: 500 })
  }
}
