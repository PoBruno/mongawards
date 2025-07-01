import { put, del } from "@vercel/blob"

export const uploadImage = async (file: File, folder: "categories" | "nominees"): Promise<string> => {
  try {
    // Use the token from environment variables
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      throw new Error("Token de acesso ao Blob não configurado")
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    const blob = await put(filename, file, {
      access: "public",
      token: token,
    })

    return blob.url
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Erro ao fazer upload da imagem")
  }
}

export const deleteImage = async (url: string): Promise<void> => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      console.warn("Token de acesso ao Blob não configurado para deletar imagem")
      return
    }

    await del(url, { token: token })
  } catch (error) {
    console.error("Error deleting image:", error)
    // Don't throw error for deletion failures
  }
}

export const validateImageFile = (file: File): string | null => {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return "Apenas arquivos JPG, PNG e WebP são permitidos"
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return "A imagem deve ter no máximo 5MB"
  }

  return null
}
