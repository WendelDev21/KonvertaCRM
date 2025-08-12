import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { readFile, stat } from "fs/promises"
import { join } from "path"
import sharp from "sharp"
import { updateUserCredits, getUserById } from "@/lib/services/user-service" // Import user service

const prisma = new PrismaClient()

// Cost per message
const MESSAGE_COST = 0.09

// Limite de 100MB para arquivos
const MAX_FILE_SIZE = 200 * 1024 * 1024
// Limite de 200MB para base64 (considerando aumento de 33%)
const BASE64_THRESHOLD = 200 * 1024 * 1024

// Função para converter data do fuso horário brasileiro para UTC
function convertBrazilTimeToUTC(dateString: string): Date {
  // O dateString vem no formato ISO do input datetime-local
  // Assumimos que é horário de Brasília (GMT-3)
  const localDate = new Date(dateString)

  // Adiciona 3 horas para converter de Brasília (GMT-3) para UTC
  // Se o servidor estiver em UTC, isso funcionará corretamente
  // Se o servidor estiver em outro fuso, o Date será interpretado corretamente
  const utcTime = new Date(localDate.getTime() + 3 * 60 * 60 * 1000)

  console.log(`[Campaign] Converting Brazil time: ${dateString} -> UTC: ${utcTime.toISOString()}`)

  return utcTime
}

// Função para verificar se uma data está no futuro considerando fuso horário brasileiro
function isDateInFuture(dateString: string): boolean {
  const brazilDate = new Date(dateString)
  const nowInBrazil = new Date(Date.now() - 3 * 60 * 60 * 1000) // Subtrai 3h para obter horário do Brasil

  console.log(
    `[Campaign] Checking future date - Input: ${dateString}, Brazil now: ${nowInBrazil.toISOString()}, Is future: ${brazilDate > nowInBrazil}`,
  )

  return brazilDate > nowInBrazil
}

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

    const { name, message, instanceId, contactIds, mediaUrl, mediaType, fileName, caption, scheduledAt } =
      await request.json()

    if (!name || (!message && !mediaUrl) || !instanceId || !contactIds || contactIds.length === 0) {
      return NextResponse.json(
        {
          error: "Nome, mensagem ou mídia, instância e contatos são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Verificar limite diário
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [user, userError] = await getUserById(session.user.id as string)

    if (userError || !user) {
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

    // Check credits
    const totalCost = contactIds.length * MESSAGE_COST
    if (user.credits.toNumber() < totalCost) {
      // Use toNumber() for Decimal comparison
      return NextResponse.json(
        {
          error: `Créditos insuficientes. Você precisa de R$${totalCost.toFixed(2)} para esta campanha. Saldo atual: R$${user.credits.toFixed(2)}.`,
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

    // Verificar e processar arquivo se for mídia
    let processedMediaUrl = mediaUrl
    let fileSize = 0

    if (mediaUrl) {
      try {
        const fullPath = join(process.cwd(), "public", mediaUrl)
        const fileStats = await stat(fullPath)
        fileSize = fileStats.size

        console.log(`[Campaign] Original file size: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB`)

        if (fileStats.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              error: `Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            },
            { status: 400 },
          )
        }

        // Otimizar imagens grandes (acima de 20MB)
        if (isImageFile(fileName || "") && fileStats.size > 20 * 1024 * 1024) {
          console.log(`[Campaign] Large image detected, optimizing: ${fileName}`)
          processedMediaUrl = await optimizeImage(mediaUrl, fileName || "", "large")

          // Verificar tamanho após otimização
          const optimizedStats = await stat(join(process.cwd(), "public", processedMediaUrl))
          fileSize = optimizedStats.size
          console.log(`[Campaign] Optimized file size: ${(optimizedStats.size / 1024 / 1024).toFixed(2)}MB`)
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: "Arquivo de mídia não encontrado",
          },
          { status: 400 },
        )
      }
    }

    // Processar agendamento considerando fuso horário brasileiro
    let campaignScheduledAt = new Date()
    let isScheduled = false

    if (scheduledAt) {
      // Verificar se a data está no futuro (considerando horário brasileiro)
      if (!isDateInFuture(scheduledAt)) {
        return NextResponse.json(
          {
            error: "Data de agendamento deve ser no futuro (horário de Brasília)",
          },
          { status: 400 },
        )
      }

      // Converter de horário brasileiro para UTC para armazenar corretamente
      campaignScheduledAt = convertBrazilTimeToUTC(scheduledAt)
      isScheduled = true
    }

    // Determinar status inicial da campanha
    const initialStatus = isScheduled ? "SCHEDULED" : "PENDING"

    // Criar a campanha
    const campaign = await prisma.campaign.create({
      data: {
        name,
        message: message || caption || "",
        userId: user.id,
        instanceId,
        totalContacts: contactIds.length,
        status: initialStatus,
        mediaUrl: processedMediaUrl,
        mediaType,
        fileName,
        caption,
        scheduledAt: campaignScheduledAt,
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

    // Tamanho fixo do lote: 50 mensagens
    const batchSize = 50

    console.log(`[Campaign] Using fixed batch size: ${batchSize}`)

    const batches = []
    const baseTime = campaignScheduledAt

    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batchContacts = contactIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const batchScheduledAt = new Date(baseTime.getTime() + (batchNumber - 1) * 30 * 60 * 1000) // 30 minutos fixo

      batches.push({
        campaignId: campaign.id,
        batchNumber,
        contactIds: batchContacts,
        scheduledAt: batchScheduledAt,
        status: "PENDING",
      })
    }

    await prisma.campaignBatch.createMany({
      data: batches,
    })

    // Se não é agendada, atualizar para RUNNING e processar imediatamente
    if (!isScheduled) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "RUNNING",
        },
      })

      // Processar primeiro lote imediatamente
      setTimeout(() => {
        processCampaignBatch(campaign.id, 1)
      }, 1000)
    } else {
      // Agendar execução da campanha
      // Calcular delay considerando que campaignScheduledAt já está em UTC
      const now = new Date()
      const delay = campaignScheduledAt.getTime() - now.getTime()

      console.log(
        `[Campaign] Scheduling campaign for: ${campaignScheduledAt.toISOString()}, delay: ${delay}ms (${delay / 1000 / 60} minutes)`,
      )

      if (delay > 0) {
        setTimeout(() => {
          startScheduledCampaign(campaign.id)
        }, delay)
      } else {
        // Se por algum motivo o delay for negativo, executar imediatamente
        console.log(`[Campaign] Delay is negative (${delay}ms), executing immediately`)
        setTimeout(() => {
          startScheduledCampaign(campaign.id)
        }, 1000)
      }
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function startScheduledCampaign(campaignId: string) {
  try {
    console.log(`[Campaign] Starting scheduled campaign ${campaignId}`)

    // Atualizar status para RUNNING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "RUNNING",
      },
    })

    // Processar primeiro lote
    setTimeout(() => {
      processCampaignBatch(campaignId, 1)
    }, 1000)
  } catch (error) {
    console.error("Error starting scheduled campaign:", error)
  }
}

function isImageFile(fileName: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"]
  const extension = fileName.toLowerCase().split(".").pop()
  return imageExtensions.includes(extension || "")
}

function isVideoFile(fileName: string): boolean {
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"]
  const extension = fileName.toLowerCase().split(".").pop()
  return videoExtensions.includes(extension || "")
}

async function optimizeImage(
  originalPath: string,
  fileName: string,
  level: "normal" | "large" = "normal",
): Promise<string> {
  try {
    const fullPath = join(process.cwd(), "public", originalPath)
    const optimizedFileName = `optimized-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const optimizedPath = join(process.cwd(), "public", "uploads", "media", optimizedFileName)
    const optimizedUrl = `/uploads/media/${optimizedFileName}`

    console.log(`[Campaign] Optimizing image (${level}) from ${fullPath} to ${optimizedPath}`)

    let sharpInstance = sharp(fullPath)

    if (level === "large") {
      // Para arquivos muito grandes, reduzir drasticamente
      sharpInstance = sharpInstance
        .resize(1920, 1080, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 70,
          progressive: true,
          mozjpeg: true,
        })
    } else {
      // Otimização normal
      sharpInstance = sharpInstance
        .resize(2560, 1440, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
    }

    await sharpInstance.toFile(optimizedPath)

    // Verificar tamanho do arquivo otimizado
    const optimizedStats = await stat(optimizedPath)
    console.log(`[Campaign] Optimized file size: ${(optimizedStats.size / 1024 / 1024).toFixed(2)}MB`)

    return optimizedUrl
  } catch (error) {
    console.error("Error optimizing image:", error)
    throw new Error("Erro ao otimizar imagem")
  }
}

async function fileToBase64(filePath: string): Promise<string> {
  try {
    const fullPath = join(process.cwd(), "public", filePath)

    // Verificar se o arquivo existe
    const fileStats = await stat(fullPath)
    console.log(`[Campaign] Converting file to base64: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB`)

    if (fileStats.size > BASE64_THRESHOLD) {
      throw new Error(
        `Arquivo muito grande para base64: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB. Limite máximo: ${(BASE64_THRESHOLD / 1024 / 1024).toFixed(0)}MB`,
      )
    }

    // Ler arquivo
    const fileBuffer = await readFile(fullPath)
    const base64 = fileBuffer.toString("base64")

    console.log(`[Campaign] Base64 conversion successful: ${(base64.length / 1024 / 1024).toFixed(2)}MB`)
    return base64
  } catch (error) {
    console.error("Error converting file to base64:", error)
    throw error
  }
}

function getMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.toLowerCase().split(".").pop()

  const mimeTypes: { [key: string]: string } = {
    // Imagens
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
    // Documentos
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    // Áudio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    // Vídeo
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    wmv: "video/x-ms-wmv",
    flv: "video/x-flv",
    webm: "video/webm",
    mkv: "video/x-matroska",
  }

  return mimeTypes[extension || ""] || "application/octet-stream"
}

function getMediaTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

async function processCampaignBatch(campaignId: string, batchNumber: number) {
  try {
    console.log(`[Campaign] Processing batch ${batchNumber} for campaign ${campaignId}`)

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
      console.log(`[Campaign] Batch not found or campaign not running`)
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

    console.log(`[Campaign] Found ${contacts.length} contacts in batch`)

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

    // Preparar dados para envio de mídia (apenas base64)
    let mediaBase64: string | null = null
    let mimetype: string | null = null
    let mediaTypeForApi: string | null = null

    if (batch.campaign.mediaUrl) {
      try {
        mimetype = getMimeTypeFromExtension(batch.campaign.fileName || "")
        mediaTypeForApi = getMediaTypeFromMime(mimetype)

        console.log(`[Campaign] Processing media file, mimetype: ${mimetype}, mediaType: ${mediaTypeForApi}`)

        // Converter para base64
        mediaBase64 = await fileToBase64(batch.campaign.mediaUrl)
        console.log(`[Campaign] File converted to base64 successfully`)
      } catch (error) {
        console.error("[Campaign] Error processing media file:", error)
        throw new Error(
          "Erro ao processar arquivo de mídia: " + (error instanceof Error ? error.message : "Erro desconhecido"),
        )
      }
    }

    // Delay fixo entre mensagens: 2 segundos
    const delayBetweenMessages = 2000

    console.log(`[Campaign] Using fixed ${delayBetweenMessages}ms delay between messages`)

    // Enviar mensagens com delay
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      try {
        // Check user credits before sending each message
        const [currentUser, userError] = await getUserById(batch.campaign.userId)
        if (userError || !currentUser) {
          throw new Error("User not found for credit check.")
        }

        if (currentUser.credits.toNumber() < MESSAGE_COST) {
          console.warn(
            `[Campaign] User ${currentUser.id} has insufficient credits for message to ${contact.contact}. Remaining credits: R$${currentUser.credits.toFixed(2)}`,
          )
          await prisma.campaignSend.update({
            where: {
              campaignId_contactId: {
                campaignId,
                contactId: contact.id,
              },
            },
            data: {
              status: "FAILED",
              errorMessage: `Créditos insuficientes. Saldo atual: R$${currentUser.credits.toFixed(2)}.`,
            },
          })
          failCount++
          continue // Skip to next contact
        }

        console.log(`[Campaign] Sending message ${i + 1}/${contacts.length} to ${contact.contact}`)

        let response
        let success = false

        if (mediaBase64) {
          // Envio de mídia via base64
          const base64Payload = {
            number: contact.contact,
            mediatype: mediaTypeForApi,
            mimetype: mimetype,
            caption: batch.campaign.caption || batch.campaign.message || "",
            media: mediaBase64,
            fileName: batch.campaign.fileName || "media",
          }

          response = await fetch(`${evolutionApiUrl}/message/sendMedia/${instance.instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionApiKey,
            },
            body: JSON.stringify(base64Payload),
          })

          success = response.ok
          if (success) {
            console.log(`[Campaign] Media message sent successfully to ${contact.contact}`)
          }
        } else {
          // Envio de texto
          const textPayload = {
            number: contact.contact,
            text: batch.campaign.message,
          }

          response = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionApiKey,
            },
            body: JSON.stringify(textPayload),
          })

          success = response.ok
          if (success) {
            console.log(`[Campaign] Text message sent successfully to ${contact.contact}`)
          }
        }

        if (success && response) {
          const result = await response.json()

          // Deduct credits for successful send
          await updateUserCredits(batch.campaign.userId, -MESSAGE_COST)
          console.log(`[Campaign] Deducted R$${MESSAGE_COST.toFixed(2)} from user ${batch.campaign.userId} credits.`)

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
          const errorText = response ? await response.text() : "No response"
          console.error(`[Campaign] Error sending to ${contact.contact}:`, errorText)
          throw new Error(`Failed to send message: ${errorText}`)
        }
      } catch (error) {
        console.error(`[Campaign] Failed to send to ${contact.contact}:`, error)
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

      // Delay entre mensagens
      if (i < contacts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMessages))
      }
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

    console.log(`[Campaign] Batch ${batchNumber} completed: ${successCount} sent, ${failCount} failed`)

    // Verificar se há próximo lote
    const nextBatch = await prisma.campaignBatch.findFirst({
      where: {
        campaignId,
        batchNumber: batchNumber + 1,
        status: "PENDING",
      },
    })

    if (nextBatch) {
      // Intervalo fixo de 30 minutos entre lotes
      const intervalMinutes = 30

      console.log(`[Campaign] Scheduling next batch ${batchNumber + 1} in ${intervalMinutes} minutes`)
      setTimeout(
        () => {
          processCampaignBatch(campaignId, batchNumber + 1)
        },
        intervalMinutes * 60 * 1000,
      )
    } else {
      // Marcar campanha como concluída
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      })
      console.log(`[Campaign] Campaign ${campaignId} completed`)
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
