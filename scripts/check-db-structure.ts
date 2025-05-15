import prisma from "../lib/prisma"

async function checkDatabaseStructure() {
  try {
    console.log("Verificando estrutura do banco de dados...")

    // Verificar tabela User
    const users = await prisma.user.findMany({
      take: 1,
      select: { id: true },
    })
    console.log(`Tabela User: ${users.length > 0 ? "OK" : "Sem dados"}`)

    // Verificar se a tabela ApiToken existe
    try {
      const tokens = await prisma.apiToken.findMany({
        take: 1,
        select: { id: true },
      })
      console.log(`Tabela ApiToken: OK`)
    } catch (error) {
      console.error("Erro ao acessar tabela ApiToken:", error)
      console.log("Você precisa executar uma migração para criar a tabela ApiToken")
    }

    // Verificar usuário atual
    const currentUser = await prisma.user.findFirst({
      where: { email: "admin@example.com" },
      select: { id: true, email: true },
    })

    if (currentUser) {
      console.log(`Usuário encontrado: ${currentUser.email} (ID: ${currentUser.id})`)
    } else {
      console.log("Usuário admin@example.com não encontrado")
    }

    console.log("Verificação concluída")
  } catch (error) {
    console.error("Erro ao verificar estrutura do banco de dados:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseStructure()
