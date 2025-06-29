import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { apiAuthMiddleware } from "@/middleware/api-auth"

export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Buscar contatos ordenados por valor, filtrados por usuário
      const contacts = await prisma.contact.findMany({
        where: { userId }, // Filtrar por usuário
        orderBy: { value: "desc" },
        select: {
          id: true,
          name: true,
          contact: true,
          status: true,
          source: true,
          value: true,
          createdAt: true,
        },
      })

      return NextResponse.json(contacts)
    } catch (error) {
      console.error("Erro ao buscar contatos financeiros:", error)
      return NextResponse.json({ error: "Erro ao buscar contatos financeiros" }, { status: 500 })
    }
  })
}
