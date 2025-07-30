import { type NextRequest, NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = params.path.join("/")
    const fullPath = join(process.cwd(), "public", "uploads", "media", filePath)

    // Verificar se o arquivo existe
    try {
      await stat(fullPath)
    } catch {
      return new NextResponse("File not found", { status: 404 })
    }

    // Ler o arquivo
    const fileBuffer = await readFile(fullPath)

    // Determinar o tipo de conteúdo baseado na extensão
    const extension = filePath.toLowerCase().split(".").pop()
    const contentTypes: { [key: string]: string } = {
      // Imagens
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      // Documentos
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      csv: "text/csv",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      // Áudio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      // Vídeo
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      wmv: "video/x-ms-wmv",
      flv: "video/x-flv",
      webm: "video/webm",
      mkv: "video/x-matroska",
    }

    const contentType = contentTypes[extension || ""] || "application/octet-stream"

    // Retornar o arquivo com headers apropriados
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache por 1 ano
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Error serving media file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function HEAD(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = params.path.join("/")
    const fullPath = join(process.cwd(), "public", "uploads", "media", filePath)

    // Verificar se o arquivo existe e obter informações
    const fileStats = await stat(fullPath)

    // Determinar o tipo de conteúdo baseado na extensão
    const extension = filePath.toLowerCase().split(".").pop()
    const contentTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      pdf: "application/pdf",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    }

    const contentType = contentTypes[extension || ""] || "application/octet-stream"

    return new NextResponse(null, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return new NextResponse("File not found", { status: 404 })
  }
}
