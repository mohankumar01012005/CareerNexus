"use client"

import { useEffect, useState } from "react"
import FileUpload from "./FileUpload"
import { Card, CardContent } from "./ui/card"
import { updateEmployeeResume } from "../utils/api"
import { useAuth } from "../contexts/AuthContext"

interface EmployeeUploadProps {
  onUploadComplete?: (result: any) => void
  acceptedFileTypes?: string
  maxFileSize?: number
}

export default function EmployeeUpload({
  onUploadComplete,
  acceptedFileTypes,
  maxFileSize,
}: EmployeeUploadProps) {
  const { credentials } = useAuth()
  const [linkStatus, setLinkStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Use credentials from AuthContext / localStorage
  const [authCredentials, setAuthCredentials] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    if (credentials) {
      setAuthCredentials(credentials)
    } else if (typeof window !== "undefined") {
      const email = window.localStorage.getItem("employeeEmail") || ""
      const password = window.localStorage.getItem("employeePassword") || ""
      if (email && password) {
        setAuthCredentials({ email, password })
      }
    }
  }, [credentials])

  const handleUploadCompleteInternal = async (result: any) => {
    if (!result?.success || !result.publicUrl) {
      console.error("[v0] Upload completed but no public URL available")
      return
    }
    
    if (!authCredentials?.email || !authCredentials?.password) {
      console.error("[v0] No credentials available for resume link update")
      return
    }
    
    try {
      setLinkStatus("saving")
      console.log("[v0] Updating resume link in backend...")
      
      const resp = await updateEmployeeResume({
        email: authCredentials.email,
        password: authCredentials.password,
        resumeLink: result.publicUrl,
      })
      
      console.log("[v0] updateEmployeeResume response:", resp)
      
      if (resp.success) {
        setLinkStatus("saved")
        console.log("[v0] Resume link successfully updated")
      } else {
        throw new Error(resp.message || "Failed to update resume link")
      }

      if (onUploadComplete) {
        await onUploadComplete(result)
      }
    } catch (err) {
      console.error("[v0] Failed to persist resume link:", err)
      setLinkStatus("error")
    }
  }

  if (!authCredentials) {
    return (
      <Card className="max-w-xl">
        <CardContent className="p-4 text-center">
          <p className="text-foreground-secondary">Loading authentication credentials…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <FileUpload
        authCredentials={authCredentials}
        onUploadComplete={handleUploadCompleteInternal}
        acceptedFileTypes={acceptedFileTypes}
        maxFileSize={maxFileSize}
      />
      {linkStatus === "saving" && <p className="text-xs text-foreground/70">Saving resume link…</p>}
      {linkStatus === "saved" && <p className="text-xs text-green-600">Resume link saved.</p>}
      {linkStatus === "error" && <p className="text-xs text-red-600">Failed to save resume link.</p>}
    </div>
  )
}