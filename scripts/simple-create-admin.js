const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash("@wendelAdmin2003", 10)

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@tester.superuser" },
    })

    if (existingUser) {
      // Atualizar usuário existente
      await prisma.user.update({
        where: { email: "admin@tester.superuser" },
        data: {
          role: "admin",
          plan: "business",
        },
      })
      console.log("Usuário admin atualizado com sucesso!")
    } else {
      // Criar novo usuário admin
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
    }
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
