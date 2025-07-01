"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon } from "lucide-react"
import { uploadImageClient, validateImageFile, deleteImageClient } from "@/lib/blob-client"
import Image from "next/image"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (url: string | null) => void
  folder: "categories" | "nominees"
  label: string
  aspectRatio?: "banner" | "square"
}

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  folder,
  label,
  aspectRatio = "square",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      return
    }

    setIsUploading(true)

    try {
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Upload to Blob via API route
      const imageUrl = await uploadImageClient(file, folder)

      // Clean up preview
      URL.revokeObjectURL(preview)

      // Update with final URL
      setPreviewUrl(imageUrl)
      onImageChange(imageUrl)

      alert("Imagem enviada com sucesso!")
    } catch (error) {
      console.error("Upload error:", error)
      alert("Erro ao enviar imagem. Tente novamente.")

      // Reset preview on error
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = async () => {
    if (!previewUrl) return

    try {
      // Delete from Blob if it's not a blob URL (preview)
      if (!previewUrl.startsWith("blob:") && currentImageUrl) {
        await deleteImageClient(currentImageUrl)
      }

      setPreviewUrl(null)
      onImageChange(null)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error removing image:", error)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <Label className="text-slate-300">{label}</Label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Preview or Upload Area */}
      <div
        className={`relative border-2 border-dashed border-slate-600 rounded-lg overflow-hidden ${
          aspectRatio === "banner" ? "aspect-[3/1]" : "aspect-square"
        }`}
      >
        {previewUrl ? (
          <>
            <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
            {/* Remove button */}
            <Button
              type="button"
              onClick={handleRemoveImage}
              size="sm"
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white"
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
            {/* Upload overlay when uploading */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-8 h-8 spinner mx-auto mb-2"></div>
                  <p className="text-sm">Enviando...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700/50 transition-colors"
            onClick={triggerFileSelect}
          >
            <ImageIcon className="h-12 w-12 text-slate-400 mb-2" />
            <p className="text-slate-400 text-sm text-center px-4">Clique para selecionar uma imagem</p>
            <p className="text-slate-500 text-xs mt-1">JPG, PNG ou WebP (máx. 5MB)</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex gap-2">
        <Button type="button" onClick={triggerFileSelect} disabled={isUploading} className="btn-secondary flex-1">
          <Upload className="h-4 w-4 mr-2" />
          {previewUrl ? "Trocar Imagem" : "Selecionar Imagem"}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="btn-secondary text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {aspectRatio === "banner"
          ? "Recomendado: 1200x400px para melhor qualidade"
          : "Recomendado: imagem quadrada (ex: 400x400px)"}
      </p>
    </div>
  )
}
