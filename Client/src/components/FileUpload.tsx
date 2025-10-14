"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { uploadFile } from "../lib/supabase"
import { analyzeResumeFile, analyzeResumeFromUrl } from "./../lib/gemini"
import { updateEmployeeResumeData } from "../utils/api"

interface FileUploadProps {
  onUploadComplete?: (result: any) => void
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
  authCredentials?: { email: string; password: string } // optional, used to persist parsed data
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  acceptedFileTypes = ".pdf,.doc,.docx,.txt",
  maxFileSize = 10,
  authCredentials,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [aiProcessing, setAiProcessing] = useState(false)
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

  const handleAiAnalysisAndDataUpdate = async (
    file: File,
    credentials: { email: string; password: string },
    sourcePublicUrl?: string,
  ) => {
    try {
      console.log("[v0] ===== STARTING AI ANALYSIS =====")
      console.log("[v0] File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      })

      const startTime = Date.now()

      let aiJson
      try {
        aiJson = await analyzeResumeFile(file)
      } catch (fileErr) {
        console.warn("[v0] File-based analysis failed, attempting URL-based analysis:", fileErr)
        if (!sourcePublicUrl) {
          throw fileErr
        }
        aiJson = await analyzeResumeFromUrl(sourcePublicUrl, file.type || undefined, { retries: 4, delayMs: 600 })
      }

      const endTime = Date.now()
      console.log("[v0] ===== AI ANALYSIS COMPLETED =====")
      console.log("[v0] Analysis duration:", (endTime - startTime) / 1000, "seconds")
      console.log("[v0] Extracted resume data:")
      console.log("[v0] - Name:", aiJson.name)
      console.log("[v0] - Email:", aiJson.email)
      console.log("[v0] - Technical Skills:", aiJson.skills.technical)

      // Store in URL as requested (base64 + URI encoded)
      console.log("[v0] Encoding result for URL storage...")
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(aiJson)))))
      const url = new URL(window.location.href)
      url.searchParams.set("resume_ai", encoded)
      window.history.replaceState({}, "", url.toString())
      console.log("[v0] AI analysis result stored in URL parameter 'resume_ai'")

      // Update resume data in backend
      console.log("[v0] Updating resume data in backend...")
      const result = await updateEmployeeResumeData({
        email: credentials.email,
        password: credentials.password,
        resumeData: aiJson,
      })

      console.log("[v0] Resume data update response:", result)

      if (result.success) {
        console.log("[v0] Resume data successfully updated in backend")
      } else {
        console.error("[v0] Failed to update resume data:", result.message)
        throw new Error(result.message || "Failed to update resume data")
      }

      console.log("[v0] ===== AI INTEGRATION COMPLETE =====")
      return aiJson
    } catch (error) {
      console.error("[v0] ===== AI ANALYSIS FAILED =====")
      console.error("[v0] Error:", error)
      throw error
    }
  }

  const getCredentials = (): { email: string; password: string } | null => {
    // Priority: props -> localStorage -> null
    if (authCredentials?.email && authCredentials?.password) {
      return authCredentials
    }

    if (typeof window !== "undefined") {
      const email = window.localStorage.getItem("employeeEmail") || window.localStorage.getItem("authEmail")
      const password = window.localStorage.getItem("employeePassword") || window.localStorage.getItem("authPassword")

      if (email && password) {
        console.log("[v0] Using credentials from localStorage")
        return { email, password }
      }
    }

    console.warn("[v0] No credentials available for resume data update")
    return null
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    console.log("[v0] Starting upload for file:", selectedFile.name)
    setIsUploading(true)
    setAiProcessing(false)
    setUploadStatus("idle")
    setUploadMessage("Uploading file...")

    const credentials = getCredentials()
    if (!credentials) {
      setUploadStatus("error")
      setUploadMessage("Authentication credentials not available")
      setIsUploading(false)
      return
    }

    try {
      // Step 1: Upload file to storage (bucket now defaults to SkillCompass)
      const uploadResult = await uploadFile(selectedFile)

      if (!uploadResult.success) {
        console.error("[v0] Upload failed:", uploadResult.error)
        setUploadStatus("error")
        setUploadMessage(`Upload failed: ${uploadResult.error}`)
        return
      }

      console.log("[v0] Upload successful! Public URL:", uploadResult.publicUrl)
      setUploadStatus("success")
      setUploadMessage("File uploaded successfully! Processing resume data...")

      // Step 2: Process AI analysis and update resume data
      setAiProcessing(true)
      try {
        await handleAiAnalysisAndDataUpdate(selectedFile, credentials, uploadResult.publicUrl)
        setUploadMessage("File uploaded and resume data processed successfully!")
      } catch (aiError) {
        console.error("[v0] AI processing failed, but file was uploaded:", aiError)
        setUploadMessage("File uploaded, but resume analysis failed. You can retry analysis later.")
      }

      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(uploadResult)
      }

      // Reset file selection
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadStatus("error")
      setUploadMessage("An unexpected error occurred during upload")
    } finally {
      setIsUploading(false)
      setAiProcessing(false)
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
    if (isUploading || aiProcessing) return <Loader2 className="w-4 h-4 animate-spin" />
    if (uploadStatus === "success") return <CheckCircle className="w-4 h-4 text-green-500" />
    if (uploadStatus === "error") return <AlertCircle className="w-4 h-4 text-red-500" />
    if (selectedFile) return <FileText className="w-4 h-4" />
    return <Upload className="w-4 h-4" />
  }

  const getButtonText = () => {
    if (aiProcessing) return "Processing Resume..."
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
        disabled={isUploading || aiProcessing}
        variant={getButtonVariant()}
        className="w-full h-12 justify-start"
      >
        {getStatusIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      {selectedFile && !isUploading && !aiProcessing && uploadStatus === "idle" && (
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
                {aiProcessing && " (This may take a few seconds)"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FileUpload
