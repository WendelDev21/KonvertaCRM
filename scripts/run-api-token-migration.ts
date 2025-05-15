import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import { join } from "path"

async function runMigration() {
  const prisma = new PrismaClient()

  try {
    console.log("Executando migração para adicionar tabela ApiToken...")

    // Ler o arquivo SQL
    const sqlPath = join(process.cwd(), "prisma", "migrations", "add_api_token_table.sql")
    const sql = readFileSync(sqlPath, "utf8")

    // Executar o SQL
    await prisma.$executeRawUnsafe(sql)

    console.log("Migração concluída com sucesso!")
  } catch (error) {
    console.error("Erro ao executar migração:", error)
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
