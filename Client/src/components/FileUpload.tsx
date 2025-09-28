"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { uploadFile } from "../lib/supabase"

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
