"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { uploadFile } from "../lib/supabase"
import { analyzeResumeFile } from "./../lib/gemini"

interface FileUploadProps {
  onUploadComplete?: (result: any) => void
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  acceptedFileTypes = ".pdf,.doc,.docx,.txt",
  maxFileSize = 10,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("[v0] File selected:", { name: file.name, size: file.size, type: file.type })

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setUploadStatus("error")
      setUploadMessage(`File size must be less than ${maxFileSize}MB`)
      console.log("[v0] File too large:", file.size)
      return
    }

    setSelectedFile(file)
    setUploadStatus("idle")
    setUploadMessage("")
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    console.log("[v0] Starting upload for file:", selectedFile.name)
    setIsUploading(true)
    setUploadStatus("idle")
    setUploadMessage("Uploading file...")

    const fileForAI = selectedFile
    ;(async () => {
      try {
        console.log("[v0] ===== STARTING AI ANALYSIS =====")
        console.log("[v0] File details:", {
          name: fileForAI.name,
          size: fileForAI.size,
          type: fileForAI.type,
          lastModified: new Date(fileForAI.lastModified).toISOString(),
        })

        const startTime = Date.now()
        const aiJson = await analyzeResumeFile(fileForAI)
        const endTime = Date.now()

        console.log("[v0] ===== AI ANALYSIS COMPLETED =====")
        console.log("[v0] Analysis duration:", (endTime - startTime) / 1000, "seconds")
        console.log("[v0] Extracted resume data:")
        console.log("[v0] - Name:", aiJson.name)
        console.log("[v0] - Email:", aiJson.email)
        console.log("[v0] - Phone:", aiJson.phone)
        console.log("[v0] - Location:", aiJson.location)
        console.log("[v0] - Experience Years:", aiJson.total_experience_years)
        console.log("[v0] - Current Role:", aiJson.current_role)
        console.log("[v0] - Technical Skills:", aiJson.skills.technical)
        console.log("[v0] - Soft Skills:", aiJson.skills.soft)
        console.log("[v0] - Tools:", aiJson.skills.tools)
        console.log("[v0] - Work Experience Count:", aiJson.work_experience.length)
        console.log("[v0] - Education Count:", aiJson.education.length)
        console.log("[v0] - Certifications Count:", aiJson.certifications.length)
        console.log("[v0] - Projects Count:", aiJson.projects.length)
        console.log("[v0] - Languages:", aiJson.languages)
        console.log("[v0] - LinkedIn:", aiJson.links.linkedin)
        console.log("[v0] - GitHub:", aiJson.links.github)
        console.log("[v0] - Strengths:", aiJson.industry_insights.strengths)
        console.log("[v0] - Weaknesses:", aiJson.industry_insights.weaknesses)
        console.log("[v0] - Role Fit:", aiJson.industry_insights.role_fit)
        console.log("[v0] - Improvement Suggestions:", aiJson.industry_insights.improvement_suggestions)
        console.log("[v0] ===== FULL JSON OBJECT =====")
        console.log("[v0] Complete analysis result:", JSON.stringify(aiJson, null, 2))

        // Store in URL as requested (base64 + URI encoded)
        console.log("[v0] Encoding result for URL storage...")
        const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(aiJson)))))
        const url = new URL(window.location.href)
        url.searchParams.set("resume_ai", encoded)
        window.history.replaceState({}, "", url.toString())
        console.log("[v0] AI analysis result stored in URL parameter 'resume_ai'")
        console.log("[v0] ===== AI INTEGRATION COMPLETE =====")
      } catch (e: any) {
        console.error("[v0] ===== AI ANALYSIS FAILED =====")
        console.error("[v0] Error type:", e?.constructor?.name || "Unknown")
        console.error("[v0] Error message:", e?.message || e)
        console.error("[v0] Full error object:", e)
        if (e?.stack) {
          console.error("[v0] Error stack:", e.stack)
        }
        console.error("[v0] ===== AI ANALYSIS ERROR END =====")
      }
    })()

    try {
      const result = await uploadFile(selectedFile)

      if (result.success) {
        console.log("[v0] Upload successful! Public URL:", result.publicUrl)
        setUploadStatus("success")
        setUploadMessage(`File uploaded successfully! Public URL: ${result.publicUrl}`)

        // Call the callback if provided
        if (onUploadComplete) {
          onUploadComplete(result)
        }

        // Reset file selection
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        console.error("[v0] Upload failed:", result.error)
        setUploadStatus("error")
        setUploadMessage(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadStatus("error")
      setUploadMessage("An unexpected error occurred during upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    if (selectedFile) {
      handleUpload()
    } else {
      fileInputRef.current?.click()
    }
  }

  const getStatusIcon = () => {
    if (isUploading) return <Loader2 className="w-4 h-4 animate-spin" />
    if (uploadStatus === "success") return <CheckCircle className="w-4 h-4 text-green-500" />
    if (uploadStatus === "error") return <AlertCircle className="w-4 h-4 text-red-500" />
    if (selectedFile) return <FileText className="w-4 h-4" />
    return <Upload className="w-4 h-4" />
  }

  const getButtonText = () => {
    if (isUploading) return "Uploading..."
    if (selectedFile) return `Upload ${selectedFile.name}`
    return "Select Resume"
  }

  const getButtonVariant = () => {
    if (uploadStatus === "success") return "outline"
    if (uploadStatus === "error") return "destructive"
    return "default"
  }

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept={acceptedFileTypes} onChange={handleFileSelect} className="hidden" />

      <Button
        onClick={handleButtonClick}
        disabled={isUploading}
        variant={getButtonVariant()}
        className="w-full h-12 justify-start"
      >
        {getStatusIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      {selectedFile && !isUploading && uploadStatus === "idle" && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-foreground-secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadMessage && (
        <Card
          className={`glass-card ${uploadStatus === "success" ? "border-green-500/30" : uploadStatus === "error" ? "border-red-500/30" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {getStatusIcon()}
              <p
                className={`text-sm ${uploadStatus === "success" ? "text-green-600" : uploadStatus === "error" ? "text-red-600" : ""}`}
              >
                {uploadMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FileUpload
