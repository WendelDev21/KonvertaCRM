const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Verificar se o usuário admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@tester.superuser" },
    })

    if (existingAdmin) {
      console.log("Usuário admin já existe. Atualizando para role admin e plano business...")

      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          role: "admin",
          plan: "business",
        },
      })

      console.log("Usuário admin atualizado com sucesso!")
      return
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash("@wendelAdmin2003", 10)

    // Criar o usuário admin
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@tester.superuser",
        password: hashedPassword,
        role: "admin",
        plan: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log("Usuário admin criado com sucesso!")
  } catch (error) {
    console.error("Erro ao criar usuário admin:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
