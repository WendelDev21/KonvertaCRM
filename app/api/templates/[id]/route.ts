import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const template = await prisma.messageTemplate.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, message, category, mediaUrl, mediaType, fileName, caption } = await request.json()

    if (!name.trim()) {
      return NextResponse.json({ error: "Nome do template é obrigatório" }, { status: 400 })
    }

    if (!message.trim() && !mediaUrl) {
      return NextResponse.json({ error: "Mensagem ou mídia é obrigatória" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const template = await prisma.messageTemplate.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        name,
        message: message || "",
        category: category || "Geral",
        mediaUrl,
        mediaType,
        fileName,
        caption,
      },
    })

    if (template.count === 0) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Incrementar contador de uso
    const template = await prisma.messageTemplate.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })

    if (template.count === 0) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating template usage:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const template = await prisma.messageTemplate.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (template.count === 0) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
