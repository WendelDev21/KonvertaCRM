import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Initializing database...")

  try {
    // Test database connection
    await prisma.$connect()
    console.log("✅ Database connection successful")

    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    })

    if (!adminExists) {
      // Create admin user
      const hashedPassword = await hash("admin123", 10)
      await prisma.user.create({
        data: {
          name: "Admin",
          email: "admin@example.com",
          password: hashedPassword,
          role: "admin",
        },
      })
      console.log("✅ Admin user created")
    } else {
      console.log("ℹ️ Admin user already exists")
    }

    console.log("✅ Database initialization complete")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
