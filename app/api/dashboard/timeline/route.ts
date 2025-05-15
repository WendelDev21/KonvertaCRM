import { type NextRequest, NextResponse } from "next/server"
import { getActivityTimeline } from "@/lib/services/dashboard-service"
import { apiAuthMiddleware } from "@/middleware/api-auth"

export const dynamic = "force-dynamic" // Desabilitar cache para sempre obter dados frescos

export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Obter parâmetros de consulta
      const searchParams = req.nextUrl.searchParams
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

      console.log(
        `[API] Buscando timeline para usuário ${userId} de ${startDate.toISOString()} até ${endDate.toISOString()}`,
      )

      // Configurar cabeçalhos para evitar cache
      const headers = new Headers()
      headers.append("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
      headers.append("Pragma", "no-cache")
      headers.append("Expires", "0")
      headers.append("Surrogate-Control", "no-store")
      headers.append("Vary", "*")

      // Obter dados de timeline
      const [timeline, error] = await getActivityTimeline(userId, startDate, endDate, sourceParam || undefined)

      if (error) {
        console.error("Error fetching timeline data:", error)
        return NextResponse.json(
          { error: "Failed to fetch timeline data" },
          {
            status: 500,
            headers,
          },
        )
      }

      // Garantir que a resposta tenha o formato esperado pelo frontend
      return NextResponse.json(
        { timeline },
        {
          headers,
        },
      )
    } catch (error) {
      console.error("Error in timeline API:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  })
}
