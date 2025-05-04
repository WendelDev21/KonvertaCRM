import { NextResponse } from "next/server"

// Simple health check endpoint that doesn't depend on external modules
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "System is operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "unknown",
  })
}
