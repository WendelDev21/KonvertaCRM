import { NextResponse } from "next/server"
import { createUser } from "@/lib/services/user-service"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Este email já está em uso" }, { status: 400 })
    }

    // Create user
    const [user, error] = await createUser({
      name,
      email,
      password,
      role: "user", // Default role
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ user, message: "Usuário criado com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao registrar usuário:", error)
    return NextResponse.json({ error: "Erro ao registrar usuário" }, { status: 500 })
  }
}
