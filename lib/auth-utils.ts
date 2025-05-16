import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { UserRole } from "@/lib/types/user-types"

/**
 * Verifies if the user is authenticated and has the required role.
 * @param request The NextRequest object.
 * @returns An object containing the user session and a boolean indicating if the user is an admin.
 */
export async function verifyAdmin(request: NextRequest): Promise<{ user: any | null; isAdmin: boolean }> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return { user: null, isAdmin: false }
  }

  const user = session.user as { role?: UserRole; email: string; name?: string; image?: string }

  const isAdmin = user?.role === "admin"

  return { user, isAdmin }
}

/**
 * Authenticates the request and returns the user ID.
 * @param request The NextRequest object.
 * @returns The user ID if authenticated, otherwise null.
 */
export async function authenticateRequest(request: NextRequest): Promise<any | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return null
  }

  const user = session.user as { role?: UserRole; email: string; name?: string; image?: string; id: string }

  return user
}

/**
 * Middleware para autenticação de API.
 * Verifica se o usuário está autenticado e tem as permissões necessárias.
 *
 * @param request A requisição Next.js
 * @param handler A função que manipula a requisição autenticada
 * @param requireAdmin Se true, verifica se o usuário é administrador
 * @returns A resposta da função handler ou um erro de autenticação
 */
export async function apiAuthMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  requireAdmin = false,
): Promise<NextResponse> {
  try {
    // Verificar se há um token Bearer no cabeçalho Authorization
    const authHeader = request.headers.get("Authorization")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extrair o token
      const token = authHeader.substring(7)

      // Buscar o token no banco de dados
      const apiToken = await prisma.apiToken.findFirst({
        where: {
          token: token,
          isActive: true, // Corrigido: usando isActive em vez de revoked
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      })

      if (apiToken && apiToken.user) {
        // Atualizar lastUsed
        await prisma.apiToken.update({
          where: { id: apiToken.id },
          data: { lastUsed: new Date() },
        })

        // Verificar se o usuário é admin (se necessário)
        if (requireAdmin && apiToken.user.role !== "admin") {
          return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
        }

        // Chamar o handler com o ID do usuário
        return handler(request, apiToken.user.id)
      }
    }

    // Se não houver token Bearer ou o token for inválido, tenta autenticação via sessão
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
    }

    // Verificar se o usuário é admin (se necessário)
    if (requireAdmin && user.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
    }

    // Chamar o handler com o ID do usuário
    return handler(request, user.id)
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return NextResponse.json({ error: "Erro na autenticação" }, { status: 500 })
  }
}
