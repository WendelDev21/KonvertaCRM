import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    if (campaign.status !== "RUNNING") {
      return NextResponse.json(
        {
          error: "Apenas campanhas em execução podem ser pausadas",
        },
        { status: 400 },
      )
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "PAUSED" },
    })

    return NextResponse.json({ message: "Campanha pausada com sucesso" })
  } catch (error) {
    console.error("Error pausing campaign:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
