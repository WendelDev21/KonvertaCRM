import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Verificar tipo de arquivo
    const allowedTypes = [
      // Imagens
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      // Documentos
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      // Áudio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/aac",
      // Vídeo
      "video/mp4",
      "video/x-msvideo",
      "video/quicktime",
      "video/x-ms-wmv",
      "video/x-flv",
      "video/webm",
      "video/x-matroska",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }

    // Verificar tamanho do arquivo (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 100MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), "public", "uploads", "media")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}-${sanitizedName}`
    const filePath = join(uploadDir, fileName)

    // Salvar arquivo
    await writeFile(filePath, buffer)

    // Retornar URL do arquivo
    const fileUrl = `/uploads/media/${fileName}`

    // Determinar tipo de mídia
    let mediaType = "document"
    if (file.type.startsWith("image/")) {
      mediaType = "image"
    } else if (file.type.startsWith("video/")) {
      mediaType = "video"
    } else if (file.type.startsWith("audio/")) {
      mediaType = "audio"
    }

    console.log(
      `[Upload] File uploaded: ${fileName}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${mediaType}`,
    )

    return NextResponse.json({
      url: fileUrl,
      fileName: file.name,
      mediaType,
      size: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 })
  }
}
