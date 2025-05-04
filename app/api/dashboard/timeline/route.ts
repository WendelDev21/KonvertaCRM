import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getActivityTimeline } from "@/lib/services/dashboard-service"

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const sourceParam = searchParams.get("source")

    // Set default dates if not provided
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(new Date().setDate(new Date().getDate() - 30))

    // For end date, don't allow future dates
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of current day

    const requestedEndDate = endDateParam ? new Date(endDateParam) : today
    // Ensure end date is not in the future
    const endDate = requestedEndDate > today ? today : requestedEndDate

    // Configure headers to avoid caching
    const headers = new Headers()
    headers.append("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    headers.append("Pragma", "no-cache")
    headers.append("Expires", "0")
    headers.append("Surrogate-Control", "no-store")
    headers.append("Vary", "*")

    // Get timeline data
    const [timeline, error] = await getActivityTimeline(user.id, startDate, endDate, sourceParam || undefined)

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
}
