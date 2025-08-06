import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateUserCredits, getUserById } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await request.json()

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valor de recarga inválido" }, { status: 400 })
    }

    const [updatedUser, error] = await updateUserCredits(session.user.id, amount)

    if (error || !updatedUser) {
      console.error("Error updating user credits:", error)
      return NextResponse.json({ error: "Erro ao adicionar créditos" }, { status: 500 })
    }

    // Ensure credits is a number before sending
    const creditsAsNumber = updatedUser.credits ? updatedUser.credits.toNumber() : 0;

    return NextResponse.json({ credits: creditsAsNumber })
  } catch (error) {
    console.error("Error in credits API route:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
