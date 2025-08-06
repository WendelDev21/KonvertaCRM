import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash, compare } from "bcryptjs"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserById } from "@/lib/services/user-service"
import type { NextRequest } from "next/server"

// GET /api/users/me - Obter informações do usuário atual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [user, error] = await getUserById(session.user.id)

    if (error || !user) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Ensure credits is a number before sending
    const credits = user.credits ? user.credits.toNumber() : 0;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      theme: user.theme,
      notificationSettings: user.notificationSettings,
      createdAt: user.createdAt,
      credits: credits, // Return credits as a number
    })
  } catch (error) {
    console.error("Error in /api/users/me route:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/users/me - Atualizar informações do usuário atual
export async function PUT(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      const body = await req.json()

      try {
        // Verificar se o usuário existe
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, password: true },
        })

        if (!existingUser) {
          return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }

        // Preparar dados para atualização
        const updateData: any = {}

        // Campos básicos
        if (body.name !== undefined) updateData.name = body.name
        if (body.email !== undefined) updateData.email = body.email

        // Verificar se está alterando a senha
        if (body.currentPassword && body.newPassword) {
          // Verificar se a senha atual está correta
          const isPasswordValid = await compare(body.currentPassword, existingUser.password)

          if (!isPasswordValid) {
            return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
          }

          // Hash da nova senha
          updateData.password = await hash(body.newPassword, 10)
        }

        try {
          // Tentar atualizar campos que podem não existir no esquema
          if (body.theme !== undefined) updateData.theme = body.theme
          if (body.notificationSettings !== undefined) {
            updateData.notificationSettings =
              typeof body.notificationSettings === "string"
                ? body.notificationSettings
                : JSON.stringify(body.notificationSettings)
          }

          // Atualizar o usuário
          const updatedUser = await prisma.user.update({
            where: {
              id: userId,
            },
            data: updateData,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              updatedAt: true,
            },
          })

          return NextResponse.json({
            ...updatedUser,
            theme: body.theme || "system",
            notificationSettings:
              typeof body.notificationSettings === "string"
                ? body.notificationSettings
                : JSON.stringify(
                    body.notificationSettings || {
                      emailNotifications: true,
                      newContactAlert: true,
                      statusChangeAlert: true,
                      dailySummary: false,
                    },
                  ),
          })
        } catch (error) {
          console.error("Erro ao atualizar campos adicionais:", error)

          // Tentar atualizar apenas os campos básicos
          const updatedUser = await prisma.user.update({
            where: {
              id: userId,
            },
            data: {
              name: body.name,
              email: body.email,
              ...(updateData.password ? { password: updateData.password } : {}),
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              updatedAt: true,
            },
          })

          return NextResponse.json({
            ...updatedUser,
            theme: body.theme || "system",
            notificationSettings:
              typeof body.notificationSettings === "string"
                ? body.notificationSettings
                : JSON.stringify(
                    body.notificationSettings || {
                      emailNotifications: true,
                      newContactAlert: true,
                      statusChangeAlert: true,
                      dailySummary: false,
                    },
                  ),
          })
        }
      } catch (error) {
        console.error("Erro ao atualizar usuário no banco de dados:", error)
        return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
    }
  })
}
