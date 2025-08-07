// Rotas para gerenciamento de usuários (admin)
import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
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

      // Obter parâmetros de consulta
      const url = new URL(req.url)
      const searchQuery = url.searchParams.get("q") || ""
      const includeInactive = url.searchParams.get("includeInactive") === "true"

      // Construir filtro de busca
      const whereClause: any = {}

      if (searchQuery) {
        whereClause.OR = [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery, mode: "insensitive" } },
        ]
      }

      if (!includeInactive) {
        whereClause.isActive = true
      }

      // Buscar usuários
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          credits: true, // Adicionado: Incluir o campo de créditos
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

// POST /api/admin/users - Cria um ou múltiplos usuários (apenas admin)
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
      console.log("Dados recebidos para criação de usuário(s):", body)

      // Detectar se é operação em lote ou individual
      const isBatch = Array.isArray(body)
      const users = isBatch ? body : [body]

      const results = []
      const errors = []

      for (let i = 0; i < users.length; i++) {
        const userData = users[i]

        try {
          // Validate data
          if (!userData.name || !userData.email || !userData.password) {
            const error = `Item ${i + 1}: Dados incompletos. Nome, email e senha são obrigatórios.`
            errors.push({ index: i, error })
            continue
          }

          // Check if email already exists
          const existingUser = await prisma.user.findUnique({
            where: {
              email: userData.email,
            },
          })

          if (existingUser) {
            const error = `Item ${i + 1}: Email já está em uso.`
            errors.push({ index: i, error })
            continue
          }

          // Create user
          const hashedPassword = await hash(userData.password, 10)

          // Garantir que o plano seja definido corretamente
          const plan = userData.plan || "Starter"
          console.log(`Criando usuário com plano: ${plan}`)

          const newUser = await prisma.user.create({
            data: {
              name: userData.name,
              email: userData.email,
              password: hashedPassword,
              role: userData.role || "user", // Default to "user" if not specified
              plan: plan, // Usar o plano fornecido ou "Starter" como padrão
              isActive: true,
              credits: userData.credits || 0, // Adicionado: Definir créditos iniciais
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              plan: true, // Garantir que o plano seja retornado
              createdAt: true,
              updatedAt: true,
              isActive: true,
              credits: true, // Adicionado: Incluir o campo de créditos
              // Exclude password
            },
          })

          console.log("Novo usuário criado:", newUser)
          results.push(newUser)
        } catch (error) {
          console.error(`Erro ao criar usuário ${i + 1}:`, error)
          errors.push({ index: i, error: "Erro ao criar usuário" })
        }
      }

      // Retornar resultado apropriado
      if (isBatch) {
        return NextResponse.json(
          {
            success: results.length > 0,
            created: results.length,
            total: users.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
          },
          { status: results.length > 0 ? 201 : 400 },
        )
      } else {
        if (results.length > 0) {
          return NextResponse.json(results[0], { status: 201 })
        } else {
          return NextResponse.json({ error: errors[0]?.error || "Erro ao criar usuário" }, { status: 400 })
        }
      }
    } catch (error) {
      console.error("Error creating user(s):", error)
      return NextResponse.json({ error: "Erro ao criar usuário(s)" }, { status: 500 })
    }
  })
}
