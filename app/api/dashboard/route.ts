import { type NextRequest, NextResponse } from "next/server"
import { getDashboardData } from "@/lib/services/dashboard-service"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Desabilitar cache completamente
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log("[API] Dashboard: Request received")

    // Obter a sessão do usuário
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Se não houver sessão, tentar autenticação via API
    if (!userId) {
      console.log("[API] Dashboard: No session, trying API auth")
      return apiAuthMiddleware(request, async (req, apiUserId) => {
        return await handleDashboardRequest(req, apiUserId)
      })
    }

    // Se houver sessão, processar normalmente
    console.log("[API] Dashboard: Session found, processing request")
    return await handleDashboardRequest(request, userId)
  } catch (error) {
    console.error("[API] Dashboard: Unhandled error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleDashboardRequest(request: NextRequest, userId: string) {
  try {
    console.log("[API] Dashboard: Processing request for user", userId)

    // Obter parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const sourceParam = searchParams.get("source")

    console.log("[API] Dashboard: Query params:", { startDateParam, endDateParam, sourceParam })

    // Definir datas padrão se não fornecidas
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(new Date().setDate(new Date().getDate() - 30))

    // Para a data final, não permitir datas futuras
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Final do dia atual

    const requestedEndDate = endDateParam ? new Date(endDateParam) : today
    // Garantir que a data final não seja futura
    const endDate = requestedEndDate > today ? today : requestedEndDate

    console.log("[API] Dashboard: Processed dates:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      source: sourceParam || "All",
    })

    // Configurar cabeçalhos para evitar cache
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")
    headers.append("Surrogate-Control", "no-store")

    try {
      // Obter dados do dashboard
      console.log("[API] Dashboard: Calling getDashboardData")
      const dashboardData = await getDashboardData(userId, startDate, endDate, sourceParam || undefined)

      console.log("[API] Dashboard: Data fetched successfully:", {
        statusCounts: dashboardData?.statusCounts ? Object.keys(dashboardData.statusCounts).length : 0,
        sourceCounts: dashboardData?.sourceCounts ? Object.keys(dashboardData.sourceCounts).length : 0,
      })

      return NextResponse.json(dashboardData, {
        headers,
      })
    } catch (error) {
      console.error("[API] Dashboard: Error fetching dashboard data:", error)
      return NextResponse.json(
        { error: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : String(error)}` },
        {
          status: 500,
          headers,
        },
      )
    }
  } catch (error) {
    console.error("[API] Dashboard: Error in handleDashboardRequest:", error)
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
