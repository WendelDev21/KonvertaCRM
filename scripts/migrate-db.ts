import { execSync } from "child_process"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"

async function main() {
  console.log("🔄 Starting database migration...")

  try {
    // Ensure prisma directory exists
    const prismaDir = join(process.cwd(), "prisma")
    if (!existsSync(prismaDir)) {
      console.log("Creating prisma directory...")
      mkdirSync(prismaDir, { recursive: true })
    }

    // Generate Prisma client
    console.log("Generating Prisma client...")
    execSync("npx prisma generate", { stdio: "inherit" })

    // Run migrations
    console.log("Running database migrations...")
    execSync("npx prisma migrate dev --name init", { stdio: "inherit" })

    console.log("✅ Database migration completed successfully!")
  } catch (error) {
    console.error("❌ Database migration failed:", error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
