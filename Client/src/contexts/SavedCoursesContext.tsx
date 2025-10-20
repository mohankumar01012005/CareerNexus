"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../hooks/use-toast"
import { 
  saveCourseApi, 
  getSavedCoursesApi, 
  completeCourseApi, 
  deleteCourseApi,
  uploadCertificate 
} from "../utils/api"

interface SavedCourse {
  id: string
  title: string
  provider: string
  duration: string
  costType: "Free" | "Paid"
  skillsCovered: string[]
  enrollLink: string
  rating?: number
  level?: "Beginner" | "Intermediate" | "Advanced"
  certificate?: boolean
  description?: string
  status: "active" | "pending_review" | "completed"
  savedAt: string
  completedAt?: string
  completionProof?: {
    file?: string
    link?: string
  }
  resubmissionCount?: number
  reviewNotes?: string
}

interface SavedCoursesContextType {
  savedCourses: SavedCourse[]
  saveCourse: (course: Omit<SavedCourse, "id" | "status" | "savedAt" | "resubmissionCount" | "reviewNotes">) => Promise<boolean>
  markAsCompleted: (courseId: string, proof: { file?: string; link?: string }) => void
  deleteCourse: (courseId: string) => void
  canSaveMore: boolean
  savedCount: number
  isLoading: boolean
  refreshSavedCourses: () => void
  uploadCertificate: (file: File, bucket?: string) => Promise<{ success: boolean; fileName?: string; publicUrl?: string; path?: string; error?: string }>
}

const SavedCoursesContext = createContext<SavedCoursesContextType | undefined>(undefined)

export const useSavedCourses = () => {
  const context = useContext(SavedCoursesContext)
  if (!context) {
    throw new Error("useSavedCourses must be used within a SavedCoursesProvider")
  }
  return context
}

interface SavedCoursesProviderProps {
  children: React.ReactNode
}

export const SavedCoursesProvider: React.FC<SavedCoursesProviderProps> = ({ children }) => {
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { credentials } = useAuth()
  const { toast } = useToast()

  // Load saved courses from backend
  const loadSavedCourses = async () => {
    if (!credentials?.email || !credentials?.password) {
      console.log("No credentials available for loading saved courses")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await getSavedCoursesApi({
        email: credentials.email,
        password: credentials.password,
      })

      if (response.success && response.savedCourses) {
        // Sort by saved date (newest first) to ensure consistent display order
        const sortedCourses = response.savedCourses.sort((a: SavedCourse, b: SavedCourse) => 
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        )
        setSavedCourses(sortedCourses)
        console.log(`Loaded ${sortedCourses.length} saved courses from backend`)
      } else {
        console.log("No saved courses found or error loading")
        setSavedCourses([])
      }
    } catch (error) {
      console.error("Failed to load saved courses:", error)
      toast({
        title: "❌ Failed to load saved courses",
        description: "Please try refreshing the page",
        variant: "destructive",
      })
      setSavedCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSavedCourses()
  }, [credentials])

  const saveCourse = async (courseData: Omit<SavedCourse, "id" | "status" | "savedAt" | "resubmissionCount" | "reviewNotes">): Promise<boolean> => {
    if (!credentials?.email || !credentials?.password) {
      toast({
        title: "❌ Authentication Required",
        description: "Please log in to save courses",
        variant: "destructive",
      })
      return false
    }

    try {
      const response = await saveCourseApi({
        email: credentials.email,
        password: credentials.password,
        course: courseData,
      })

      if (response.success) {
        toast({
          title: "✅ Course Saved",
          description: `${courseData.title} has been saved to your profile`,
        })
        // Refresh the saved courses list to ensure consistency
        await loadSavedCourses()
        return true
      } else {
        toast({
          title: "❌ Failed to Save Course",
          description: response.message || "Please try again",
          variant: "destructive",
        })
        return false
      }
    } catch (error: any) {
      console.error("Error saving course:", error)
      toast({
        title: "❌ Failed to Save Course",
        description: error.message || "Please try again",
        variant: "destructive",
      })
      return false
    }
  }

  const markAsCompleted = async (courseId: string, proof: { file?: string; link?: string }) => {
    if (!credentials?.email || !credentials?.password) {
      toast({
        title: "❌ Authentication Required",
        description: "Please log in to mark course as completed",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await completeCourseApi({
        email: credentials.email,
        password: credentials.password,
        courseId,
        proof,
      })

      if (response.success) {
        toast({
          title: "✅ Completion Submitted",
          description: "Your course completion has been submitted for HR review",
        })
        // Refresh the saved courses list
        await loadSavedCourses()
      } else {
        toast({
          title: "❌ Submission Failed",
          description: response.message || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error marking course as completed:", error)
      toast({
        title: "❌ Submission Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!credentials?.email || !credentials?.password) {
      toast({
        title: "❌ Authentication Required",
        description: "Please log in to delete courses",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await deleteCourseApi({
        email: credentials.email,
        password: credentials.password,
        courseId,
      })

      if (response.success) {
        toast({
          title: "✅ Course Removed",
          description: "Course has been removed from your saved list",
        })
        // Refresh the saved courses list
        await loadSavedCourses()
      } else {
        toast({
          title: "❌ Failed to Remove Course",
          description: response.message || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error deleting course:", error)
      toast({
        title: "❌ Failed to Remove Course",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  // Certificate upload function
  const handleUploadCertificate = async (file: File, bucket = "SkillCompass") => {
    try {
      const result = await uploadCertificate(file, bucket)
      return result
    } catch (error) {
      console.error("Certificate upload failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  const canSaveMore = savedCourses.length < 3
  const savedCount = savedCourses.length

  const value: SavedCoursesContextType = {
    savedCourses,
    saveCourse,
    markAsCompleted,
    deleteCourse,
    canSaveMore,
    savedCount,
    isLoading,
    refreshSavedCourses: loadSavedCourses,
    uploadCertificate: handleUploadCertificate,
  }

  return (
    <SavedCoursesContext.Provider value={value}>
      {children}
    </SavedCoursesContext.Provider>
  )
}