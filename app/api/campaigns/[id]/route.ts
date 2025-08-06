import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaignId = params.id
    const { name, message, contactIds, mediaUrl, mediaType, fileName, caption, scheduledAt } = await request.json()

    // Verificar se a campanha existe e pertence ao usuário
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        user: {
          email: session.user.email,
        },
      },
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    // Verificar se a campanha pode ser editada (não pode estar em execução)
    if (existingCampaign.status === "RUNNING") {
      return NextResponse.json(
        {
          error: "Não é possível editar uma campanha em execução. Pause a campanha primeiro.",
        },
        { status: 400 },
      )
    }

    // Verificar limite diário se novos contatos foram adicionados
    if (contactIds && contactIds.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
      }

      const dailyLimit = await prisma.dailyLimit.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
      })

      const currentSent = dailyLimit?.sentCount || 0
      const maxDaily = 500

      if (currentSent + contactIds.length > maxDaily) {
        return NextResponse.json(
          {
            error: `Limite diário excedido. Você pode enviar apenas ${maxDaily - currentSent} mensagens hoje.`,
          },
          { status: 400 },
        )
      }
    }

    // Atualizar a campanha
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: name || existingCampaign.name,
        message: message !== undefined ? message : existingCampaign.message,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : existingCampaign.mediaUrl,
        mediaType: mediaType !== undefined ? mediaType : existingCampaign.mediaType,
        fileName: fileName !== undefined ? fileName : existingCampaign.fileName,
        caption: caption !== undefined ? caption : existingCampaign.caption,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : existingCampaign.scheduledAt,
        totalContacts: contactIds ? contactIds.length : existingCampaign.totalContacts,
      },
    })

    // Se novos contatos foram fornecidos, atualizar os registros de envio
    if (contactIds && contactIds.length > 0) {
      // Deletar registros de envio existentes
      await prisma.campaignSend.deleteMany({
        where: { campaignId },
      })

      // Deletar lotes existentes
      await prisma.campaignBatch.deleteMany({
        where: { campaignId },
      })

      // Criar novos registros de envio
      const campaignSends = contactIds.map((contactId: string) => ({
        campaignId,
        contactId,
        status: "PENDING",
      }))

      await prisma.campaignSend.createMany({
        data: campaignSends,
      })

      // Criar novos lotes
      const batchSize = 50
      const batches = []
      for (let i = 0; i < contactIds.length; i += batchSize) {
        const batchContacts = contactIds.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        const batchScheduledAt = scheduledAt 
          ? new Date(new Date(scheduledAt).getTime() + (batchNumber - 1) * 30 * 60 * 1000)
          : new Date(Date.now() + (batchNumber - 1) * 30 * 60 * 1000)

        batches.push({
          campaignId,
          batchNumber,
          contactIds: batchContacts,
          scheduledAt: batchScheduledAt,
          status: "PENDING",
        })
      }

      await prisma.campaignBatch.createMany({
        data: batches,
      })

      // Reset counters
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount: 0,
          failedCount: 0,
        },
      })
    }

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

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
