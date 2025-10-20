"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useSavedCourses } from "../../contexts/SavedCoursesContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { ExternalLink, BookOpen, Search, Filter, ArrowLeft, Star, Clock, Save, CheckCircle, AlertCircle } from "lucide-react"
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
  reviews?: number
  level?: "Beginner" | "Intermediate" | "Advanced"
  certificate?: boolean
  description?: string
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

// Updated Completion Modal Component with Certificate Upload and resubmission info
const CompletionModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (proof: { file?: string; link?: string }) => void
  courseTitle: string
  resubmissionCount?: number
  reviewNotes?: string
}> = ({ isOpen, onClose, onSubmit, courseTitle, resubmissionCount = 0, reviewNotes }) => {
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

  const attemptsLeft = 3 - resubmissionCount

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

          {/* Resubmission Info */}
          {resubmissionCount > 0 && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-semibold text-blue-400">
                  Resubmission {resubmissionCount} of 3
                </p>
              </div>
              <p className="text-xs text-blue-400 mb-2">
                You have {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left to resubmit.
              </p>
              {reviewNotes && (
                <div className="mt-2 p-2 bg-blue-500/10 rounded text-xs">
                  <p className="font-semibold text-blue-300">Previous feedback:</p>
                  <p className="text-blue-400 mt-1">{reviewNotes}</p>
                </div>
              )}
            </div>
          )}

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

const Recommendations: React.FC = () => {
  const { credentials } = useAuth() as unknown as {
    credentials: { email: string; password: string } | null
  }
  
  const { savedCourses, saveCourse, markAsCompleted, canSaveMore, savedCount, refreshSavedCourses } = useSavedCourses()
  const navigate = useNavigate()
  const [careerGoals, setCareerGoals] = useState<CareerGoal[]>([])
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "free" | "paid" | "saved">("all")
  const [providerFilter, setProviderFilter] = useState<string>("all")
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
      const generatedCourses = await generateRecommendations(
          goalsResponse.success ? goalsResponse.careerGoals : [],
          resumeResponse.success && resumeResponse.resume_data ? resumeResponse.resume_data[0] as ResumeData : null
      )
      setCourses(generatedCourses)
      setFilteredCourses(generatedCourses)
    } catch (error) {
      console.error("Failed to fetch recommendations data:", error)
      setCourses([])
      setFilteredCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Refresh saved courses when component mounts to ensure consistency
    refreshSavedCourses()
  }, [credentials])

  // Filter courses based on search and filter criteria
  useEffect(() => {
    let result = courses

    // Apply cost filter
    if (filter === "free") {
      result = result.filter(course => course.costType === "Free")
    } else if (filter === "paid") {
      result = result.filter(course => course.costType === "Paid")
    } else if (filter === "saved") {
      result = result.filter(course => isCourseSaved(course))
    }

    // Apply provider filter
    if (providerFilter !== "all") {
      result = result.filter(course => course.provider === providerFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(course => 
        course.title.toLowerCase().includes(term) ||
        course.provider.toLowerCase().includes(term) ||
        course.skillsCovered.some(skill => skill.toLowerCase().includes(term))
      )
    }

    setFilteredCourses(result)
  }, [searchTerm, filter, providerFilter, courses, savedCourses])

  // Generate course recommendations
  const generateRecommendations = async (goals: CareerGoal[], resume: ResumeData | null): Promise<Course[]> => {
    const approvedGoals = goals.filter(goal => goal.status === "approved")
    
    if (approvedGoals.length === 0) {
      return []
    }

    // Get current skills from resume
    const currentSkills = new Set([
      ...(resume?.skills?.technical || []),
      ...(resume?.skills?.soft || []),
      ...(resume?.skills?.tools || []),
      ...(resume?.skills?.domains || [])
    ])

    const currentSkillsArray = Array.from(currentSkills)

    // Create cache key based on skills and goals for consistency
    const cacheKey = `course_recommendations_${btoa(JSON.stringify({
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
        console.log("[AI] Using cached recommendations")
        return JSON.parse(cached)
      }
    }

    try {
      console.log("[AI] Generating new course recommendations...")
      
      const aiRecommendations = await generateAICourseRecommendations(
        currentSkillsArray,
        approvedGoals.map(goal => ({
          targetRole: goal.targetRole,
          skillsRequired: goal.skillsRequired,
          priority: goal.priority
        }))
      )

      // Convert AI recommendations to Course format
      const courses: Course[] = aiRecommendations.map(rec => ({
        title: rec.title,
        provider: rec.provider,
        duration: rec.duration,
        costType: rec.costType,
        skillsCovered: rec.skillsCovered,
        enrollLink: rec.enrollLink,
        rating: rec.rating,
        reviews: rec.reviews,
        level: rec.level,
        certificate: rec.certificate,
        description: rec.description
      }))

      // Cache the results for consistency
      if (typeof window !== "undefined") {
        localStorage.setItem(cacheKey, JSON.stringify(courses))
      }

      return courses
    } catch (error) {
      console.error("[AI] Failed to generate recommendations:", error)
      return []
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
          // Refresh to ensure consistency across components
          refreshSavedCourses()
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-500/20 text-green-400"
      case "Intermediate": return "bg-yellow-500/20 text-yellow-400"
      case "Advanced": return "bg-red-500/20 text-red-400"
      default: return "bg-gray-500/20 text-gray-400"
    }
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

  const getSavedCourseDetails = (course: Course | null) => {
    if (!course) return undefined
    return savedCourses.find(sc => sc.title === course.title && sc.provider === course.provider)
  }

  const providers = [...new Set(courses.map(course => course.provider))]

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/employee/dashboard')} className="glass-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Learning Recommendations</h1>
          </div>
        </div>
        
        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-teal mx-auto"></div>
              <p className="text-foreground-secondary mt-4">Loading recommendations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const approvedGoals = careerGoals.filter(goal => goal.status === "approved")

  if (approvedGoals.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/employee/dashboard')} className="glass-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Learning Recommendations</h1>
          </div>
        </div>
        
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-foreground-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Approved Career Goals</h3>
            <p className="text-foreground-secondary mb-6">
              Set and get approved career goals to receive personalized course recommendations
            </p>
            <Button 
              className="text-white"
              style={{ backgroundColor: 'rgb(108, 74, 208)' }}
              onClick={() => navigate('/employee/dashboard')}
            >
              Set Career Goals
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/employee/dashboard')} className="glass-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Recommendations</h1>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 futuristic-input"
                />
              </div>
            </div>

            {/* Cost Filter */}
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "free" | "paid" | "saved")}
                className="w-full p-2 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors text-sm"
              >
                <option value="all">All Courses</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
                <option value="saved">Saved Only</option>
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full p-2 rounded-lg bg-background/50 border border-border focus:border-neon-teal focus:outline-none focus:ring-2 focus:ring-neon-teal/20 transition-colors text-sm"
              >
                <option value="all">All Providers</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            {/* Saved Count */}
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                {savedCount}/3 Saved
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-foreground-secondary text-sm">
          Showing {filteredCourses.length} of {courses.length} courses
        </p>
        <div className="flex items-center space-x-2 text-xs text-foreground-secondary">
          <Filter className="w-3 h-3" />
          <span>Filtered by: {filter !== "all" && `${filter} •`} {providerFilter !== "all" && providerFilter}</span>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-foreground-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Courses Found</h3>
            <p className="text-foreground-secondary">
              Try adjusting your filters or search terms to see more results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCourses.map((course, index) => {
            const isSaved = isCourseSaved(course)
            const savedCourse = getSavedCourseDetails(course)
            const savedStatus = savedCourse?.status
            const isSaveDisabled = !canSaveMore && !isSaved
            const resubmissionCount = savedCourse?.resubmissionCount || 0
            const reviewNotes = savedCourse?.reviewNotes

            return (
              <Card 
                key={index} 
                className="glass-card hover:border-neon-teal/30 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getProviderIcon(course.provider)}</span>
                      <div>
                        <CardTitle className="text-base leading-tight">{course.title}</CardTitle>
                        <CardDescription className="text-xs">{course.provider}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={`text-xs ${getCostTypeColor(course.costType)}`}>
                        {course.costType}
                      </Badge>
                      {isSaved && savedStatus === "active" && (
                        <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Saved
                        </Badge>
                      )}
                      {savedStatus === "pending_review" && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {savedStatus === "completed" && (
                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {resubmissionCount > 0 && savedStatus === "active" && (
                        <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                          Attempt {resubmissionCount}/3
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground-secondary line-clamp-2">
                    {course.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Course Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-foreground-secondary" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span>{course.rating}</span>
                        <span className="text-foreground-secondary">({(course.reviews || 0).toLocaleString()})</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getLevelColor(course.level || "Intermediate")}`}>
                      {course.level}
                    </Badge>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-xs font-semibold mb-1">Skills Covered:</h4>
                    <div className="flex flex-wrap gap-1">
                      {course.skillsCovered.slice(0, 3).map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {course.skillsCovered.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{course.skillsCovered.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Certificate Info */}
                  {course.certificate && (
                    <div className="flex items-center space-x-1 text-xs text-neon-teal">
                      <span>🎓</span>
                      <span>Certificate Included</span>
                    </div>
                  )}

                  {/* Show review notes if available and course was rejected */}
                  {reviewNotes && savedStatus === "active" && resubmissionCount > 0 && (
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                      <p className="font-semibold text-blue-300">HR Feedback:</p>
                      <p className="text-blue-400 mt-1">{reviewNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1 text-sm text-white"
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
                        className="glass-button bg-transparent text-sm"
                        onClick={() => handleSaveCourse(course)}
                        disabled={isSaveDisabled}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    ) : savedStatus === "active" ? (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white text-sm"
                        onClick={() => handleMarkAsCompleted(course)}
                        disabled={resubmissionCount >= 3}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {resubmissionCount > 0 ? 'Resubmit' : 'Mark Completed'}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
        resubmissionCount={getSavedCourseDetails(selectedCourse)?.resubmissionCount}
        reviewNotes={getSavedCourseDetails(selectedCourse)?.reviewNotes}
      />
    </div>
  )
}

export default Recommendations