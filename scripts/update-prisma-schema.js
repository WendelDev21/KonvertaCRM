const fs = require("fs")
const path = require("path")

// Caminho para o arquivo schema.prisma
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma")

async function updatePrismaSchema() {
  try {
    // Ler o conteúdo atual do schema
    const schemaContent = fs.readFileSync(schemaPath, "utf8")

    // Verificar se o campo plan já existe
    if (schemaContent.includes("plan                String")) {
      console.log("O campo plan já existe no schema do Prisma.")
      return true
    }

    // Adicionar o campo plan ao modelo User
    const userModelRegex = /(model User {[\s\S]*?)(\n})/
    const planField = '  plan                String    @default("starter")  // Plano do usuário\n'

    // Encontrar onde inserir o campo (antes do último })
    const updatedSchema = schemaContent.replace(userModelRegex, (match, userModel, closing) => {
      // Verificar se o campo já existe
      if (userModel.includes("plan ")) {
        return match
      }

      // Encontrar a última linha do modelo
      const lines = userModel.split("\n")
      const lastLine = lines[lines.length - 1]

      // Inserir o campo plan antes da última linha
      return userModel + planField + closing
    })

    // Salvar o schema atualizado
    fs.writeFileSync(schemaPath, updatedSchema)
    console.log("Schema do Prisma atualizado com sucesso!")

    return true
  } catch (error) {
    console.error("Erro ao atualizar o schema do Prisma:", error)
    return false
  }
}

// Executar a função
updatePrismaSchema().then((success) => {
  if (success) {
    console.log("Agora execute: npx prisma migrate dev --name add_user_plan")
  } else {
    console.log("Falha ao atualizar o schema. Verifique o erro acima.")
  }
})
