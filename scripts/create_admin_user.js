const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Iniciando criação do usuário administrador...")

  const adminData = {
    name: "Super User",
    email: "admin@super.user",
    password: "@wendelAdmin2003",
    role: "admin"
  }

  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (existingUser) {
      console.log("⚠️ Um usuário com este email já existe!")
      
      // Atualizar para garantir que seja admin e esteja ativo
      const updatedUser = await prisma.user.update({
        where: { email: adminData.email },
        data: {
          role: "admin",
          isActive: true,
          // Não atualizamos a senha aqui para não sobrescrever uma senha existente
        }
      })
      
      console.log("✅ Usuário existente atualizado para admin:", updatedUser.name)
      return
    }

    // Criar novo usuário admin
    const hashedPassword = await hash(adminData.password, 10)
    
    const newUser = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role,
        isActive: true
      }
    })

    // Remover a senha do objeto de retorno por segurança
    const { password, ...userWithoutPassword } = newUser
    
    console.log("✅ Usuário administrador criado com sucesso:")
    console.log(userWithoutPassword)
    
  } catch (error) {
    console.error("❌ Erro ao criar usuário administrador:", error)
  }
}

main()
  .then(async () => {
    console.log("Operação concluída!")
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("Erro fatal:", e)
    await prisma.$disconnect()
    process.exit(1)
  })