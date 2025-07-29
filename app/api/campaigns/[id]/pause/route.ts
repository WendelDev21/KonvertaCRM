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

    if (campaign.status !== "RUNNING") {
      return NextResponse.json({ error: "Campaign is not running" }, { status: 400 })
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "PAUSED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error pausing campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
