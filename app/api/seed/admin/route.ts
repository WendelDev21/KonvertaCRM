import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Verificar se o usuário atual é admin
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores podem criar o usuário admin." },
        { status: 403 },
      )
    }

    // Verificar se o usuário admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: "admin@tester.superuser",
      },
    })

    if (existingAdmin) {
      // Atualizar o usuário existente para ter role admin
      await prisma.user.update({
        where: {
          email: "admin@tester.superuser",
        },
        data: {
          role: "admin",
          plan: "business",
        },
      })

      return NextResponse.json({ message: "Usuário admin atualizado com sucesso!" })
    }

    // Criar o hash da senha
    const hashedPassword = await hash("@wendelAdmin2003", 10)

    // Criar o usuário admin
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@tester.superuser",
        password: hashedPassword,
        role: "admin",
        plan: "business",
      },
    })

    return NextResponse.json({ message: "Usuário admin criado com sucesso!" })
  } catch (error) {
    console.error("Erro ao criar usuário admin:", error)
    return NextResponse.json({ error: "Erro ao criar usuário admin" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
