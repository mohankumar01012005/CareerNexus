"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Target, TrendingUp, BookOpen, Users, Zap, Award, MessageCircle, Compass, Plus } from "lucide-react"
import type { Employee } from "../../types/auth"
import { updateEmployeeResume, getEmployeeResumeData } from "../../utils/api"
import EmployeeUpload from "../../components/employee-upload"
import AICareerChat from "../../components/ai/ai-career-chat"
import CareerGoals from "./CareerGoals"
import CareerRecommendations from "./CareerRecommendations"
import SkillArena from "./SkillArena"

interface ResumeSkill {
  id: string
  name: string
  level: number
  category: string
  icon: string
}

interface ResumeData {
  skills?: {
    technical: string[]
    soft: string[]
    tools: string[]
    domains: string[]
  }
  name?: string
  email?: string
}

const EmployeeDashboard: React.FC = () => {
  const { user, credentials } = useAuth() as unknown as {
    user: Employee
    credentials: { email: string; password: string } | null
  }
  const [chatOpen, setChatOpen] = useState(false)
  const [resumeSkills, setResumeSkills] = useState<ResumeSkill[]>([])
  const [isLoadingResume, setIsLoadingResume] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Fetch resume data and extract technical skills
  const fetchResumeSkills = async () => {
    if (!credentials?.email || !credentials?.password) {
      console.log("No credentials available for fetching resume data")
      setIsLoadingResume(false)
      return
    }

    try {
      console.log("Fetching resume data for skills...")
      const response = await getEmployeeResumeData({
        email: credentials.email,
        password: credentials.password,
      })

      console.log("Resume data for skills:", response)

      if (response.success && response.resume_data && response.resume_data.length > 0) {
        const latestResume = response.resume_data[0] as ResumeData
        
        if (latestResume.skills?.technical && latestResume.skills.technical.length > 0) {
          // Convert technical skills string array to ResumeSkill format
          const technicalSkills: ResumeSkill[] = latestResume.skills.technical.map((skill, index) => ({
            id: `resume_skill_${index}`,
            name: skill,
            level: 70, // Default proficiency level for resume skills
            category: "Technical",
            icon: getSkillIcon(skill),
          }))
          
          setResumeSkills(technicalSkills)
          console.log(`Loaded ${technicalSkills.length} technical skills from resume`)
        } else {
          console.log("No technical skills found in resume data")
          setResumeSkills([])
        }
      } else {
        console.log("No resume data available")
        setResumeSkills([])
      }
    } catch (error) {
      console.error("Failed to fetch resume data for skills:", error)
      setResumeSkills([])
    } finally {
      setIsLoadingResume(false)
    }
  }

  useEffect(() => {
    fetchResumeSkills()
  }, [credentials, lastUpdate])

  // Helper function to get appropriate icons for skills
  const getSkillIcon = (skillName: string): string => {
    const skill = skillName.toLowerCase()
    
    if (skill.includes('react') || skill.includes('angular') || skill.includes('vue')) return "⚛️"
    if (skill.includes('node') || skill.includes('express')) return "🟢"
    if (skill.includes('python')) return "🐍"
    if (skill.includes('java')) return "☕"
    if (skill.includes('javascript')) return "📜"
    if (skill.includes('typescript')) return "🔷"
    if (skill.includes('sql') || skill.includes('database')) return "🗄️"
    if (skill.includes('aws') || skill.includes('azure') || skill.includes('cloud')) return "☁️"
    if (skill.includes('docker') || skill.includes('kubernetes')) return "🐳"
    if (skill.includes('git')) return "📚"
    if (skill.includes('html')) return "🌐"
    if (skill.includes('css')) return "🎨"
    if (skill.includes('ai') || skill.includes('ml') || skill.includes('machine learning')) return "🤖"
    
    return "⚙️" // Default icon for technical skills
  }

  const handleUploadComplete = async (result: any) => {
    try {
      console.log("[v0] File upload completed in dashboard:", result)
      
      // Trigger refresh of resume skills after upload
      setLastUpdate(Date.now())
      
      // Show success message or handle as needed
      if (result?.success) {
        console.log("[v0] Upload completed successfully, skills will refresh automatically")
      }
    } catch (e) {
      console.error("[v0] Error handling upload completion:", e)
    }
  }

  // Determine which skills to display - prioritize resume skills, fallback to user skills
  const displaySkills = resumeSkills.length > 0 ? resumeSkills : user.skills
  const skillsSource = resumeSkills.length > 0 ? "resume" : "profile"

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full">
      {/* Welcome Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="glass-card tilt-3d lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 ring-4 ring-primary/20 flex-shrink-0">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-primary text-white text-xl">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-2xl font-space truncate">Welcome back, {user.name.split(" ")[0]}! 👋</CardTitle>
                <CardDescription className="text-lg truncate">
                  {user.currentRole} • {user.department}
                </CardDescription>
                <div className="flex items-center mt-2 space-x-2 flex-wrap">
                  <Badge variant="outline">
                    Member since {new Date(user.joinDate).getFullYear()}
                  </Badge>
                  {resumeSkills.length > 0 && (
                    <Badge className="bg-neon-teal/20 text-neon-teal border-neon-teal/30">
                      Resume Skills Loaded
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-3">
              <EmployeeUpload
                onUploadComplete={handleUploadComplete}
                acceptedFileTypes=".pdf,.doc,.docx,.txt"
                maxFileSize={10}
              />
              <Button className="glass-button h-12 justify-start" onClick={() => setChatOpen(true)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                AI Career Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Readiness Score */}
        <Card className="glass-card tilt-3d">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Career Readiness</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-teal to-neon-purple p-1">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gradient-primary">{user.readinessScore}%</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground-secondary">Your promotion readiness score</p>
              <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                <Compass className="w-4 h-4 mr-1" />
                View Path
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Overview - Using the new SkillArena component */}
      <SkillArena
        displaySkills={displaySkills}
        isLoadingResume={isLoadingResume}
        skillsSource={skillsSource}
        credentials={credentials}
      />

      {/* Career Goals & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Goals Component */}
        <CareerGoals />

        {/* AI Recommendations Component */}
        <CareerRecommendations />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card text-center p-4 tilt-3d">
          <TrendingUp className="w-8 h-8 text-neon-teal mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">{displaySkills.length}</div>
          <div className="text-xs text-foreground-secondary">Skills Tracked</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <BookOpen className="w-8 h-8 text-neon-purple mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">12</div>
          <div className="text-xs text-foreground-secondary">Courses Available</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <Users className="w-8 h-8 text-neon-blue mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">8</div>
          <div className="text-xs text-foreground-secondary">Open Positions</div>
        </Card>
        <Card className="glass-card text-center p-4 tilt-3d">
          <Award className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <div className="text-xl font-bold text-gradient-primary">0</div>
          <div className="text-xs text-foreground-secondary">Career Goals</div>
        </Card>
      </div>
      
      {/* Render the AI chat modal */}
      <AICareerChat open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  )
}

export default EmployeeDashboard