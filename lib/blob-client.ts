"use client"

export const uploadImageClient = async (file: File, folder: "categories" | "nominees"): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData()
    formData.append("file", file)

    // Upload via API route
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&folder=${folder}`, {
      method: "POST",
      body: file,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Upload failed")
    }

    const result = await response.json()
    return result.url
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Erro ao fazer upload da imagem")
  }
}

export const deleteImageClient = async (url: string): Promise<void> => {
  try {
    const response = await fetch(`/api/delete-image?url=${encodeURIComponent(url)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Delete failed")
    }
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
