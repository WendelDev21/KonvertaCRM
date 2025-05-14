import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"

// POST /api/webhooks/test - Test a webhook
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate URL
    if (!body.url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 })
    }

    try {
      new URL(body.url)
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL. Provide a complete and valid URL." }, { status: 400 })
    }

    console.log(`Testing webhook to URL: ${body.url}`)

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add signature header if there's a secret
    if (body.secret) {
      headers["X-Webhook-Signature"] = `sha256=${body.secret}`
      console.log("Added signature header with secret")
    }

    // Prepare test payload
    const testPayload = {
      event: "test",
      payload: {
        message: "This is a test webhook from Konverta",
        timestamp: new Date().toISOString(),
      },
    }

    console.log("Sending test webhook...")

    // Make the HTTP call
    const response = await fetch(body.url, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
    })

    // Get the response
    const status = response.status
    const responseText = await response.text()

    console.log(
      `Webhook test response: Status ${status}, Body: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`,
    )

    return NextResponse.json({
      success: status >= 200 && status < 300,
      status,
      response: responseText,
    })
  } catch (error) {
    console.error("Error testing webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
