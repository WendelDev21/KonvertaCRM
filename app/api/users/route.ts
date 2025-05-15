import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import type { NextRequest } from "next/server"

// GET /api/users - Lista todos os usuários (apenas admin)
export async function GET(request: NextRequest) {
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

      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json(users)
    } catch (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
    }
  })
}

// POST /api/users - Cria um novo usuário (apenas admin)
export async function POST(request: NextRequest) {
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

      const body = await req.json()

      // Validate data
      if (!body.name || !body.email || !body.password) {
        return NextResponse.json({ error: "Incomplete data. Name, email, and password are required." }, { status: 400 })
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email: body.email,
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email already in use." }, { status: 400 })
      }

      // Create user
      const hashedPassword = await hash(body.password, 10)
      const newUser = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role: body.role || "user", // Default to "user" if not specified
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

      return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: "Error creating user" }, { status: 500 })
    }
  })
}
