import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando migração...")

  // Verificar se a coluna já existe
  try {
    await prisma.$queryRaw`SELECT "isActive" FROM "User" LIMIT 1`
    console.log("Coluna isActive já existe.")
  } catch (error) {
    console.log("Adicionando coluna isActive à tabela User...")
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true`
    console.log("Coluna isActive adicionada com sucesso!")
  }

  // Definir todos os usuários existentes como ativos
  const updateCount = await prisma.user.updateMany({
    where: {
      isActive: null,
    },
    data: {
      isActive: true,
    },
  })

  console.log(`${updateCount.count} usuários foram definidos como ativos.`)
  console.log("Migração concluída com sucesso!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
