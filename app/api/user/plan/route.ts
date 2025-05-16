import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getUserPlanInfo } from "@/lib/services/plan-service"
import type { UserPlan } from "@/lib/types/user-types"

// GET /api/user/plan - Obtém informações do plano do usuário atual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const userId = session.user.id
    const planInfo = await getUserPlanInfo(userId)

    return NextResponse.json(planInfo)
  } catch (error) {
    console.error("Erro ao obter informações do plano:", error)
    return NextResponse.json({ error: "Erro ao obter informações do plano" }, { status: 500 })
  }
}

// PUT /api/user/plan - Atualiza o plano de um usuário (apenas admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se o usuário é admin
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem atualizar planos" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, plan } = body

    if (!userId || !plan) {
      return NextResponse.json({ error: "ID do usuário e plano são obrigatórios" }, { status: 400 })
    }

    // Verificar se o plano é válido
    const validPlans: UserPlan[] = ["starter", "pro", "business"]
    if (!validPlans.includes(plan as UserPlan)) {
      return NextResponse.json({ error: `Plano inválido. Planos válidos: ${validPlans.join(", ")}` }, { status: 400 })
    }

    // Atualizar o plano do usuário
    await prisma.user.update({
      where: { id: userId },
      data: { plan },
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error("Erro ao atualizar plano:", error)
    return NextResponse.json({ error: "Erro ao atualizar plano" }, { status: 500 })
  }
}
