const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Iniciando migração de planos de usuários...")

    // Verificar se a coluna plan existe
    try {
      await prisma.$queryRaw`SELECT "plan" FROM "User" LIMIT 1`
      console.log("Coluna 'plan' já existe na tabela User")
    } catch (error) {
      console.log("Adicionando coluna 'plan' à tabela User...")
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'starter'`
      console.log("Coluna 'plan' adicionada com sucesso")
    }

    // Atualizar todos os usuários para o plano starter por padrão
    const updatedCount = await prisma.user.updateMany({
      where: {
        plan: null,
      },
      data: {
        plan: "starter",
      },
    })

    console.log(`${updatedCount.count} usuários atualizados para o plano starter`)

    // Atualizar usuários admin para o plano business
    const updatedAdmins = await prisma.user.updateMany({
      where: {
        role: "admin",
      },
      data: {
        plan: "business",
      },
    })

    console.log(`${updatedAdmins.count} usuários admin atualizados para o plano business`)
    console.log("Migração concluída com sucesso!")
  } catch (error) {
    console.error("Erro durante a migração:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
