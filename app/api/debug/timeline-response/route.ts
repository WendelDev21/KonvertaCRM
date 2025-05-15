import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActivityTimeline } from "@/lib/services/dashboard-service"

export const dynamic = "force-dynamic" // Desabilitar cache para sempre obter dados frescos

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const endDate = new Date()

    console.log(`[Debug] Testando timeline para usuário ${userId}`)

    // Obter dados de timeline
    const [timeline, error] = await getActivityTimeline(userId, startDate, endDate)

    if (error) {
      console.error("[Debug] Erro ao buscar timeline:", error)
      return NextResponse.json({ error: "Failed to fetch timeline data", details: error.message }, { status: 500 })
    }

    // Retornar a resposta completa para diagnóstico
    return NextResponse.json({
      success: true,
      timeline,
      timelineLength: timeline.length,
      responseType: typeof timeline,
      isArray: Array.isArray(timeline),
      sample: timeline.length > 0 ? timeline[0] : null,
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
  } catch (error) {
    console.error("[Debug] Erro no endpoint de diagnóstico:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
