import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/reports - Listar todos os relatórios do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    // Buscar relatórios do usuário
    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error)
    return NextResponse.json({ error: "Erro ao buscar relatórios" }, { status: 500 })
  }
}

// DELETE /api/reports - Excluir todos os relatórios do usuário
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    // Excluir todos os relatórios do usuário
    await prisma.report.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir relatórios:", error)
    return NextResponse.json({ error: "Erro ao excluir relatórios" }, { status: 500 })
  }
}
