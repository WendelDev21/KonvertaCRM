import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest) {
  console.log("Test PUT request received")

  try {
    const body = await request.json()
    console.log("Request body:", body)

    return NextResponse.json({
      success: true,
      message: "PUT request received successfully",
      receivedData: body,
    })
  } catch (error) {
    console.error("Error processing test PUT request:", error)
    return NextResponse.json(
      {
        error: "Error processing request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
