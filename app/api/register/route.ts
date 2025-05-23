import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

async function createUser({ name, email, password, role }: any) {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role,
      },
    })

    return [user, null]
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error)
    return [null, error]
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Detectar se é operação em lote ou individual
    const isBatch = Array.isArray(body)
    const users = isBatch ? body : [body]

    const results = []
    const errors = []

    for (let i = 0; i < users.length; i++) {
      const userData = users[i]

      try {
        const { name, email, password } = userData

        // Validate input
        if (!name || !email || !password) {
          errors.push({ index: i, error: "Nome, email e senha são obrigatórios" })
          continue
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          errors.push({ index: i, error: "Este email já está em uso" })
          continue
        }

        // Create user
        const [user, error] = await createUser({
          name,
          email,
          password,
          role: "user", // Default role
        })

        if (error) {
          errors.push({ index: i, error: error.message })
          continue
        }

        results.push({ user, message: "Usuário criado com sucesso" })
      } catch (error) {
        console.error(`Erro ao registrar usuário ${i + 1}:`, error)
        errors.push({ index: i, error: "Erro ao registrar usuário" })
      }
    }

    // Retornar resultado apropriado
    if (isBatch) {
      return NextResponse.json(
        {
          success: results.length > 0,
          created: results.length,
          total: users.length,
          results,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: results.length > 0 ? 201 : 400 },
      )
    } else {
      if (results.length > 0) {
        return NextResponse.json(results[0], { status: 201 })
      } else {
        return NextResponse.json({ error: errors[0]?.error || "Erro ao registrar usuário" }, { status: 400 })
      }
    }
  } catch (error) {
    console.error("Erro ao registrar usuário(s):", error)
    return NextResponse.json({ error: "Erro ao registrar usuário(s)" }, { status: 500 })
  }
}
