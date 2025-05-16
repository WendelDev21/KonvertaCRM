import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { apiAuthMiddleware } from "@/lib/auth-utils"
import type { NextRequest } from "next/server"

// GET /api/users/[id] - Obtém detalhes de um usuário específico (apenas admin)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(
    request,
    async (req, userId) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: params.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            createdAt: true,
            updatedAt: true,
            image: true,
          },
        })

        if (!user) {
          return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }

        return NextResponse.json(user)
      } catch (error) {
        console.error("Erro ao buscar usuário:", error)
        return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
      }
    },
    true,
  ) // true indica que requer admin
}

// PUT /api/users/[id] - Atualiza um usuário (apenas admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(
    request,
    async (req, userId) => {
      try {
        const body = await req.json()

        // Validar dados
        if (!body.name || !body.email) {
          return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 })
        }

        // Verificar se o usuário existe
        const userExists = await prisma.user.findUnique({
          where: { id: params.id },
        })

        if (!userExists) {
          return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }

        // Verificar se o email já está em uso por outro usuário
        if (body.email !== userExists.email) {
          const emailExists = await prisma.user.findUnique({
            where: { email: body.email },
          })

          if (emailExists && emailExists.id !== params.id) {
            return NextResponse.json({ error: "Email já está em uso por outro usuário" }, { status: 400 })
          }
        }

        // Preparar dados para atualização
        const updateData: any = {
          name: body.name,
          email: body.email,
          role: body.role || userExists.role,
          plan: body.plan || userExists.plan,
        }

        // Se a senha foi fornecida, hash e atualiza
        if (body.password) {
          updateData.password = await hash(body.password, 10)
        }

        // Atualizar usuário
        const updatedUser = await prisma.user.update({
          where: { id: params.id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            createdAt: true,
            updatedAt: true,
            image: true,
          },
        })

        return NextResponse.json(updatedUser)
      } catch (error) {
        console.error("Erro ao atualizar usuário:", error)
        return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
      }
    },
    true,
  ) // true indica que requer admin
}

// DELETE /api/users/[id] - Exclui um usuário (apenas admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(
    request,
    async (req, userId) => {
      try {
        // Verificar se o usuário existe
        const userExists = await prisma.user.findUnique({
          where: { id: params.id },
        })

        if (!userExists) {
          return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }

        // Impedir que um admin exclua a si mesmo
        if (params.id === userId) {
          return NextResponse.json({ error: "Não é possível excluir seu próprio usuário" }, { status: 400 })
        }

        // Excluir usuário
        await prisma.user.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error("Erro ao excluir usuário:", error)
        return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
      }
    },
    true,
  ) // true indica que requer admin
}
