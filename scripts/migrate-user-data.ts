import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Starting data migration...")

  // Get all users
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users`)

  if (users.length === 0) {
    console.log("No users found. Please create users first.")
    return
  }

  // Get all contacts without userId
  const contacts = await prisma.contact.findMany({
    where: {
      userId: null,
    },
  })
  console.log(`Found ${contacts.length} contacts without userId`)

  // Get all webhooks without userId
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId: null,
    },
  })
  console.log(`Found ${webhooks.length} webhooks without userId`)

  // Assign contacts to the first user (or admin)
  const adminUser = users.find((user) => user.role === "admin") || users[0]
  console.log(`Assigning data to user: ${adminUser.name} (${adminUser.email})`)

  // Update contacts
  if (contacts.length > 0) {
    await prisma.$executeRaw`UPDATE "Contact" SET "userId" = ${adminUser.id} WHERE "userId" IS NULL`
    console.log(`Updated ${contacts.length} contacts`)
  }

  // Update webhooks
  if (webhooks.length > 0) {
    await prisma.$executeRaw`UPDATE "Webhook" SET "userId" = ${adminUser.id} WHERE "userId" IS NULL`
    console.log(`Updated ${webhooks.length} webhooks`)
  }

  console.log("✅ Migration completed successfully!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("Migration failed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
