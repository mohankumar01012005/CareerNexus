"use client"

import { useEffect, useState } from "react"
import FileUpload from "./FileUpload"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { updateEmployeeResume } from "../utils/api"

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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [hasCreds, setHasCreds] = useState(false)
  const [linkStatus, setLinkStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lsEmail =
        window.localStorage.getItem("employeeEmail") ||
        window.localStorage.getItem("authEmail") ||
        ""
      const lsPassword =
        window.localStorage.getItem("employeePassword") ||
        window.localStorage.getItem("authPassword") ||
        ""
      if (lsEmail && lsPassword) {
        setEmail(lsEmail)
        setPassword(lsPassword)
        setHasCreds(true)
      }
    }
  }, [])

  const saveCreds = () => {
    if (!email || !password) return
    window.localStorage.setItem("employeeEmail", email)
    window.localStorage.setItem("employeePassword", password)
    setHasCreds(true)
    console.log("[v0] Saved employee credentials to localStorage")
  }

  const handleUploadCompleteInternal = async (result: any) => {
    if (!result?.success || !result.publicUrl) return
    if (!email || !password) return
    try {
      setLinkStatus("saving")
      const resp = await updateEmployeeResume({
        email,
        password,
        resumeLink: result.publicUrl,
      })
      console.log("[v0] updateEmployeeResume response:", resp)
      setLinkStatus("saved")

      // Call external callback if provided
      if (onUploadComplete) {
        await onUploadComplete(result)
      }
    } catch (err) {
      console.error("[v0] Failed to persist resume link:", err)
      setLinkStatus("error")
    }
  }

  if (!hasCreds) {
    return (
      <Card className="max-w-xl">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee-email">Employee Email</Label>
            <Input
              id="employee-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-password">Password</Label>
            <Input
              id="employee-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button onClick={saveCreds} className="w-full">
            Save and Continue
          </Button>
          <p className="text-xs text-foreground/70">
            Your credentials are used to authenticate requests to the employee API (required by the middleware).
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <FileUpload
        authCredentials={{ email, password }}
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
