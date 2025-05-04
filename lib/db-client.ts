import { PrismaClient } from "@prisma/client"

// PrismaClient é anexado ao objeto `global` em desenvolvimento para evitar
// esgotar o limite de conexão do banco de dados.
// Saiba mais: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Função auxiliar para lidar com erros do Prisma
export async function dbAction<T>(action: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    console.log("Starting database action")
    const result = await action()
    console.log("Database action completed successfully:", result)
    return [result, null]
  } catch (error) {
    console.error("Database action error:", error)
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

export default prisma
