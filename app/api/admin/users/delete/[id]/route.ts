import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// DELETE /api/admin/users/delete/[id] - Exclui permanentemente um usuário
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

      // Excluir permanentemente o usuário
      await prisma.user.delete({
        where: {
          id: params.id,
        },
      })

      return NextResponse.json({ success: true, message: "Usuário excluído permanentemente" })
    } catch (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
    }
  })
}
