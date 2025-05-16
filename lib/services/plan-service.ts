import prisma from "../prisma"
import { PLAN_LIMITS, type UserPlan } from "../types/user-types"

/**
 * Verifica se o usuário atingiu o limite de contatos do seu plano
 */
export async function checkContactLimit(
  userId: string,
): Promise<{ allowed: boolean; limit: number | null; current: number }> {
  try {
    // Buscar o plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })

    if (!user) {
      throw new Error("Usuário não encontrado")
    }

    const plan = (user.plan as UserPlan) || "starter"
    const limits = PLAN_LIMITS[plan]

    // Se o plano não tem limite de contatos, retorna permitido
    if (limits.maxContacts === null) {
      return { allowed: true, limit: null, current: 0 }
    }

    // Contar quantos contatos o usuário já tem
    const contactCount = await prisma.contact.count({
      where: { userId },
    })

    // Verificar se está dentro do limite
    const allowed = contactCount < limits.maxContacts

    return {
      allowed,
      limit: limits.maxContacts,
      current: contactCount,
    }
  } catch (error) {
    console.error("Erro ao verificar limite de contatos:", error)
    throw error
  }
}

/**
 * Verifica se o usuário atingiu o limite de webhooks do seu plano
 */
export async function checkWebhookLimit(
  userId: string,
): Promise<{ allowed: boolean; limit: number | null; current: number }> {
  try {
    // Buscar o plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })

    if (!user) {
      throw new Error("Usuário não encontrado")
    }

    const plan = (user.plan as UserPlan) || "starter"
    const limits = PLAN_LIMITS[plan]

    // Se o plano não tem limite de webhooks, retorna permitido
    if (limits.maxWebhooks === null) {
      return { allowed: true, limit: null, current: 0 }
    }

    // Contar quantos webhooks o usuário já tem
    const webhookCount = await prisma.webhook.count({
      where: { userId },
    })

    // Verificar se está dentro do limite
    const allowed = webhookCount < limits.maxWebhooks

    return {
      allowed,
      limit: limits.maxWebhooks,
      current: webhookCount,
    }
  } catch (error) {
    console.error("Erro ao verificar limite de webhooks:", error)
    throw error
  }
}

/**
 * Obtém informações sobre o plano atual do usuário
 */
export async function getUserPlanInfo(userId: string): Promise<{
  plan: UserPlan
  limits: {
    contacts: { max: number | null; current: number }
    webhooks: { max: number | null; current: number }
  }
}> {
  try {
    // Buscar o plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })

    if (!user) {
      throw new Error("Usuário não encontrado")
    }

    const plan = (user.plan as UserPlan) || "starter"
    const limits = PLAN_LIMITS[plan]

    // Contar contatos e webhooks
    const contactCount = await prisma.contact.count({ where: { userId } })
    const webhookCount = await prisma.webhook.count({ where: { userId } })

    return {
      plan,
      limits: {
        contacts: {
          max: limits.maxContacts,
          current: contactCount,
        },
        webhooks: {
          max: limits.maxWebhooks,
          current: webhookCount,
        },
      },
    }
  } catch (error) {
    console.error("Erro ao obter informações do plano:", error)
    throw error
  }
}
