import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDashboardData } from "@/lib/services/dashboard-service"

// Desabilitar cache completamente
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Obter parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const sourceParam = searchParams.get("source")

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

    // Configurar cabeçalhos para evitar cache
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")
    headers.append("Surrogate-Control", "no-store")

    // Obter dados do dashboard
    const [dashboardData, error] = await getDashboardData(session.user.id, startDate, endDate, sourceParam || undefined)

    if (error) {
      console.error("Error fetching dashboard data:", error)
      return NextResponse.json(
        { error: "Failed to fetch dashboard data" },
        {
          status: 500,
          headers,
        },
      )
    }

    return NextResponse.json(dashboardData, {
      headers,
    })
  } catch (error) {
    console.error("Error in dashboard API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
