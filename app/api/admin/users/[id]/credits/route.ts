import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import { updateUserCredits, deductUserCredits } from "@/lib/services/user-service"

// POST /api/admin/users/[id]/credits - Adiciona ou deduz créditos de um usuário específico
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return apiAuthMiddleware(request, async (req, adminUserId) => {
    try {
      // Verificar se o usuário autenticado é admin
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId },
        select: { role: true },
      })

      if (!adminUser || adminUser.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado. Somente administradores podem manipular créditos." }, { status: 403 })
      }

      const { amount, type } = await req.json()

      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "O valor do crédito deve ser um número positivo." }, { status: 400 })
      }
      if (type !== "add" && type !== "deduct") {
        return NextResponse.json({ error: "Tipo de operação inválido. Use 'add' ou 'deduct'." }, { status: 400 })
      }

      const targetUserId = params.id

      let updatedUser
      if (type === "add") {
        const [user, error] = await updateUserCredits(targetUserId, amount)
        if (error) throw error
        updatedUser = user
      } else { // type === "deduct"
        const [user, error] = await deductUserCredits(targetUserId, amount)
        if (error) throw error
        updatedUser = user
      }

      if (!updatedUser) {
        return NextResponse.json({ error: "Usuário não encontrado ou operação falhou." }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        userId: updatedUser.id,
        newCredits: updatedUser.credits,
        message: `Créditos ${type === "add" ? "adicionados" : "deduzidos"} com sucesso.`,
      })
    } catch (error: any) {
      console.error("Error manipulating user credits:", error)
      return NextResponse.json({ error: error.message || "Erro ao manipular créditos do usuário" }, { status: 500 })
    }
  })
}
