import { NextResponse } from "next/server"
import { seedDatabase } from "@/lib/seed-service"
import { getCurrentUser } from "@/lib/session"

export async function POST() {
  try {
    // Check if user is authenticated
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Seed the database
    const result = await seedDatabase()

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: result,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
