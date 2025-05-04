import { PrismaClient } from "@prisma/client"
import { exec } from "child_process"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Setting up database...")

  // Check if prisma directory exists
  const prismaDir = path.join(process.cwd(), "prisma")
  if (!fs.existsSync(prismaDir)) {
    console.log("Creating prisma directory...")
    fs.mkdirSync(prismaDir, { recursive: true })
  }

  // Run prisma generate
  console.log("Generating Prisma client...")
  await new Promise((resolve, reject) => {
    exec("npx prisma generate", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error generating Prisma client: ${error.message}`)
        return reject(error)
      }
      console.log(stdout)
      resolve(stdout)
    })
  })

  // Test database connection
  try {
    console.log("Testing database connection...")
    await prisma.$connect()
    console.log("✅ Database connection successful!")

    // Check if tables exist by querying for contacts
    const contactCount = await prisma.contact.count()
    console.log(`Found ${contactCount} contacts in the database.`)
  } catch (error) {
    console.error("❌ Database connection failed:", error)

    // Try to create the database
    console.log("Attempting to create database schema...")
    await new Promise((resolve, reject) => {
      exec("npx prisma db push", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error creating database schema: ${error.message}`)
          return reject(error)
        }
        console.log(stdout)
        resolve(stdout)
      })
    })
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => console.log("Setup complete!"))
  .catch((e) => {
    console.error("Setup failed:", e)
    process.exit(1)
  })
