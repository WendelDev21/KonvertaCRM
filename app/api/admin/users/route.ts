import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { apiAuthMiddleware } from "@/lib/auth-utils"
import type { NextRequest } from "next/server"

// POST /api/admin/users - Cria um novo usuário (apenas admin)
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(
    request,
    async (req, userId) => {
      try {
        const body = await req.json()

        // Validar dados
        if (!body.name || !body.email || !body.password) {
          return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 })
        }

        // Verificar se o email já está em uso
        const existingUser = await prisma.user.findUnique({
          where: { email: body.email },
        })

        if (existingUser) {
          return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
        }

        // Hash da senha
        const hashedPassword = await hash(body.password, 10)

        // Criar usuário
        const newUser = await prisma.user.create({
          data: {
            name: body.name,
            email: body.email,
            password: hashedPassword,
            role: body.role || "user",
            plan: body.plan || "free",
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        return NextResponse.json(newUser, { status: 201 })
      } catch (error) {
        console.error("Erro ao criar usuário:", error)
        return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
      }
    },
    true,
  ) // true indica que requer admin
}
