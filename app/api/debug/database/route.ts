import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Verificar tabelas existentes
    const tables = []

    // Verificar User
    try {
      const userCount = await prisma.user.count()
      tables.push({ name: "User", exists: true, count: userCount })
    } catch (error) {
      tables.push({ name: "User", exists: false, error: (error as Error).message })
    }

    // Verificar ApiToken
    try {
      const tokenCount = await prisma.apiToken.count()
      tables.push({ name: "ApiToken", exists: true, count: tokenCount })
    } catch (error) {
      tables.push({ name: "ApiToken", exists: false, error: (error as Error).message })
    }

    // Verificar Contact
    try {
      const contactCount = await prisma.contact.count()
      tables.push({ name: "Contact", exists: true, count: contactCount })
    } catch (error) {
      tables.push({ name: "Contact", exists: false, error: (error as Error).message })
    }

    // Verificar Webhook
    try {
      const webhookCount = await prisma.webhook.count()
      tables.push({ name: "Webhook", exists: true, count: webhookCount })
    } catch (error) {
      tables.push({ name: "Webhook", exists: false, error: (error as Error).message })
    }

    return NextResponse.json({
      tables,
      databaseUrl: process.env.DATABASE_URL ? "Configurado" : "Não configurado",
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("Erro ao verificar banco de dados:", error)
    return NextResponse.json({ error: "Erro ao verificar banco de dados" }, { status: 500 })
  }
}
