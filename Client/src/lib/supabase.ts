import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://puqxvdbbqcndawvxkzzg.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cXh2ZGJicWNuZGF3dnhrenpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODg5OTgsImV4cCI6MjA3NDI2NDk5OH0.8FuQzrHSpDnYXEZiMTp8ZkOd3bku2eOYX0Uzepb-anw"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// File upload function
export const uploadFile = async (file: File, bucket = "public-uploads") => {
  console.log("[v0] Starting file upload process...", { fileName: file.name, fileSize: file.size, bucket })

  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `resume_${timestamp}.${fileExtension}`

    console.log("[v0] Generated filename:", fileName)

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Upload error:", error)
      throw error
    }

    console.log("[v0] File uploaded successfully:", data)

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName)

    console.log("[v0] Public URL generated:", publicUrlData.publicUrl)

    return {
      success: true,
      fileName,
      publicUrl: publicUrlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error("[v0] File upload failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
