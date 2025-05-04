import { prisma, dbAction } from "../db-client"
import { hash, compare } from "bcryptjs"

export type UserRole = "user" | "admin"

export type UserInput = {
  name: string
  email: string
  password: string
  role?: UserRole
  bio?: string
  theme?: string
  image?: string
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
        bio: data.bio,
        theme: data.theme,
        image: data.image,
        notificationSettings: data.notificationSettings ? JSON.stringify(data.notificationSettings) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        theme: true,
        image: true,
        createdAt: true,
      },
    })
  })
}

export async function getUserByEmail(email: string) {
  return dbAction(() =>
    prisma.user.findUnique({
      where: { email },
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
        bio: true,
        theme: true,
        image: true,
        notificationSettings: true,
        createdAt: true,
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
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.theme !== undefined) updateData.theme = data.theme
    if (data.image !== undefined) updateData.image = data.image
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
        bio: true,
        theme: true,
        image: true,
        notificationSettings: true,
        updatedAt: true,
      },
    })
  })
}
