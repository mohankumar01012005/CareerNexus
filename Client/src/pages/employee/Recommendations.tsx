"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useSavedCourses } from "../../contexts/SavedCoursesContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { ExternalLink, BookOpen, Search, Filter, ArrowLeft, Star, Clock, Save, CheckCircle } from "lucide-react"
import { getEmployeeCareerGoals, getEmployeeResumeData } from "../../utils/api"
import { useNavigate } from "react-router-dom"

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

// Completion Modal Component
const CompletionModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (proof: { file?: string; link?: string }) => void
  courseTitle: string
}> = ({ isOpen, onClose, onSubmit, courseTitle }) => {
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file && !link.trim()) {
      alert("Please provide either a file or a link as proof of completion.")
      return
    }

    onSubmit({
      file: file ? URL.createObjectURL(file) : undefined,
      link: link.trim() || undefined
    })
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit for Review
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
  
  const { savedCourses, saveCourse, markAsCompleted, canSaveMore, savedCount } = useSavedCourses()
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
      const generatedCourses = generateRecommendations(
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

  // Generate course recommendations based on career goals and current skills
  const generateRecommendations = (goals: CareerGoal[], resume: ResumeData | null): Course[] => {
    const approvedGoals = goals.filter(goal => goal.status === "approved")
    
    if (approvedGoals.length === 0) {
      return []
    }

    const allCourses: Course[] = []
    const currentSkills = new Set([
      ...(resume?.skills?.technical || []),
      ...(resume?.skills?.soft || []),
      ...(resume?.skills?.tools || []),
      ...(resume?.skills?.domains || [])
    ])

    // Group goals by priority
    const highPriorityGoals = approvedGoals.filter(goal => goal.priority === "High")
    const mediumPriorityGoals = approvedGoals.filter(goal => goal.priority === "Medium")
    const lowPriorityGoals = approvedGoals.filter(goal => goal.priority === "Low")

    // Generate courses for high priority goals (2 free + 2 paid)
    highPriorityGoals.forEach(goal => {
      const skillGaps = goal.skillsRequired.filter(skill => !currentSkills.has(skill))
      
      if (skillGaps.length > 0) {
        // Free courses for high priority
        allCourses.push(
          generateCourse(goal.targetRole, skillGaps, "Free", "Coursera"),
          generateCourse(goal.targetRole, skillGaps, "Free", "edX")
        )
        // Paid courses for high priority
        allCourses.push(
          generateCourse(goal.targetRole, skillGaps, "Paid", "Coursera"),
          generateCourse(goal.targetRole, skillGaps, "Paid", "Udemy")
        )
      }
    })

    // Generate courses for medium priority goals (1 free + 1 paid)
    mediumPriorityGoals.forEach(goal => {
      const skillGaps = goal.skillsRequired.filter(skill => !currentSkills.has(skill))
      
      if (skillGaps.length > 0) {
        allCourses.push(
          generateCourse(goal.targetRole, skillGaps, "Free", "LinkedIn Learning"),
          generateCourse(goal.targetRole, skillGaps, "Paid", "Pluralsight")
        )
      }
    })

    // Generate courses for low priority goals (1 free + 1 paid)
    lowPriorityGoals.forEach(goal => {
      const skillGaps = goal.skillsRequired.filter(skill => !currentSkills.has(skill))
      
      if (skillGaps.length > 0) {
        allCourses.push(
          generateCourse(goal.targetRole, skillGaps, "Free", "Google Cloud Skills"),
          generateCourse(goal.targetRole, skillGaps, "Paid", "Udacity")
        )
      }
    })

    // Remove duplicates and return
    return allCourses.filter((course, index, self) => 
      index === self.findIndex(c => c.title === course.title)
    )
  }

  // Generate a course with valid links and realistic data
  const generateCourse = (
    targetRole: string, 
    skillGaps: string[], 
    costType: "Free" | "Paid", 
    provider: string
  ): Course => {
    const skillsToCover = skillGaps.slice(0, 4)
    
    const courseTemplates: { [key: string]: { [key: string]: any } } = {
      "Coursera": {
        free: {
          title: `Introduction to ${targetRole} Skills`,
          link: "https://www.coursera.org/learn/professional-skills",
          duration: "4 weeks",
          rating: 4.7,
          reviews: 12450,
          level: "Beginner",
          description: "Build foundational skills for career advancement with this comprehensive introduction."
        },
        paid: {
          title: `${targetRole} Professional Certificate`,
          link: "https://www.coursera.org/professional-certificates",
          duration: "6 months",
          rating: 4.8,
          reviews: 8920,
          level: "Intermediate",
          description: "Earn a professional certificate to advance your career in this high-demand field."
        }
      },
      "edX": {
        free: {
          title: `${targetRole} Fundamentals`,
          link: "https://www.edx.org/learn/career-development",
          duration: "8 weeks",
          rating: 4.5,
          reviews: 7560,
          level: "Beginner",
          description: "Master the fundamental concepts and techniques required for success."
        },
        paid: {
          title: `Advanced ${targetRole} Program`,
          link: "https://www.edx.org/professional-certificate",
          duration: "12 weeks",
          rating: 4.6,
          reviews: 5430,
          level: "Advanced",
          description: "Advanced program designed for professionals seeking career transformation."
        }
      },
      "Udemy": {
        free: {
          title: `Learn ${targetRole} Basics`,
          link: "https://www.udemy.com/course/career-development/",
          duration: "10 hours",
          rating: 4.4,
          reviews: 15600,
          level: "Beginner",
          description: "Quick start guide to essential skills and concepts."
        },
        paid: {
          title: `The Complete ${targetRole} Course 2024`,
          link: "https://www.udemy.com/course/professional-career-development/",
          duration: "35 hours",
          rating: 4.7,
          reviews: 23400,
          level: "Intermediate",
          description: "Complete A-to-Z course covering all aspects of professional development."
        }
      },
      "LinkedIn Learning": {
        free: {
          title: `${targetRole} Essential Training`,
          link: "https://www.linkedin.com/learning/paths/develop-your-career",
          duration: "6 hours",
          rating: 4.5,
          reviews: 8900,
          level: "Beginner",
          description: "Essential training to build core competencies and advance your career."
        },
        paid: {
          title: `Advanced ${targetRole} Techniques`,
          link: "https://www.linkedin.com/learning/paths/advance-your-career",
          duration: "15 hours",
          rating: 4.6,
          reviews: 6700,
          level: "Advanced",
          description: "Master advanced techniques and strategies for career excellence."
        }
      },
      "Pluralsight": {
        free: {
          title: `${targetRole} Core Concepts`,
          link: "https://www.pluralsight.com/paths/career-development",
          duration: "12 hours",
          rating: 4.3,
          reviews: 4500,
          level: "Beginner",
          description: "Core concepts and foundational knowledge for professional growth."
        },
        paid: {
          title: `${targetRole} Career Path`,
          link: "https://www.pluralsight.com/paths/professional-certification",
          duration: "40 hours",
          rating: 4.7,
          reviews: 3200,
          level: "Intermediate",
          description: "Comprehensive career path with hands-on projects and certifications."
        }
      },
      "Google Cloud Skills": {
        free: {
          title: `${targetRole} with Google Cloud`,
          link: "https://www.cloudskillsboost.google/paths",
          duration: "20 hours",
          rating: 4.8,
          reviews: 12800,
          level: "Intermediate",
          description: "Learn in-demand skills using Google Cloud platform and tools."
        },
        paid: {
          title: `Professional ${targetRole} Certification`,
          link: "https://www.cloudskillsboost.google/quests",
          duration: "60 hours",
          rating: 4.9,
          reviews: 8900,
          level: "Advanced",
          description: "Professional certification program with industry-recognized credentials."
        }
      },
      "Udacity": {
        free: {
          title: `${targetRole} Nanodegree Prep`,
          link: "https://www.udacity.com/courses/career-development",
          duration: "4 weeks",
          rating: 4.5,
          reviews: 5600,
          level: "Beginner",
          description: "Preparation course for the full nanodegree program."
        },
        paid: {
          title: `${targetRole} Nanodegree Program`,
          link: "https://www.udacity.com/nanodegree",
          duration: "16 weeks",
          rating: 4.7,
          reviews: 12300,
          level: "Intermediate",
          description: "Comprehensive nanodegree program with mentor support and career services."
        }
      }
    }

    const template = courseTemplates[provider]?.[costType.toLowerCase()] || {
      title: `${targetRole} ${costType} Course`,
      link: `https://www.${provider.toLowerCase().replace(/\s+/g, '')}.com/courses`,
      duration: "6 weeks",
      rating: 4.5,
      reviews: 5000,
      level: "Intermediate",
      description: "Comprehensive course designed to enhance your professional skills."
    }

    return {
      title: template.title,
      provider,
      duration: template.duration,
      costType,
      skillsCovered: skillsToCover,
      enrollLink: template.link,
      rating: template.rating,
      reviews: template.reviews,
      level: template.level as "Beginner" | "Intermediate" | "Advanced",
      certificate: costType === "Paid",
      description: template.description
    }
  }

  const handleSaveCourse = (course: Course) => {
    setSelectedCourse(course)
    setSaveModalOpen(true)
  }

  const confirmSaveCourse = () => {
    if (selectedCourse) {
      const success = saveCourse(selectedCourse)
      if (success) {
        setSaveModalOpen(false)
        setSelectedCourse(null)
      }
    }
  }

  const handleMarkAsCompleted = (course: Course) => {
    setSelectedCourse(course)
    setCompletionModalOpen(true)
  }

  const confirmMarkAsCompleted = (proof: { file?: string; link?: string }) => {
    if (selectedCourse) {
      // Find the saved course by title and provider (since we don't have ID in the original course)
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
            const savedStatus = getSavedCourseStatus(course)
            const isSaveDisabled = !canSaveMore && !isSaved

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
                      {isSaved && (
                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                          Saved
                        </Badge>
                      )}
                      {savedStatus === "pending_review" && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
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
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Completed
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
      />
    </div>
  )
}

export default Recommendations