const { execSync } = require("child_process")

try {
  console.log("Aplicando migração do Prisma...")
  execSync("npx prisma migrate dev --name add_user_plan", { stdio: "inherit" })
  console.log("Migração aplicada com sucesso!")
} catch (error) {
  console.error("Erro ao aplicar migração:", error.message)
}
