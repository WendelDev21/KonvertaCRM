import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import type { NextRequest } from "next/server"

// GET /api/users/[id] - Obtém detalhes de um usuário específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin ou o próprio usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || (user.role !== "admin" && userId !== params.id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }

      const requestedUser = await prisma.user.findUnique({
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

      if (!requestedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(requestedUser)
    } catch (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
    }
  })
}

// PUT /api/users/[id] - Atualiza um usuário específico
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin ou o próprio usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || (user.role !== "admin" && userId !== params.id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }

      const body = await req.json()

      // Prepare update data
      const updateData: any = {}

      if (body.name) updateData.name = body.name
      if (body.email) updateData.email = body.email

      // Only admin can update roles
      if (body.role && user.role === "admin") {
        updateData.role = body.role
      }

      // Handle password update
      if (body.password) {
        updateData.password = await hash(body.password, 10)
      }

      const updatedUser = await prisma.user.update({
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

      return NextResponse.json(updatedUser)
    } catch (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Error updating user" }, { status: 500 })
    }
  })
}

// DELETE /api/users/[id] - Remove um usuário (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
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
  })
}
