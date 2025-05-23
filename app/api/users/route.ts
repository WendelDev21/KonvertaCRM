// POST /api/users - Cria um ou múltiplos usuários (apenas admin)
import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { apiAuthMiddleware } from "@/lib/api-auth-middleware"

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

      // Detectar se é operação em lote ou individual
      const isBatch = Array.isArray(body)
      const users = isBatch ? body : [body]

      const results = []
      const errors = []

      for (let i = 0; i < users.length; i++) {
        const userData = users[i]

        try {
          // Validate data
          if (!userData.name || !userData.email || !userData.password) {
            errors.push({ index: i, error: "Incomplete data. Name, email, and password are required." })
            continue
          }

          // Check if email already exists
          const existingUser = await prisma.user.findUnique({
            where: {
              email: userData.email,
            },
          })

          if (existingUser) {
            errors.push({ index: i, error: "Email already in use." })
            continue
          }

          // Create user
          const hashedPassword = await hash(userData.password, 10)
          const newUser = await prisma.user.create({
            data: {
              name: userData.name,
              email: userData.email,
              password: hashedPassword,
              role: userData.role || "user", // Default to "user" if not specified
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

          results.push(newUser)
        } catch (error) {
          console.error(`Error creating user ${i + 1}:`, error)
          errors.push({ index: i, error: "Error creating user" })
        }
      }

      // Retornar resultado apropriado
      if (isBatch) {
        return NextResponse.json(
          {
            success: results.length > 0,
            created: results.length,
            total: users.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
          },
          { status: results.length > 0 ? 201 : 400 },
        )
      } else {
        if (results.length > 0) {
          return NextResponse.json(results[0], { status: 201 })
        } else {
          return NextResponse.json({ error: errors[0]?.error || "Error creating user" }, { status: 400 })
        }
      }
    } catch (error) {
      console.error("Error creating user(s):", error)
      return NextResponse.json({ error: "Error creating user(s)" }, { status: 500 })
    }
  })
}
