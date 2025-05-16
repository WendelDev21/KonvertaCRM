const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function addPlanColumn() {
  try {
    console.log("Verificando usuários existentes...")

    // Buscar todos os usuários
    const users = await prisma.user.findMany()
    console.log(`Encontrados ${users.length} usuários.`)

    // Atualizar cada usuário para o plano starter por padrão
    console.log("Atualizando usuários para o plano starter...")

    for (const user of users) {
      // Se o usuário for admin, definir como business, caso contrário starter
      const plan = user.role === "admin" ? "business" : "starter"

      await prisma.user.update({
        where: { id: user.id },
        data: { plan },
      })

      console.log(`Usuário ${user.email} atualizado para o plano ${plan}.`)
    }

    console.log("Migração concluída com sucesso!")
  } catch (error) {
    console.error("Erro durante a migração:", error)
  } finally {
    await prisma.$disconnect()
  }
}

addPlanColumn()
  .then(() => console.log("Script finalizado."))
  .catch((e) => console.error("Erro no script:", e))
