import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import prisma from "@/lib/prisma"

// Rota de diagnóstico para verificar os dados no banco
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    // Buscar todos os contatos para verificar os valores reais de status e source
    const contacts = await prisma.contact.findMany({
      where: { userId },
      take: 10, // Limitar a 10 contatos para não sobrecarregar
    })

    // Extrair valores únicos de status e source
    const uniqueStatuses = [...new Set(contacts.map((c) => c.status))]
    const uniqueSources = [...new Set(contacts.map((c) => c.source))]

    // Contar quantos contatos existem para cada status e source
    const statusCounts = {}
    const sourceCounts = {}

    for (const contact of contacts) {
      statusCounts[contact.status] = (statusCounts[contact.status] || 0) + 1
      sourceCounts[contact.source] = (sourceCounts[contact.source] || 0) + 1
    }

    return NextResponse.json({
      totalContacts: contacts.length,
      uniqueStatuses,
      uniqueSources,
      statusCounts,
      sourceCounts,
      sampleContacts: contacts.slice(0, 3).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        source: c.source,
        // Incluir o tipo e o valor exato para debugging
        statusType: typeof c.status,
        sourceType: typeof c.source,
        statusExact: JSON.stringify(c.status),
        sourceExact: JSON.stringify(c.source),
      })),
    })
  } catch (error) {
    console.error("Error in debug route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
