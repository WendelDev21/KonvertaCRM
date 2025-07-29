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

    if (campaign.status !== "PAUSED") {
      return NextResponse.json(
        {
          error: "Apenas campanhas pausadas podem ser retomadas",
        },
        { status: 400 },
      )
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING" },
    })

    // Encontrar próximo lote pendente e processar
    const nextBatch = await prisma.campaignBatch.findFirst({
      where: {
        campaignId,
        status: "PENDING",
      },
      orderBy: {
        batchNumber: "asc",
      },
    })

    if (nextBatch) {
      // Processar próximo lote imediatamente
      setTimeout(() => {
        processCampaignBatch(campaignId, nextBatch.batchNumber)
      }, 1000)
    }

    return NextResponse.json({ message: "Campanha retomada com sucesso" })
  } catch (error) {
    console.error("Error resuming campaign:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function processCampaignBatch(campaignId: string, batchNumber: number) {
  try {
    const batch = await prisma.campaignBatch.findFirst({
      where: {
        campaignId,
        batchNumber,
        status: "PENDING",
      },
      include: {
        campaign: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!batch || batch.campaign.status !== "RUNNING") {
      return
    }

    // Marcar lote como processando
    await prisma.campaignBatch.update({
      where: { id: batch.id },
      data: {
        status: "PROCESSING",
        processedAt: new Date(),
      },
    })

    // Buscar contatos do lote
    const contacts = await prisma.contact.findMany({
      where: {
        id: {
          in: batch.contactIds,
        },
      },
    })

    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const evolutionApiKey = process.env.EVOLUTION_API_KEY

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error("Evolution API não configurada")
    }

    // Buscar dados da instância
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        id: batch.campaign.instanceId,
        status: "CONNECTED",
      },
    })

    if (!instance) {
      throw new Error("Instância não encontrada ou desconectada")
    }

    let successCount = 0
    let failCount = 0

    // Enviar mensagens com delay
    for (const contact of contacts) {
      try {
        const response = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
          body: JSON.stringify({
            number: contact.contact,
            text: batch.campaign.message,
          }),
        })

        if (response.ok) {
          const result = await response.json()

          await prisma.campaignSend.update({
            where: {
              campaignId_contactId: {
                campaignId,
                contactId: contact.id,
              },
            },
            data: {
              status: "SENT",
              sentAt: new Date(),
              messageId: result.key?.id || result.messageId || null,
            },
          })

          successCount++
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        await prisma.campaignSend.update({
          where: {
            campaignId_contactId: {
              campaignId,
              contactId: contact.id,
            },
          },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
          },
        })

        failCount++
      }

      // Delay de 1.2 segundos entre mensagens
      await new Promise((resolve) => setTimeout(resolve, 1200))
    }

    // Marcar lote como concluído
    await prisma.campaignBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
      },
    })

    // Atualizar contadores da campanha
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: {
          increment: successCount,
        },
        failedCount: {
          increment: failCount,
        },
      },
    })

    // Atualizar limite diário
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.dailyLimit.upsert({
      where: {
        userId_date: {
          userId: batch.campaign.userId,
          date: today,
        },
      },
      update: {
        sentCount: {
          increment: successCount,
        },
      },
      create: {
        userId: batch.campaign.userId,
        date: today,
        sentCount: successCount,
      },
    })

    // Verificar se há próximo lote
    const nextBatch = await prisma.campaignBatch.findFirst({
      where: {
        campaignId,
        batchNumber: batchNumber + 1,
        status: "PENDING",
      },
    })

    if (nextBatch) {
      // Agendar próximo lote para 1 hora
      setTimeout(
        () => {
          processCampaignBatch(campaignId, batchNumber + 1)
        },
        60 * 60 * 1000,
      ) // 1 hora
    } else {
      // Marcar campanha como concluída
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error("Error processing campaign batch:", error)

    // Marcar lote como falhou
    await prisma.campaignBatch.updateMany({
      where: {
        campaignId,
        batchNumber,
        status: "PROCESSING",
      },
      data: { status: "FAILED" },
    })
  }
}
