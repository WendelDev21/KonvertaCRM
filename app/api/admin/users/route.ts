import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { apiAuthMiddleware } from "@/middleware/api-auth"

// GET /api/admin/users - Lista todos os usuários (apenas admin)
export async function GET(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
      }

      // Obter query params
      const searchParams = request.nextUrl.searchParams
      const includeInactive = searchParams.get("includeInactive") === "true"
      const query = searchParams.get("q")

      // Construir filtro
      const filter: any = {}

      // Apenas incluir usuários ativos se o parâmetro não for true
      if (!includeInactive) {
        filter.isActive = true
      }

      // Adicionar filtro de busca se fornecido
      if (query) {
        filter.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ]
      }

      const users = await prisma.user.findMany({
        where: filter,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          // Exclude password
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json(users)
    } catch (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
    }
  })
}

// POST /api/admin/users - Cria um novo usuário (apenas admin)
export async function POST(request: NextRequest) {
  return apiAuthMiddleware(request, async (req, userId) => {
    try {
      // Verificar se o usuário é admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
      }

      const body = await req.json()

      // Validate data
      if (!body.name || !body.email || !body.password) {
        return NextResponse.json({ error: "Dados incompletos. Nome, email e senha são obrigatórios." }, { status: 400 })
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email: body.email,
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email já está em uso." }, { status: 400 })
      }

      // Create user
      const hashedPassword = await hash(body.password, 10)
      const newUser = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role: body.role || "user", // Default to "user" if not specified
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          // Exclude password
        },
      })

      return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }
  })
}
