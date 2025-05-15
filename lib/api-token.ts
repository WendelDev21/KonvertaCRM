import { randomBytes, createHash } from "crypto"
import prisma from "./prisma"
import { getCurrentUser } from "./session"

// Gerar um novo token de API
export async function generateApiToken(userId: string, name?: string): Promise<string | null> {
  try {
    // Verificar se o usuário existe antes de criar o token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      console.error(`Usuário com ID ${userId} não encontrado`)
      return null
    }

    // Gerar token aleatório
    const tokenBytes = randomBytes(32)
    const token = tokenBytes.toString("hex")

    // Hash do token para armazenamento
    const hashedToken = createHash("sha256").update(token).digest("hex")

    // Desativar tokens anteriores
    await prisma.apiToken.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    })

    // Criar novo token
    await prisma.apiToken.create({
      data: {
        token: hashedToken,
        name: name || "API Token",
        userId,
        isActive: true,
        // Token não expira por padrão
      },
    })

    return token
  } catch (error) {
    console.error("Erro ao gerar token de API:", error)
    return null
  }
}

// Verificar se um token é válido
export async function verifyApiToken(token: string): Promise<{ isValid: boolean; userId?: string }> {
  try {
    if (!token) {
      return { isValid: false }
    }

    // Hash do token para comparação
    const hashedToken = createHash("sha256").update(token).digest("hex")

    // Buscar token no banco de dados
    const apiToken = await prisma.apiToken.findFirst({
      where: {
        token: hashedToken,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
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

    if (!apiToken) {
      return { isValid: false }
    }

    // Atualizar última utilização
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    })

    return {
      isValid: true,
      userId: apiToken.userId,
    }
  } catch (error) {
    console.error("Erro ao verificar token de API:", error)
    return { isValid: false }
  }
}

// Obter o token ativo do usuário atual
export async function getCurrentUserApiToken() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return [null, new Error("Usuário não autenticado")]
    }

    const userId = (currentUser as any).id

    const apiToken = await prisma.apiToken.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return [apiToken, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

// Revogar um token específico
export async function revokeApiToken(tokenId: string, userId: string) {
  try {
    const result = await prisma.apiToken.updateMany({
      where: {
        id: tokenId,
        userId,
      },
      data: {
        isActive: false,
      },
    })

    return [result.count > 0, null]
  } catch (error) {
    return [false, error instanceof Error ? error : new Error(String(error))]
  }
}

// Listar todos os tokens de um usuário
export async function listUserApiTokens(userId: string) {
  try {
    const tokens = await prisma.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return [tokens, null]
  } catch (error) {
    return [[], error instanceof Error ? error : new Error(String(error))]
  }
}
