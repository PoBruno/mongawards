import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")
    const folder = searchParams.get("folder")

    if (!filename || !folder) {
      return NextResponse.json({ error: "Filename and folder are required" }, { status: 400 })
    }

    if (!["categories", "nominees"].includes(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
    }

    // Get the file from the request
    const file = request.body
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = filename.split(".").pop()
    const uniqueFilename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
