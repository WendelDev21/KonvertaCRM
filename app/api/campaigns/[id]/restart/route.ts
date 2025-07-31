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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    if (campaign.status !== "COMPLETED" && campaign.status !== "FAILED") {
      return NextResponse.json(
        { error: "Apenas campanhas concluídas ou falhadas podem ser reiniciadas" },
        { status: 400 },
      )
    }

    // Verificar limite diário
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyLimit = await prisma.dailyLimit.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    })

    const dailyLimitValue = 500 // Aumentado de 100 para 500
    const currentSent = dailyLimit?.sentCount || 0

    if (currentSent >= dailyLimitValue) {
      return NextResponse.json({ error: "Limite diário de mensagens atingido" }, { status: 400 })
    }

    // Resetar a campanha
    await prisma.$transaction(async (tx) => {
      // Resetar contadores da campanha
      await tx.campaign.update({
        where: { id: params.id },
        data: {
          status: "PENDING",
          sentCount: 0,
          failedCount: 0,
          completedAt: null,
        },
      })

      // Resetar status dos envios
      await tx.campaignSend.updateMany({
        where: { campaignId: params.id },
        data: {
          status: "PENDING",
          sentAt: null,
          errorMessage: null,
          messageId: null,
        },
      })

      // Resetar batches
      await tx.campaignBatch.updateMany({
        where: { campaignId: params.id },
        data: {
          status: "PENDING",
          processedAt: null,
        },
      })
    })

    // Atualizar campanha para RUNNING
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: "RUNNING",
        scheduledAt: new Date(),
      },
    })

    // Processar primeiro lote imediatamente
    setTimeout(() => {
      processCampaignBatch(params.id, 1)
    }, 1000)

    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        sends: true,
        batches: true,
      },
    })

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error("Error restarting campaign:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
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

    // Determinar método de envio baseado no tamanho do arquivo
    let sendMethod: "url" | "base64" | "text" = "text"
    let mediaBase64: string | null = null
    let mimetype: string | null = null
    let mediaTypeForApi: string | null = null
    let fileSize = 0

    if (batch.campaign.mediaUrl) {
      try {
        const { readFile, stat } = await import("fs/promises")
        const { join } = await import("path")

        const fullPath = join(process.cwd(), "public", batch.campaign.mediaUrl)
        const fileStats = await stat(fullPath)
        fileSize = fileStats.size

        mimetype = getMimeTypeFromExtension(batch.campaign.fileName || "")
        mediaTypeForApi = getMediaTypeFromMime(mimetype)

        console.log(
          `[Campaign] File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB, mimetype: ${mimetype}, mediaType: ${mediaTypeForApi}`,
        )

        const BASE64_THRESHOLD = 100 * 1024 * 1024 // 100MB

        // Decidir método baseado no tamanho
        if (fileSize <= BASE64_THRESHOLD) {
          // Arquivos pequenos: tentar base64 primeiro, URL como fallback
          sendMethod = "base64"
          try {
            mediaBase64 = await fileToBase64(batch.campaign.mediaUrl)
            console.log(`[Campaign] Will use base64 method for small file`)
          } catch (error) {
            console.log(`[Campaign] Base64 failed, will use URL method`)
            sendMethod = "url"
          }
        } else {
          // Arquivos grandes: usar apenas URL
          sendMethod = "url"
          console.log(`[Campaign] Will use URL method for large file (${(fileSize / 1024 / 1024).toFixed(2)}MB)`)
        }
      } catch (error) {
        console.error("[Campaign] Error analyzing media file:", error)
        throw new Error("Erro ao analisar arquivo de mídia")
      }
    }

    // Calcular delay baseado no tamanho do arquivo
    let delayBetweenMessages = 2000 // 2 segundos padrão
    if (fileSize > 50 * 1024 * 1024) {
      // > 50MB
      delayBetweenMessages = 10000 // 10 segundos
    } else if (fileSize > 20 * 1024 * 1024) {
      // > 20MB
      delayBetweenMessages = 6000 // 6 segundos
    } else if (fileSize > 5 * 1024 * 1024) {
      // > 5MB
      delayBetweenMessages = 4000 // 4 segundos
    }

    console.log(`[Campaign] Using ${delayBetweenMessages}ms delay between messages`)

    // Enviar mensagens com delay
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      try {
        console.log(
          `[Campaign] Sending message ${i + 1}/${contacts.length} to ${contact.contact} using ${sendMethod} method`,
        )

        let response
        let success = false

        if (sendMethod === "base64" && mediaBase64) {
          // Método Base64
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

          if (response.ok) {
            success = true
            console.log(`[Campaign] Base64 method successful for ${contact.contact}`)
          } else {
            console.log(`[Campaign] Base64 method failed, trying URL fallback...`)
            sendMethod = "url" // Switch to URL for remaining contacts
          }
        }

        if ((sendMethod === "url" || !success) && batch.campaign.mediaUrl) {
          // Método URL
          if (process.env.NEXT_PUBLIC_APP_URL) {
            const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}${batch.campaign.mediaUrl}`

            const urlPayload = {
              number: contact.contact,
              mediatype: mediaTypeForApi,
              caption: batch.campaign.caption || batch.campaign.message || "",
              media: publicUrl,
              fileName: batch.campaign.fileName || "media",
            }

            console.log(`[Campaign] Trying URL method with: ${publicUrl}`)

            response = await fetch(`${evolutionApiUrl}/message/sendMedia/${instance.instanceName}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: evolutionApiKey,
              },
              body: JSON.stringify(urlPayload),
            })

            if (response.ok) {
              success = true
              console.log(`[Campaign] URL method successful for ${contact.contact}`)
            }
          } else {
            throw new Error("NEXT_PUBLIC_APP_URL não configurada para método URL")
          }
        }

        if (sendMethod === "text") {
          // Enviar texto
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
        }

        if (success && response) {
          const result = await response.json()
          console.log(`[Campaign] Message sent successfully to ${contact.contact}`)

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
      // Calcular intervalo baseado no tamanho do arquivo
      let intervalMinutes = 30 // Padrão
      if (fileSize > 50 * 1024 * 1024) {
        // > 50MB
        intervalMinutes = 60 // 1 hora
      } else if (fileSize > 20 * 1024 * 1024) {
        // > 20MB
        intervalMinutes = 45 // 45 minutos
      }

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

// Helper functions
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

async function fileToBase64(filePath: string): Promise<string> {
  try {
    const { readFile, stat } = await import("fs/promises")
    const { join } = await import("path")

    const fullPath = join(process.cwd(), "public", filePath)

    // Verificar se o arquivo existe
    const fileStats = await stat(fullPath)
    console.log(`[Campaign] Converting file to base64: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB`)

    const BASE64_THRESHOLD = 100 * 1024 * 1024 // 100MB
    if (fileStats.size > BASE64_THRESHOLD) {
      throw new Error(
        `Arquivo muito grande para base64: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB. Usando método URL.`,
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
