import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaignId = params.id

    // Verificar se a campanha existe e pertence ao usuário
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        user: {
          email: session.user.email,
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    // Verificar se a campanha pode ser deletada (não está em execução)
    if (campaign.status === "RUNNING") {
      return NextResponse.json(
        {
          error: "Não é possível deletar uma campanha em execução. Pause a campanha primeiro.",
        },
        { status: 400 },
      )
    }

    // Deletar a campanha e todos os dados relacionados (cascade delete)
    await prisma.campaign.delete({
      where: {
        id: campaignId,
      },
    })

    return NextResponse.json({
      message: "Campanha deletada com sucesso",
    })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaignId = params.id

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        user: {
          email: session.user.email,
        },
      },
      include: {
        sends: {
          include: {
            contact: true,
          },
        },
        batches: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
