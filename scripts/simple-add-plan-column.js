const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function addPlanColumn() {
  try {
    // Verificar se a migração já foi aplicada
    console.log("Verificando se a coluna plan já existe...")

    // Atualizar todos os usuários para o plano starter por padrão
    console.log("Atualizando usuários para o plano starter...")
    await prisma.user.updateMany({
      where: {
        plan: null,
      },
      data: {
        plan: "starter",
      },
    })

    // Atualizar usuários admin para o plano business
    console.log("Atualizando usuários admin para o plano business...")
    await prisma.user.updateMany({
      where: {
        role: "admin",
      },
      data: {
        plan: "business",
      },
    })

    console.log("Migração concluída com sucesso!")
  } catch (error) {
    console.error("Erro durante a migração:", error)
  } finally {
    await prisma.$disconnect()
  }
}

addPlanColumn()
