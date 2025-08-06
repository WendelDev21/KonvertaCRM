import { prisma, dbAction } from "../db-client"
import { hash, compare } from "bcryptjs"

export type UserRole = "user" | "admin"

export type UserInput = {
  name: string
  email: string
  password: string
  role?: UserRole
  plan?: string
  theme?: string
  notificationSettings?: any
}

export async function createUser(data: UserInput) {
  return dbAction(async () => {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error("Email already in use")
    }

    const hashedPassword = await hash(data.password, 10)

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "user",
        plan: data.plan || "Starter",
        theme: data.theme,
        notificationSettings: data.notificationSettings ? JSON.stringify(data.notificationSettings) : null,
        credits: 0.00, // Initialize credits for new users
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        theme: true,
        createdAt: true,
      },
    })
  })
}

export async function getUserByEmail(email: string) {
  return dbAction(() =>
    prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        plan: true,
        theme: true,
        isActive: true,
        notificationSettings: true,
        createdAt: true,
        credits: true, // Include credits
      },
    }),
  )
}

export async function getUserById(id: string) {
  return dbAction(() =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        theme: true,
        notificationSettings: true,
        createdAt: true,
        credits: true, // Include credits
      },
    }),
  )
}

export async function validateUserCredentials(email: string, password: string) {
  const [user, error] = await getUserByEmail(email)

  if (error || !user) {
    return [null, error || new Error("User not found")]
  }

  try {
    const isValid = await compare(password, user.password)
    if (!isValid) {
      return [null, new Error("Invalid password")]
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return [userWithoutPassword, null]
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

export async function updateUser(id: string, data: Partial<Omit<UserInput, "password">> & { password?: string }) {
  return dbAction(async () => {
    const updateData: any = {}

    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.plan) updateData.plan = data.plan
    if (data.theme !== undefined) updateData.theme = data.theme
    if (data.notificationSettings !== undefined) {
      updateData.notificationSettings =
        typeof data.notificationSettings === "string"
          ? data.notificationSettings
          : JSON.stringify(data.notificationSettings)
    }

    if (data.password) {
      updateData.password = await hash(data.password, 10)
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        theme: true,
        notificationSettings: true,
        updatedAt: true,
        credits: true, // Include credits
      },
    })
  })
}

export async function updateUserCredits(userId: string, amount: number) {
  return dbAction(async () => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
      select: {
        id: true,
        email: true,
        credits: true,
      },
    })
  })
}

export async function deductUserCredits(userId: string, amount: number) {
  return dbAction(async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits.toNumber() < amount) {
      throw new Error("Insufficient credits");
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
      select: {
        id: true,
        email: true,
        credits: true,
      },
    });
  });
}
