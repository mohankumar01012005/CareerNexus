// [file name]: Profile.tsx

// src/pages/employee/Profile.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Progress } from "../../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Award,
  Target,
  BookOpen,
  Download,
  Upload,
  Trash2,
  Edit3,
  Save,
  X,
  Zap,
  Briefcase,
  Clock,
  Star,
  TrendingUp,
  Bookmark,
  Camera,
} from "lucide-react"
import {
  getEmployeeResumeData,
  getEmployeeCareerGoals,
  getSavedCoursesApi,
  updateEmployeeProfile,
  getEmployeeProfile,
} from "../../utils/api"
import { supabase } from "../../lib/supabase"

interface EmployeeProfile {
  personalInfo: {
    fullName: string
    email: string
    phoneNumber?: string
    avatar?: string
    department: string
    role: string
    joiningDate: string
    tenure: number
  }
  professionalInfo: {
    currentRole: string
    department: string
    tenure: number
    careerReadinessScore: number
    achievements: string[]
  }
  skills: Array<{
    id: string
    name: string
    category: string
  }>
  careerGoals: Array<{
    _id: string
    targetRole: string
    priority: string
    targetDate: string
    progress: number
    skillsRequired: string[]
    status: string
    submittedAt: string
  }>
  resume: {
    resumeLink: string
    resumeData: any[]
  }
  savedCourses: Array<{
    _id: string
    title: string
    provider: string
    duration: string
    costType: string
    skillsCovered: string[]
    enrollLink: string
    savedAt: string
    status: string
  }>
  systemInfo: {
    userType: string
    lastLogin: string
    memberSince: string
    isActive: boolean
  }
}

const Profile: React.FC = () => {
  const { user, credentials, updateUser } = useAuth()
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    phoneNumber: "",
    skills: [] as any[],
  })
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfileData()
  }, [])

  useEffect(() => {
    if (profile) {
      setEditData({
        phoneNumber: profile.personalInfo.phoneNumber || "",
        skills: profile.skills || [],
      })
    }
  }, [profile])

  const fetchProfileData = async () => {
    if (!credentials?.email || !credentials?.password) {
      console.log("No credentials available for fetching profile")
      setIsLoading(false)
      return
    }

    try {
      let profileDataFromBackend: any = null
      try {
        const profileResponse = await getEmployeeProfile({
          email: credentials.email,
          password: credentials.password,
        })
        if (profileResponse.success && profileResponse.employee) {
          profileDataFromBackend = profileResponse.employee
          console.log("[v0] Profile data from backend:", profileDataFromBackend)
        }
      } catch (error) {
        console.log("[v0] Error fetching profile from backend:", error)
      }

      // Fetch resume data for skills and resume info
      const resumeResponse = await getEmployeeResumeData({
        email: credentials.email,
        password: credentials.password,
      })

      // Fetch career goals
      const goalsResponse = await getEmployeeCareerGoals({
        email: credentials.email,
        password: credentials.password,
      })

      // Fetch saved courses
      let savedCourses = []
      try {
        const coursesResponse = await getSavedCoursesApi({
          email: credentials.email,
          password: credentials.password,
        })
        if (coursesResponse.success) {
          savedCourses = coursesResponse.savedCourses || []
        }
      } catch (error) {
        console.log("Error fetching saved courses:", error)
        savedCourses = []
      }

      const profileData: EmployeeProfile = {
        personalInfo: {
          fullName: profileDataFromBackend?.fullName || user?.name || "Employee",
          email: credentials.email,
          phoneNumber: profileDataFromBackend?.phoneNumber || user?.phoneNumber || user?.phone || "",
          avatar: profileDataFromBackend?.avatar || user?.avatar,
          department: profileDataFromBackend?.department || user?.department || "Engineering",
          role: profileDataFromBackend?.role || user?.currentRole || "Software Engineer",
          joiningDate: profileDataFromBackend?.joiningDate || user?.joinDate || new Date().toISOString(),
          tenure: calculateTenure(profileDataFromBackend?.joiningDate || user?.joinDate || new Date().toISOString()),
        },
        professionalInfo: {
          currentRole: profileDataFromBackend?.role || user?.currentRole || "Software Engineer",
          department: profileDataFromBackend?.department || user?.department || "Engineering",
          tenure: calculateTenure(profileDataFromBackend?.joiningDate || user?.joinDate || new Date().toISOString()),
          careerReadinessScore: user?.readinessScore || 0,
          achievements: user?.achievements || [],
        },
        skills: user?.skills || [],
        careerGoals: goalsResponse.success ? goalsResponse.careerGoals : [],
        resume: {
          resumeLink: resumeResponse.resume_link || "",
          resumeData: resumeResponse.resume_data || [],
        },
        savedCourses: savedCourses,
        systemInfo: {
          userType: "employee",
          lastLogin: new Date().toISOString(),
          memberSince: profileDataFromBackend?.joiningDate || user?.joinDate || new Date().toISOString(),
          isActive: true,
        },
      }

      // If we have resume data with skills, use those instead
      if (resumeResponse.success && resumeResponse.resume_data && resumeResponse.resume_data.length > 0) {
        const resumeData = resumeResponse.resume_data[0]
        if (resumeData.skills?.technical) {
          const technicalSkills = resumeData.skills.technical.map((skill: string, index: number) => ({
            id: `resume_skill_${index}`,
            name: skill,
            category: "Technical",
          }))
          profileData.skills = technicalSkills
        }
      }

      setProfile(profileData)
    } catch (error) {
      console.error("Error fetching profile data:", error)
      // Create fallback profile with basic user data
      const fallbackProfile: EmployeeProfile = {
        personalInfo: {
          fullName: user?.name || "Employee",
          email: credentials.email,
          phoneNumber: user?.phoneNumber || user?.phone || "",
          avatar: user?.avatar,
          department: user?.department || "Engineering",
          role: user?.currentRole || "Software Engineer",
          joiningDate: user?.joinDate || new Date().toISOString(),
          tenure: calculateTenure(user?.joinDate || new Date().toISOString()),
        },
        professionalInfo: {
          currentRole: user?.currentRole || "Software Engineer",
          department: user?.department || "Engineering",
          tenure: calculateTenure(user?.joinDate || new Date().toISOString()),
          careerReadinessScore: user?.readinessScore || 0,
          achievements: user?.achievements || [],
        },
        skills: user?.skills || [],
        careerGoals: [],
        resume: {
          resumeLink: "",
          resumeData: [],
        },
        savedCourses: [],
        systemInfo: {
          userType: "employee",
          lastLogin: new Date().toISOString(),
          memberSince: user?.joinDate || new Date().toISOString(),
          isActive: true,
        },
      }
      setProfile(fallbackProfile)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTenure = (joinDate: string): number => {
    const join = new Date(joinDate)
    const now = new Date()
    const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth())
    return Math.max(0, months)
  }

  const handleSaveProfile = async () => {
    if (!credentials?.email || !credentials?.password) return

    try {
      const response = await updateEmployeeProfile({
        email: credentials.email,
        password: credentials.password,
        updates: {
          phoneNumber: editData.phoneNumber,
          // Don't send skills in profile update - they should be managed separately
        },
      })

      if (response.success) {
        if (profile) {
          const updatedProfile = {
            ...profile,
            personalInfo: {
              ...profile.personalInfo,
              phoneNumber: editData.phoneNumber,
            },
          }
          setProfile(updatedProfile)

          // Update AuthContext user data
          updateUser({
            ...user,
            phoneNumber: editData.phoneNumber,
            phone: editData.phoneNumber, // Update both phone and phoneNumber for consistency
          })
        }
        setIsEditing(false)
        alert("Profile updated successfully!")
      } else {
        alert(response.message || "Failed to update profile. Please try again.")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert(`Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const uploadAvatarToSupabase = async (
    file: File,
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> => {
    try {
      const timestamp = Date.now()
      const fileExtension = file.name.split(".").pop()
      const fileName = `avatar_${timestamp}.${fileExtension}`

      console.log("Uploading avatar:", fileName)

      const { data, error } = await supabase.storage.from("SkillCompass").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      })

      if (error) {
        console.error("Avatar upload error:", error)
        return { success: false, error: error.message }
      }

      const { data: publicUrlData } = supabase.storage.from("SkillCompass").getPublicUrl(fileName)

      console.log("Avatar uploaded successfully:", publicUrlData.publicUrl)
      return { success: true, publicUrl: publicUrlData.publicUrl }
    } catch (error) {
      console.error("Avatar upload failed:", error)
      return { success: false, error: "Upload failed" }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB")
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setShowPreviewModal(true)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAvatarUpload = async () => {
    if (!selectedFile || !credentials) return

    setIsUploading(true)
    try {
      const result = await uploadAvatarToSupabase(selectedFile)

      if (result.success && result.publicUrl) {
        try {
          const response = await updateEmployeeProfile({
            email: credentials.email,
            password: credentials.password,
            updates: {
              avatar: result.publicUrl,
            },
          })

          if (response.success) {
            // Update local state immediately
            if (profile) {
              const updatedProfile = {
                ...profile,
                personalInfo: {
                  ...profile.personalInfo,
                  avatar: result.publicUrl,
                },
              }
              setProfile(updatedProfile)
            }

            // Update AuthContext user data immediately
            updateUser({
              ...user,
              avatar: result.publicUrl,
            })

            setShowPreviewModal(false)
            setSelectedFile(null)
            setPreviewUrl("")
            alert("Profile picture updated successfully!")
          } else {
            alert(response.message || "Failed to update profile picture. Please try again.")
          }
        } catch (backendError) {
          console.error("Backend error updating avatar:", backendError)
          alert(
            `Failed to save profile picture: ${backendError instanceof Error ? backendError.message : "Unknown error"}`,
          )
        }
      } else {
        alert(result.error || "Failed to upload avatar. Please try again.")
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to upload avatar. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!credentials) return

    try {
      const response = await updateEmployeeProfile({
        email: credentials.email,
        password: credentials.password,
        updates: {
          avatar: "",
        },
      })

      if (response.success) {
        // Update local state immediately
        if (profile) {
          const updatedProfile = {
            ...profile,
            personalInfo: {
              ...profile.personalInfo,
              avatar: undefined,
            },
          }
          setProfile(updatedProfile)
        }

        // Update AuthContext user data immediately
        updateUser({
          ...user,
          avatar: undefined,
        })

        alert("Profile picture removed successfully!")
      } else {
        alert(response.message || "Failed to remove profile picture. Please try again.")
      }
    } catch (error) {
      console.error("Error removing avatar:", error)
      alert(`Failed to remove profile picture: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-teal"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-center text-foreground-secondary">Failed to load profile data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Avatar Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Preview Avatar</h3>
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-sm text-foreground-secondary mb-4 text-center">This will be your new profile picture</p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreviewModal(false)
                  setSelectedFile(null)
                  setPreviewUrl("")
                }}
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button onClick={handleAvatarUpload} className="flex-1 glass-button" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Confirm Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Profile Card - Now spans full width */}
        <Card className="glass-card tilt-3d">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-space">Employee Profile</CardTitle>
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
                className="glass-button"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Manage your personal and professional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  <AvatarImage
                    src={profile.personalInfo.avatar || "/placeholder.svg"}
                    alt={profile.personalInfo.fullName}
                  />
                  <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                    {profile.personalInfo.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                {/* Avatar Action Buttons - Always Visible */}
                <div className="absolute -bottom-2 -right-2 flex space-x-1">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="bg-neon-teal text-white p-2 rounded-full shadow-lg hover:bg-neon-teal/90 transition-colors">
                      <Camera className="w-4 h-4" />
                    </div>
                    <input
                      id="avatar-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </label>
                  {profile.personalInfo.avatar && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="bg-neon-orange text-white p-2 rounded-full shadow-lg hover:bg-neon-orange/90 transition-colors"
                      disabled={isUploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.personalInfo.fullName}</h2>
                <p className="text-foreground-secondary">{profile.personalInfo.role}</p>
                <div className="flex items-center mt-2 text-sm text-foreground-secondary">
                  <Building className="w-4 h-4 mr-1" />
                  {profile.personalInfo.department}
                </div>
                <div className="flex items-center mt-1 text-sm text-foreground-secondary">
                  <Calendar className="w-4 h-4 mr-1" />
                  Member since {formatDate(profile.personalInfo.joiningDate)}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xl font-bold text-gradient-primary">{profile.skills.length}</div>
                  <div className="text-xs text-foreground-secondary">Skills</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xl font-bold text-gradient-primary">{profile.careerGoals.length}</div>
                  <div className="text-xs text-foreground-secondary">Goals</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xl font-bold text-gradient-primary">{profile.savedCourses.length}</div>
                  <div className="text-xs text-foreground-secondary">Courses</div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Label>
                <Input id="email" value={profile.personalInfo.email} disabled className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder={isEditing ? "Enter phone number" : "Not provided"}
                  value={isEditing ? editData.phoneNumber : profile.personalInfo.phoneNumber || ""}
                  onChange={(e) => setEditData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Department
                </Label>
                <Input id="department" value={profile.personalInfo.department} disabled className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Join Date
                </Label>
                <Input
                  id="joinDate"
                  value={formatDate(profile.personalInfo.joiningDate)}
                  disabled
                  className="bg-background/50"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} className="glass-button">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card text-center p-4 tilt-3d">
          <TrendingUp className="w-8 h-8 text-neon-teal mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">{profile.skills.length}</div>
          <div className="text-xs text-foreground-secondary">Skills Tracked</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <Bookmark className="w-8 h-8 text-neon-purple mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">{profile.savedCourses.length}</div>
          <div className="text-xs text-foreground-secondary">Saved Courses</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <Target className="w-8 h-8 text-neon-blue mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">{profile.careerGoals.length}</div>
          <div className="text-xs text-foreground-secondary">Career Goals</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <Star className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">{profile.professionalInfo.achievements.length}</div>
          <div className="text-xs text-foreground-secondary">Achievements</div>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="skills" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills" className="flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="career" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Career Goals
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-neon-teal" />
                Skills & Competencies
              </CardTitle>
              <CardDescription>Your technical and professional skills</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.skills.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Skills Added</h3>
                  <p className="text-foreground-secondary mb-4">Add your skills to showcase your expertise</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profile.skills.map((skill, index) => (
                    <div
                      key={`skill-${skill.id}-${index}`}
                      className="p-4 rounded-xl bg-gradient-to-br from-background/50 to-background/20 border border-border/50 tilt-3d"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-center space-y-2">
                        <h3 className="font-semibold text-sm truncate">{skill.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {skill.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career Goals Tab */}
        <TabsContent value="career" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-neon-purple" />
                Career Goals & Development
              </CardTitle>
              <CardDescription>Your career aspirations and development plans</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.careerGoals.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Career Goals</h3>
                  <p className="text-foreground-secondary mb-4">Set your career goals to plan your growth path</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.careerGoals.map((goal) => (
                    <div key={goal._id} className="p-4 rounded-lg bg-background/50 border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{goal.targetRole}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant={
                                goal.priority === "High"
                                  ? "destructive"
                                  : goal.priority === "Medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {goal.priority} Priority
                            </Badge>
                            <Badge
                              variant={
                                goal.status === "approved"
                                  ? "default"
                                  : goal.status === "pending"
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {goal.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-foreground-secondary">Target: {formatDate(goal.targetDate)}</div>
                        </div>
                      </div>
                      <Progress value={goal.progress} className="h-2 mb-3" />
                      <div className="text-sm text-foreground-secondary">
                        Required Skills: {goal.skillsRequired.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-neon-orange" />
                Achievements & Certifications
              </CardTitle>
              <CardDescription>Your professional achievements and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.professionalInfo.achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Achievements</h3>
                  <p className="text-foreground-secondary mb-4">Your achievements will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.professionalInfo.achievements.map((achievement, index) => (
                    <div
                      key={`achievement-${index}`}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-background/50"
                    >
                      <Award className="w-5 h-5 text-neon-orange mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm">{achievement}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Saved Courses */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Saved Learning Courses
                </h4>
                {profile.savedCourses.length === 0 ? (
                  <p className="text-foreground-secondary text-sm">No saved courses</p>
                ) : (
                  <div className="space-y-3">
                    {profile.savedCourses.map((course) => (
                      <div
                        key={course._id}
                        className="flex justify-between items-center p-3 rounded-lg bg-background/30"
                      >
                        <div>
                          <p className="font-medium text-sm">{course.title}</p>
                          <p className="text-xs text-foreground-secondary">{course.provider}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {course.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-neon-blue" />
                Documents & Resume
              </CardTitle>
              <CardDescription>Your professional documents and resume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Resume Section */}
                <div className="p-4 rounded-lg bg-background/50 border">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      Resume
                    </h4>
                    {profile.resume.resumeLink && (
                      <Button size="sm" className="glass-button" asChild>
                        <a href={profile.resume.resumeLink} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                  {profile.resume.resumeLink ? (
                    <div className="text-sm text-foreground-secondary">
                      <p>
                        Resume last updated:{" "}
                        {formatDate(profile.resume.resumeData[0]?.updatedAt || profile.systemInfo.lastLogin)}
                      </p>
                      <p className="mt-1">
                        Skills extracted: {profile.resume.resumeData[0]?.skills?.technical?.length || 0} technical
                        skills
                      </p>
                    </div>
                  ) : (
                    <p className="text-foreground-secondary text-sm">No resume uploaded</p>
                  )}
                </div>

                {/* System Information */}
                <div className="p-4 rounded-lg bg-background/50 border">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    System Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <span className="text-foreground-secondary">Last Login:</span>{" "}
                        {formatDate(profile.systemInfo.lastLogin)}
                      </p>
                      <p>
                        <span className="text-foreground-secondary">Member Since:</span>{" "}
                        {formatDate(profile.systemInfo.memberSince)}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="text-foreground-secondary">User Type:</span> {profile.systemInfo.userType}
                      </p>
                      <p>
                        <span className="text-foreground-secondary">Status:</span>
                        <Badge variant={profile.systemInfo.isActive ? "default" : "secondary"} className="ml-2">
                          {profile.systemInfo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Profile