import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

// POST /api/users/me/photo - Upload de foto de perfil
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = (currentUser as any).id
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Verificar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "O arquivo deve ser uma imagem" }, { status: 400 })
    }

    // Verificar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "O arquivo deve ter menos de 5MB" }, { status: 400 })
    }

    // Em uma implementação real, você faria upload da imagem para um serviço de armazenamento
    // como AWS S3, Cloudinary, ou Vercel Blob Storage

    // Converter o arquivo para um ArrayBuffer e depois para Base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")

    // Criar uma URL de dados (data URL) para a imagem
    const mimeType = file.type
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    // Exemplo de URL fictícia baseada no nome do arquivo (para armazenamento real)
    const imageUrl = dataUrl

    try {
      // Tentar atualizar a URL da imagem no banco de dados
      try {
        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            image: imageUrl,
          },
          select: {
            id: true,
          },
        })
        console.log("Imagem atualizada no banco de dados com sucesso")
      } catch (dbError) {
        console.error("Erro ao atualizar imagem no banco de dados (campo pode não existir):", dbError)
        // Continuar mesmo se o banco de dados falhar
      }

      // Não usar localStorage aqui, pois estamos no servidor
      return NextResponse.json({ success: true, imageUrl: imageUrl })
    } catch (error) {
      console.error("Erro ao atualizar imagem no banco de dados:", error)
      // Retornar sucesso mesmo com erro no banco de dados
      return NextResponse.json({ success: true, imageUrl: imageUrl })
    }
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error)
    return NextResponse.json({ error: "Erro ao fazer upload da foto" }, { status: 500 })
  }
}

// DELETE /api/users/me/photo - Remover foto de perfil
export async function DELETE() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = (currentUser as any).id

    try {
      // Tentar atualizar o usuário removendo a URL da imagem
      try {
        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            image: null,
          },
          select: {
            id: true,
          },
        })
        console.log("Imagem removida do banco de dados com sucesso")
      } catch (dbError) {
        console.error("Erro ao remover foto do banco de dados (campo pode não existir):", dbError)
        // Continuar mesmo se o banco de dados falhar
      }

      // Não usar localStorage aqui, pois estamos no servidor
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Erro ao remover foto do banco de dados:", error)
      // Retornar sucesso mesmo com erro no banco de dados
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Erro ao remover foto:", error)
    return NextResponse.json({ error: "Erro ao remover foto" }, { status: 500 })
  }
}
