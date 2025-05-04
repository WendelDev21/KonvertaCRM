import { NextResponse } from "next/server"

// Simple diagnostic route that doesn't depend on external modules
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Debug API is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
  })
}
