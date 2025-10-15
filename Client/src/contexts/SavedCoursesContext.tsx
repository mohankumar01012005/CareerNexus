"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface SavedCourse {
  id: string
  title: string
  provider: string
  duration: string
  costType: "Free" | "Paid"
  skillsCovered: string[]
  enrollLink: string
  savedAt: string
  status: "active" | "completed" | "pending_review"
  completionProof?: {
    file?: string
    link?: string
    submittedAt?: string
  }
}

interface SavedCoursesContextType {
  savedCourses: SavedCourse[]
  saveCourse: (course: Omit<SavedCourse, 'id' | 'savedAt' | 'status'>) => boolean
  markAsCompleted: (courseId: string, proof: { file?: string; link?: string }) => void
  canSaveMore: boolean
  savedCount: number
}

const SavedCoursesContext = createContext<SavedCoursesContextType | undefined>(undefined)

export const SavedCoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([])

  // Load saved courses from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("savedCourses")
      if (stored) {
        try {
          setSavedCourses(JSON.parse(stored))
        } catch (error) {
          console.error("Failed to parse saved courses:", error)
        }
      }
    }
  }, [])

  // Save to localStorage whenever savedCourses changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedCourses", JSON.stringify(savedCourses))
    }
  }, [savedCourses])

  const saveCourse = (course: Omit<SavedCourse, 'id' | 'savedAt' | 'status'>): boolean => {
    if (savedCourses.length >= 3) {
      return false
    }

    const newSavedCourse: SavedCourse = {
      ...course,
      id: `saved_${Date.now()}`,
      savedAt: new Date().toISOString(),
      status: "active"
    }

    setSavedCourses(prev => [...prev, newSavedCourse])
    return true
  }

  const markAsCompleted = (courseId: string, proof: { file?: string; link?: string }) => {
    setSavedCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? {
              ...course,
              status: "pending_review",
              completionProof: {
                file: proof.file,
                link: proof.link,
                submittedAt: new Date().toISOString()
              }
            }
          : course
      )
    )
  }

  const canSaveMore = savedCourses.length < 3
  const savedCount = savedCourses.length

  return (
    <SavedCoursesContext.Provider
      value={{
        savedCourses,
        saveCourse,
        markAsCompleted,
        canSaveMore,
        savedCount
      }}
    >
      {children}
    </SavedCoursesContext.Provider>
  )
}

export const useSavedCourses = () => {
  const context = useContext(SavedCoursesContext)
  if (!context) {
    throw new Error("useSavedCourses must be used within a SavedCoursesProvider")
  }
  return context
}