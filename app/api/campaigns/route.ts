import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, message, instanceId, contactIds } = await request.json()

    if (!name || !message || !instanceId || !contactIds || contactIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyLimit = await prisma.dailyLimit.findFirst({
      where: {
        userId: session.user.id,
        date: today,
      },
    })

    const currentSent = dailyLimit?.sentCount || 0
    const maxDaily = 100

    if (currentSent + contactIds.length > maxDaily) {
      return NextResponse.json(
        { error: `Daily limit exceeded. You can send ${maxDaily - currentSent} more messages today.` },
        { status: 400 },
      )
    }

    // Verify instance exists and is connected
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        id: instanceId,
        userId: session.user.id,
        status: "CONNECTED",
      },
    })

    if (!instance) {
      return NextResponse.json({ error: "WhatsApp instance not found or not connected" }, { status: 400 })
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        message,
        userId: session.user.id,
        instanceId,
        totalContacts: contactIds.length,
        status: "PENDING",
      },
    })

    // Create campaign sends
    const campaignSends = contactIds.map((contactId: string) => ({
      campaignId: campaign.id,
      contactId,
      status: "PENDING",
    }))

    await prisma.campaignSend.createMany({
      data: campaignSends,
    })

    // Create batches (20 contacts per batch)
    const batchSize = 20
    const batches = []

    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batchContacts = contactIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const scheduledAt = new Date(Date.now() + (batchNumber - 1) * 60 * 60 * 1000) // 1 hour intervals

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

    // Update campaign status to RUNNING and schedule first batch
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "RUNNING",
        scheduledAt: new Date(),
      },
    })

    // Process first batch immediately (in background)
    processCampaignBatch(campaign.id, 1)

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Background function to process campaign batches
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

    // Update batch status
    await prisma.campaignBatch.update({
      where: { id: batch.id },
      data: {
        status: "PROCESSING",
        processedAt: new Date(),
      },
    })

    // Get instance details
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        id: batch.campaign.instanceId,
        status: "CONNECTED",
      },
    })

    if (!instance) {
      await prisma.campaignBatch.update({
        where: { id: batch.id },
        data: { status: "FAILED" },
      })
      return
    }

    // Get contacts for this batch
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: batch.contactIds },
        userId: batch.campaign.userId,
      },
    })

    let sentCount = 0
    let failedCount = 0

    // Send messages to each contact
    for (const contact of contacts) {
      try {
        // Send message via Evolution API
        const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${instance.instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.EVOLUTION_API_KEY || "",
          },
          body: JSON.stringify({
            number: contact.contact,
            text: batch.campaign.message,
          }),
        })

        if (response.ok) {
          const result = await response.json()

          // Update campaign send status
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
              messageId: result.key?.id || null,
            },
          })

          sentCount++
        } else {
          throw new Error(`API error: ${response.statusText}`)
        }
      } catch (error) {
        console.error(`Error sending message to ${contact.contact}:`, error)

        // Update campaign send status
        await prisma.campaignSend.update({
          where: {
            campaignId_contactId: {
              campaignId,
              contactId: contact.id,
            },
          },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          },
        })

        failedCount++
      }

      // Add delay between messages (1.2 seconds as per Evolution API recommendation)
      await new Promise((resolve) => setTimeout(resolve, 1200))
    }

    // Update batch status
    await prisma.campaignBatch.update({
      where: { id: batch.id },
      data: { status: "COMPLETED" },
    })

    // Update campaign counters
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: { increment: sentCount },
        failedCount: { increment: failedCount },
      },
    })

    // Update daily limit
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
        sentCount: { increment: sentCount },
      },
      create: {
        userId: batch.campaign.userId,
        date: today,
        sentCount: sentCount,
      },
    })

    // Check if campaign is complete
    const totalBatches = await prisma.campaignBatch.count({
      where: { campaignId },
    })

    const completedBatches = await prisma.campaignBatch.count({
      where: {
        campaignId,
        status: { in: ["COMPLETED", "FAILED"] },
      },
    })

    if (completedBatches >= totalBatches) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      })
    } else {
      // Schedule next batch
      const nextBatch = await prisma.campaignBatch.findFirst({
        where: {
          campaignId,
          status: "PENDING",
        },
        orderBy: { batchNumber: "asc" },
      })

      if (nextBatch) {
        // Schedule next batch to run in 1 hour
        setTimeout(
          () => {
            processCampaignBatch(campaignId, nextBatch.batchNumber)
          },
          60 * 60 * 1000,
        ) // 1 hour
      }
    }
  } catch (error) {
    console.error("Error processing campaign batch:", error)

    // Update batch status to failed
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
