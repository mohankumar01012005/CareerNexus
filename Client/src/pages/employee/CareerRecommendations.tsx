"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useSavedCourses } from "../../contexts/SavedCoursesContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { ExternalLink, BookOpen, Save, CheckCircle, Clock, Award } from "lucide-react"
import { getEmployeeCareerGoals, getEmployeeResumeData } from "../../utils/api"
import { useNavigate } from "react-router-dom"
import { generateAICourseRecommendations } from "../../lib/gemini"

interface Course {
  title: string
  provider: string
  duration: string
  costType: "Free" | "Paid"
  skillsCovered: string[]
  enrollLink: string
  rating?: number
  level?: "Beginner" | "Intermediate" | "Advanced"
}

interface CareerGoal {
  _id?: string
  targetRole: string
  priority: "Low" | "Medium" | "High"
  targetDate: string
  progress: number
  skillsRequired: string[]
  status: "pending" | "approved" | "rejected"
}

interface ResumeData {
  skills?: {
    technical: string[]
    soft: string[]
    tools: string[]
    domains: string[]
  }
}

// Save Confirmation Modal Component
const SaveConfirmationModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentCount: number
  courseTitle: string
}> = ({ isOpen, onClose, onConfirm, currentCount, courseTitle }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Save Course</h2>
          </div>
          
          <p className="text-foreground-secondary mb-4">
            You are about to save <strong>"{courseTitle}"</strong>. You can save maximum 3 courses.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-400">
              <strong>Note:</strong> You have saved {currentCount} of 3 courses. Once saved, you cannot unsave the course and your course completion will be evaluated.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 glass-button bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-neon-purple hover:bg-neon-purple/80 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Course
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Updated Completion Modal Component with Certificate Upload
const CompletionModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (proof: { file?: string; link?: string }) => void
  courseTitle: string
}> = ({ isOpen, onClose, onSubmit, courseTitle }) => {
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { uploadCertificate } = useSavedCourses()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file && !link.trim()) {
      alert("Please provide either a file or a link as proof of completion.")
      return
    }

    let fileUrl = undefined

    // Upload certificate file if provided
    if (file) {
      try {
        setIsUploading(true)
        const uploadResult = await uploadCertificate(file)
        if (uploadResult.success && uploadResult.publicUrl) {
          fileUrl = uploadResult.publicUrl
        } else {
          alert("Failed to upload certificate. Please try again.")
          setIsUploading(false)
          return
        }
      } catch (error) {
        console.error("Certificate upload error:", error)
        alert("Failed to upload certificate. Please try again.")
        setIsUploading(false)
        return
      }
    }

    onSubmit({
      file: fileUrl,
      link: link.trim() || undefined
    })
    setIsUploading(false)
    onClose()
    // Reset form
    setFile(null)
    setLink("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Mark as Completed</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <span className="text-lg">×</span>
            </Button>
          </div>

          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            <p><strong>Important:</strong> You need to provide proof of course completion. This will be manually evaluated by HR.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Upload Certificate/Proof (PDF, Image)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full p-3 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors"
                disabled={isUploading}
              />
              <p className="text-xs text-foreground-secondary mt-1">Maximum file size: 10MB</p>
            </div>

            <div className="text-center text-foreground-secondary">OR</div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Completion Certificate Link
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://coursera.org/verify/..."
                className="w-full p-3 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors"
                disabled={isUploading}
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> At least one proof (file or link) is required for submission. Your submission will be reviewed by HR and the status will be updated accordingly.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 glass-button bg-transparent"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const CareerRecommendations: React.FC = () => {
  const { credentials } = useAuth() as unknown as {
    credentials: { email: string; password: string } | null
  }
  
  const { savedCourses, saveCourse, markAsCompleted, canSaveMore, savedCount } = useSavedCourses()
  const navigate = useNavigate()
  const [careerGoals, setCareerGoals] = useState<CareerGoal[]>([])
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // Fetch career goals and resume data
  const fetchData = async () => {
    if (!credentials?.email || !credentials?.password) {
      console.log("No credentials available for fetching recommendations data")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Fetch career goals
      const goalsResponse = await getEmployeeCareerGoals({
        email: credentials.email,
        password: credentials.password,
      })

      // Fetch resume data for current skills
      const resumeResponse = await getEmployeeResumeData({
        email: credentials.email,
        password: credentials.password,
      })

      if (goalsResponse.success && goalsResponse.careerGoals) {
        setCareerGoals(goalsResponse.careerGoals)
      }

      if (resumeResponse.success && resumeResponse.resume_data) {
        const latestResume = resumeResponse.resume_data[0] as ResumeData
        setResumeData(latestResume)
      }

      // Generate recommendations based on approved career goals
      generateRecommendations(
        goalsResponse.success ? goalsResponse.careerGoals : [],
        resumeResponse.success && resumeResponse.resume_data ? resumeResponse.resume_data[0] as ResumeData : null
      )
    } catch (error) {
      console.error("Failed to fetch recommendations data:", error)
      setCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [credentials])

  // Generate recommendations based on career goals and current skills
  const generateRecommendations = async (goals: CareerGoal[], resume: ResumeData | null) => {
    const approvedGoals = goals.filter(goal => goal.status === "approved")
    
    if (approvedGoals.length === 0) {
      setCourses([])
      return
    }

    // Get current skills from resume
    const currentSkills = new Set([
      ...(resume?.skills?.technical || []),
      ...(resume?.skills?.soft || []),
      ...(resume?.skills?.tools || []),
      ...(resume?.skills?.domains || [])
    ])

    const currentSkillsArray = Array.from(currentSkills)

    // Create cache key for top 3 recommendations
    const cacheKey = `top_course_recommendations_${btoa(JSON.stringify({
      skills: currentSkillsArray.sort(),
      goals: approvedGoals.map(g => ({
        targetRole: g.targetRole,
        skillsRequired: g.skillsRequired.sort(),
        priority: g.priority
      })).sort((a, b) => a.targetRole.localeCompare(b.targetRole))
    }))}`

    // Check cache first
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        console.log("[AI] Using cached top recommendations")
        setCourses(JSON.parse(cached))
        return
      }
    }

    try {
      console.log("[AI] Generating new top course recommendations...")
      
      const aiRecommendations = await generateAICourseRecommendations(
        currentSkillsArray,
        approvedGoals.map(goal => ({
          targetRole: goal.targetRole,
          skillsRequired: goal.skillsRequired,
          priority: goal.priority
        }))
      )

      // Take top 3 most relevant courses (highest readiness gain)
      const topCourses = aiRecommendations
        .sort((a: { readinessGain: number }, b: { readinessGain: number }) => b.readinessGain - a.readinessGain)
        .slice(0, 3)
        .map((rec: { title: any; provider: any; duration: any; costType: any; skillsCovered: any; enrollLink: any; rating: any; level: any }) => ({
          title: rec.title,
          provider: rec.provider,
          duration: rec.duration,
          costType: rec.costType,
          skillsCovered: rec.skillsCovered,
          enrollLink: rec.enrollLink,
          rating: rec.rating,
          level: rec.level
        }))

      // Cache the top 3 results
      if (typeof window !== "undefined") {
        localStorage.setItem(cacheKey, JSON.stringify(topCourses))
      }

      setCourses(topCourses)
    } catch (error) {
      console.error("[AI] Failed to generate top recommendations:", error)
      setCourses([])
    }
  }

  const handleSaveCourse = (course: Course) => {
    setSelectedCourse(course)
    setSaveModalOpen(true)
  }

  const confirmSaveCourse = () => {
    if (selectedCourse) {
      saveCourse(selectedCourse).then(success => {
        if (success) {
          setSaveModalOpen(false)
          setSelectedCourse(null)
        }
      })
    }
  }

  const handleMarkAsCompleted = (course: Course) => {
    setSelectedCourse(course)
    setCompletionModalOpen(true)
  }

  const confirmMarkAsCompleted = (proof: { file?: string; link?: string }) => {
    if (selectedCourse) {
      // Find the saved course by title and provider
      const savedCourse = savedCourses.find(
        sc => sc.title === selectedCourse.title && sc.provider === selectedCourse.provider
      )
      if (savedCourse) {
        markAsCompleted(savedCourse.id, proof)
        setCompletionModalOpen(false)
        setSelectedCourse(null)
      }
    }
  }

  const getCostTypeColor = (costType: string) => {
    return costType === "Free" 
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-purple-500/20 text-purple-400 border-purple-500/30"
  }

  const getProviderIcon = (provider: string) => {
    const iconMap: { [key: string]: string } = {
      "Coursera": "📚",
      "edX": "🎓",
      "Udemy": "🟣",
      "LinkedIn Learning": "💼",
      "Pluralsight": "👁️",
      "Google Cloud Skills": "☁️",
      "Udacity": "⚡"
    }
    return iconMap[provider] || "📖"
  }

  const isCourseSaved = (course: Course) => {
    return savedCourses.some(sc => sc.title === course.title && sc.provider === course.provider)
  }

  const getSavedCourseStatus = (course: Course) => {
    const savedCourse = savedCourses.find(sc => sc.title === course.title && sc.provider === course.provider)
    return savedCourse?.status
  }

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-neon-orange flex-shrink-0" />
            <span>AI Recommendations</span>
          </CardTitle>
          <CardDescription>Loading personalized learning opportunities...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-orange mx-auto"></div>
            <p className="text-foreground-secondary mt-2">Analyzing your career goals and skills...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const approvedGoals = careerGoals.filter(goal => goal.status === "approved")

  if (approvedGoals.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-neon-orange flex-shrink-0" />
            <span>AI Recommendations</span>
          </CardTitle>
          <CardDescription>Get personalized learning opportunities</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Award className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Approved Career Goals</h3>
          <p className="text-foreground-secondary mb-4">
            Set and get approved career goals to receive personalized course recommendations
          </p>
          <Button className="glass-button">
            <Award className="w-4 h-4 mr-2" />
            Set Career Goals
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-neon-orange flex-shrink-0" />
            <span>AI Learning Recommendations</span>
          </CardTitle>
          <CardDescription>
            Top courses based on your {approvedGoals.length} approved career goal{approvedGoals.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.length === 0 ? (
            <div className="text-center py-8 glass-card border-border/30">
              <BookOpen className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Skill Gaps Found</h3>
              <p className="text-foreground-secondary">
                Great job! Your current skills match your career goals.
              </p>
            </div>
          ) : (
            courses.map((course, index) => {
              const isSaved = isCourseSaved(course)
              const savedStatus = getSavedCourseStatus(course)
              const isSaveDisabled = !canSaveMore && !isSaved

              return (
                <div
                  key={index}
                  className="p-4 glass-card border-border/30 tilt-3d hover:scale-[1.02] transition-transform"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="text-lg flex-shrink-0">{getProviderIcon(course.provider)}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm truncate">{course.title}</h4>
                        <p className="text-xs text-foreground-secondary truncate">
                          {course.provider} • {course.duration} • ⭐ {course.rating}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCostTypeColor(course.costType)}`}
                      >
                        {course.costType}
                      </Badge>
                      {savedStatus === "pending_review" && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {isSaved && savedStatus === "active" && (
                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                          Saved
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.skillsCovered.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1 text-white"
                      style={{ backgroundColor: 'rgb(108, 74, 208)' }}
                      onClick={() => window.open(course.enrollLink, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Course
                    </Button>
                    
                    {!isSaved ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="glass-button bg-transparent"
                        onClick={() => handleSaveCourse(course)}
                        disabled={isSaveDisabled}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    ) : savedStatus === "active" ? (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleMarkAsCompleted(course)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Completed
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
          
          {courses.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full glass-button bg-transparent"
              onClick={() => navigate('/employee/recommendations')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View All Recommendations
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Save Confirmation Modal */}
      <SaveConfirmationModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={confirmSaveCourse}
        currentCount={savedCount}
        courseTitle={selectedCourse?.title || ""}
      />

      {/* Completion Modal */}
      <CompletionModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        onSubmit={confirmMarkAsCompleted}
        courseTitle={selectedCourse?.title || ""}
      />
    </>
  )
}

export { SaveConfirmationModal, CompletionModal }
export default CareerRecommendations