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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyLimit = await prisma.dailyLimit.findFirst({
      where: {
        userId: session.user.id,
        date: today,
      },
    })

    return NextResponse.json({
      sentCount: dailyLimit?.sentCount || 0,
      limit: 100,
      date: today.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching daily limit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
