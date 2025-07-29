import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, message, instanceId, contactIds } = await request.json()

    if (!name || !message || !instanceId || !contactIds || contactIds.length === 0) {
      return NextResponse.json(
        {
          error: "Todos os campos são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Verificar limite diário
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
    const maxDaily = 100

    if (currentSent + contactIds.length > maxDaily) {
      return NextResponse.json(
        {
          error: `Limite diário excedido. Você pode enviar apenas ${maxDaily - currentSent} mensagens hoje.`,
        },
        { status: 400 },
      )
    }

    // Verificar se a instância existe e está conectada
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        id: instanceId,
        userId: user.id,
        status: "CONNECTED",
      },
    })

    if (!instance) {
      return NextResponse.json(
        {
          error: "Instância não encontrada ou não conectada",
        },
        { status: 400 },
      )
    }

    // Criar a campanha
    const campaign = await prisma.campaign.create({
      data: {
        name,
        message,
        userId: user.id,
        instanceId,
        totalContacts: contactIds.length,
        status: "PENDING",
      },
    })

    // Criar os registros de envio
    const campaignSends = contactIds.map((contactId: string) => ({
      campaignId: campaign.id,
      contactId,
      status: "PENDING",
    }))

    await prisma.campaignSend.createMany({
      data: campaignSends,
    })

    // Criar lotes de 20 contatos cada
    const batchSize = 20
    const batches = []

    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batchContacts = contactIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const scheduledAt = new Date(Date.now() + (batchNumber - 1) * 60 * 60 * 1000) // 1 hora de intervalo

      batches.push({
        campaignId: campaign.id,
        batchNumber,
        contactIds: batchContacts,
        scheduledAt,
        status: "PENDING",
      })
    }

    await prisma.campaignBatch.createMany({
      data: batches,
    })

    // Iniciar processamento da campanha (primeiro lote imediatamente)
    // await processCampaignBatch(campaign.id, 1)

    // Atualizar campanha para RUNNING
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "RUNNING",
        scheduledAt: new Date(),
      },
    })

    // Processar primeiro lote imediatamente
    setTimeout(() => {
      processCampaignBatch(campaign.id, 1)
    }, 1000) // 1 segundo de delay para garantir que a transação foi commitada

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Error creating campaign:", error)
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

    // Marcar campanha como falhou se for o primeiro lote
    if (batchNumber === 1) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "FAILED",
        },
      })
    }
  }
}
