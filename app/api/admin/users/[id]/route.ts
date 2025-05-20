import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/admin/users/[id] - Obtém detalhes de um usuário específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
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
          plan: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          bio: true,
          theme: true,
          image: true,
          notificationSettings: true,
          // Exclude password
        },
      })

      if (!requestedUser) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
      }

      return NextResponse.json(requestedUser)
    } catch (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
    }
  })
}

// PUT /api/admin/users/[id] - Atualiza um usuário específico
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
      }

      const body = await req.json()
      console.log(`Atualizando usuário ${params.id} com dados:`, body) // Log para debug

      // Prepare update data
      const updateData: any = {}

      if (body.name !== undefined) updateData.name = body.name
      if (body.email !== undefined) updateData.email = body.email
      if (body.role !== undefined) updateData.role = body.role
      if (body.isActive !== undefined) updateData.isActive = body.isActive
      if (body.bio !== undefined) updateData.bio = body.bio
      if (body.theme !== undefined) updateData.theme = body.theme
      if (body.image !== undefined) updateData.image = body.image
      if (body.plan !== undefined) updateData.plan = body.plan
      if (body.notificationSettings !== undefined) {
        updateData.notificationSettings =
          typeof body.notificationSettings === "string"
            ? body.notificationSettings
            : JSON.stringify(body.notificationSettings)
      }

      // Handle password update
      if (body.password) {
        updateData.password = await hash(body.password, 10)
      }

      console.log(`Dados preparados para atualização:`, updateData) // Log para debug

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
          plan: true, // Certifique-se de que o plano está sendo selecionado
          createdAt: true,
          updatedAt: true,
          isActive: true,
          bio: true,
          theme: true,
          // Exclude password
        },
      })

      console.log(`Usuário atualizado com sucesso:`, updatedUser) // Log para debug

      // Verificar se o plano foi atualizado corretamente
      const verifiedUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: { plan: true },
      })

      console.log(`Verificação pós-atualização do plano:`, verifiedUser) // Log para debug

      return NextResponse.json(updatedUser)
    } catch (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
    }
  })
}

// DELETE /api/admin/users/[id] - Remove um usuário
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
      }

      // Verificar se não está tentando excluir a si mesmo
      if (params.id === userId) {
        return NextResponse.json({ error: "Não é possível excluir seu próprio usuário" }, { status: 400 })
      }

      // Em vez de excluir permanentemente, marcar como inativo
      const updatedUser = await prisma.user.update({
        where: {
          id: params.id,
        },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          isActive: true,
        },
      })

      return NextResponse.json({ success: true, id: updatedUser.id, isActive: updatedUser.isActive })
    } catch (error) {
      console.error("Error deactivating user:", error)
      return NextResponse.json({ error: "Erro ao desativar usuário" }, { status: 500 })
    }
  })
}
