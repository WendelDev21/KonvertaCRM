import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaignId = params.id

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: session.user.id,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (campaign.status !== "PAUSED") {
      return NextResponse.json({ error: "Campaign is not paused" }, { status: 400 })
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING" },
    })

    // Resume processing pending batches
    const nextBatch = await prisma.campaignBatch.findFirst({
      where: {
        campaignId,
        status: "PENDING",
      },
      orderBy: { batchNumber: "asc" },
    })

    if (nextBatch) {
      // Import the processing function (you might need to extract it to a separate module)
      // processCampaignBatch(campaignId, nextBatch.batchNumber)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resuming campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
