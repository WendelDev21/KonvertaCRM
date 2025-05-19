import { type NextRequest, NextResponse } from "next/server"
import { getConversionData } from "@/lib/services/dashboard-service"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/dashboard/conversion - Obtém taxas de conversão para o dashboard
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url)
      const period = searchParams.get("period") || "month"
      const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : null
      const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : null
      const source = searchParams.get("source") || null

      // Log the parameters for debugging
      console.log("Conversion API called with params:", { period, startDate, endDate, source })

      const [conversionData] = await getConversionData(userId, period)
      return NextResponse.json(conversionData)
    } catch (error) {
      console.error("Error fetching conversion data:", error)
      return NextResponse.json({ error: "Error fetching conversion data" }, { status: 500 })
    }
  })
}
