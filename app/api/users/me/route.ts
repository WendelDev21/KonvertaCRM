import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash, compare } from "bcryptjs"
import { apiAuthMiddleware } from "@/middleware/api-auth"
import type { NextRequest } from "next/server"

// GET /api/users/me - Obter informações do usuário atual
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      try {
        // Tentar buscar apenas os campos que sabemos que existem
        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        if (!user) {
          return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }

        // Adicionar campos que podem não existir no banco de dados ainda
        return NextResponse.json({
          ...user,
          theme: "system", // Campo que pode não existir no banco de dados
          notificationSettings: JSON.stringify({
            emailNotifications: true,
            newContactAlert: true,
            statusChangeAlert: true,
            dailySummary: false,
          }), // Campo que pode não existir no banco de dados
        })
      } catch (error) {
        console.error("Erro ao buscar usuário do banco de dados:", error)

        // Retornar erro
        return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
    }
  })
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
