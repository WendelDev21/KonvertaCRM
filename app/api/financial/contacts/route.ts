import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Buscar contatos ordenados por valor
    const contacts = await prisma.contact.findMany({
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
}
