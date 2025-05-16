import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/lib/auth-utils"
import type { NextRequest } from "next/server"

// PUT /api/admin/users/[id]/plan - Atualiza o plano de um usuário (apenas admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(
    request,
    async (req, userId) => {
      try {
        const body = await req.json()

        // Validar dados
        if (!body.plan) {
          return NextResponse.json({ error: "Plano é obrigatório" }, { status: 400 })
        }

        // Verificar se o plano é válido
        const validPlans = ["free", "basic", "pro", "enterprise"]
        if (!validPlans.includes(body.plan)) {
          return NextResponse.json({ error: "Plano inválido" }, { status: 400 })
        }

        // Verificar se o usuário existe
        const userExists = await prisma.user.findUnique({
          where: { id: params.id },
        })

        if (!userExists) {
          return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }

        // Atualizar plano do usuário
        const updatedUser = await prisma.user.update({
          where: { id: params.id },
          data: {
            plan: body.plan,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            updatedAt: true,
          },
        })

        return NextResponse.json(updatedUser)
      } catch (error) {
        console.error("Erro ao atualizar plano do usuário:", error)
        return NextResponse.json({ error: "Erro ao atualizar plano do usuário" }, { status: 500 })
      }
    },
    true,
  ) // true indica que requer admin
}
