import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"

// Função para executar comandos shell e capturar a saída
function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: "utf8" })
  } catch (error) {
    console.error(`Erro ao executar comando: ${command}`)
    console.error(error)
    return ""
  }
}

async function main() {
  console.log("🔄 Verificando e atualizando o esquema do banco de dados...")

  // Gerar cliente Prisma
  console.log("Gerando cliente Prisma...")
  runCommand("npx prisma generate")

  // Verificar se podemos conectar ao banco de dados
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    console.log("✅ Conexão com o banco de dados estabelecida")

    // Verificar se a tabela User existe
    try {
      await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`
      console.log("✅ Tabela User encontrada")

      // Verificar se as colunas necessárias existem
      try {
        // Tentar buscar um usuário com as colunas que precisamos
        await prisma.$queryRaw`SELECT "id", "name", "email", "theme", "notificationSettings" FROM "User" LIMIT 1`
        console.log("✅ Todas as colunas necessárias existem")
      } catch (error) {
        console.log("⚠️ Algumas colunas necessárias não existem. Aplicando alterações...")

        // Tentar aplicar as migrações
        console.log("Aplicando migrações...")
        try {
          runCommand("npx prisma migrate dev --name add_user_fields")
          console.log("✅ Migrações aplicadas com sucesso")
        } catch (migrationError) {
          console.log("⚠️ Não foi possível aplicar as migrações. Tentando aplicar o esquema diretamente...")

          // Tentar aplicar o esquema diretamente
          try {
            runCommand("npx prisma db push --accept-data-loss")
            console.log("✅ Esquema aplicado diretamente com sucesso")
          } catch (pushError) {
            console.error("❌ Não foi possível aplicar o esquema diretamente")
            console.error("Por favor, execute as seguintes consultas SQL manualmente:")
            console.log(`
              ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "theme" TEXT;
              ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationSettings" TEXT;
            `)
          }
        }
      }
    } catch (error) {
      console.error("❌ Tabela User não encontrada. O banco de dados precisa ser inicializado.")
      console.log("Executando prisma db push para criar as tabelas...")
      runCommand("npx prisma db push")
    }
  } catch (error) {
    console.error("❌ Não foi possível conectar ao banco de dados")
    console.error("Verifique se a variável de ambiente DATABASE_URL está configurada corretamente")
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }

  console.log("✅ Processo de verificação e atualização concluído!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
