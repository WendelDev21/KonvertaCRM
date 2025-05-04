import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Buscar todas as fontes distintas usadas pelo usuário
    const sources = await prisma.contact.findMany({
      where: {
        userId: userId,
      },
      select: {
        source: true,
      },
      distinct: ["source"],
    })

    // Extrair e ordenar as fontes
    const uniqueSources = sources
      .map((item) => item.source)
      .filter(Boolean)
      .sort()

    return NextResponse.json({ sources: uniqueSources })
  } catch (error) {
    console.error("Error fetching sources:", error)
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 })
  }
}
