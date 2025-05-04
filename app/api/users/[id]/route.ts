import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { hash } from "bcrypt"

// GET /api/users/[id] - Get a specific user
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    // Check if user is admin or the user themselves
    if (!currentUser || ((currentUser as any).role !== "admin" && (currentUser as any).id !== params.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    // Check if user is admin or the user themselves
    if (!currentUser || ((currentUser as any).role !== "admin" && (currentUser as any).id !== params.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Prepare update data
    const updateData: any = {}

    if (body.name) updateData.name = body.name
    if (body.email) updateData.email = body.email

    // Only admin can update roles
    if (body.role && (currentUser as any).role === "admin") {
      updateData.role = body.role
    }

    // Handle password update
    if (body.password) {
      updateData.password = await hash(body.password, 10)
    }

    const user = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error updating user" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete a user (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    // Check if user is admin
    if (!currentUser || (currentUser as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.user.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 })
  }
}
