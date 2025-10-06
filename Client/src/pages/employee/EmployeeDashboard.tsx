"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Target, TrendingUp, BookOpen, Users, Zap, Award, MessageCircle, Compass, Star } from "lucide-react"
import type { Employee } from "../../types/auth"
import { updateEmployeeResume, getEmployeeResumeData } from "../../utils/api"
import EmployeeUpload from "../../components/employee-upload"
import AICareerChat from "../../components/ai/ai-career-chat"

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
  // ... other resume fields
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

  // Mock recommendations data
  const recommendations = [
    {
      type: "job",
      title: "Senior Product Manager",
      match: 78,
      department: "Product",
      icon: "🎯",
    },
    {
      type: "course",
      title: "Advanced Leadership Skills",
      match: 92,
      provider: "LinkedIn Learning",
      icon: "👑",
    },
    {
      type: "mentor",
      title: "Connect with Sarah Kim",
      match: 85,
      role: "VP of Product",
      icon: "🤝",
    },
  ]

  const getSkillColor = (level: number) => {
    if (level >= 80) return "text-neon-green"
    if (level >= 60) return "text-neon-teal"
    if (level >= 40) return "text-neon-blue"
    return "text-neon-orange"
  }

  const getSkillBackground = (level: number) => {
    if (level >= 80) return "from-neon-green/20 to-neon-green/5"
    if (level >= 60) return "from-neon-teal/20 to-neon-teal/5"
    if (level >= 40) return "from-neon-blue/20 to-neon-blue/5"
    return "from-neon-orange/20 to-neon-orange/5"
  }

  // Determine which skills to display - prioritize resume skills, fallback to user skills
  const displaySkills = resumeSkills.length > 0 ? resumeSkills : user.skills
  const skillsSource = resumeSkills.length > 0 ? "resume" : "profile"

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
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

      {/* Skills Overview */}
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-neon-teal flex-shrink-0" />
              <span>Your Skill Arsenal</span>
            </div>
            {skillsSource === "resume" && (
              <Badge variant="outline" className="text-xs bg-neon-teal/10 text-neon-teal border-neon-teal/20">
                From Resume
              </Badge>
            )}
            {skillsSource === "profile" && (
              <Badge variant="outline" className="text-xs bg-neon-blue/10 text-neon-blue border-neon-blue/20">
                From Profile
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {skillsSource === "resume" 
              ? "Technical skills extracted from your resume" 
              : "Track your expertise across different domains"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingResume ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-teal mx-auto"></div>
              <p className="text-foreground-secondary mt-2">Loading skills from resume...</p>
            </div>
          ) : displaySkills.length === 0 ? (
            <div className="text-center py-8 glass-card border-border/30">
              <Zap className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Skills Found</h3>
              <p className="text-foreground-secondary mb-4">
                {credentials ? 
                  "Upload your resume to automatically extract technical skills, or add skills manually." :
                  "Please log in to view your skills."
                }
              </p>
              <Button className="glass-button">
                <Zap className="w-4 h-4 mr-2" />
                Add Your First Skill
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displaySkills.map((skill, index) => (
                <div
                  key={skill.id}
                  className={`p-4 rounded-xl bg-gradient-to-br ${getSkillBackground(skill.level)} border border-border/50 tilt-3d`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-center space-y-2">
                    <div className="text-2xl">{skill.icon}</div>
                    <h3 className="font-semibold text-sm truncate" title={skill.name}>{skill.name}</h3>
                    <div className={`text-lg font-bold ${getSkillColor(skill.level)}`}>{skill.level}%</div>
                    <Progress value={skill.level} className="h-2 bg-background/50" />
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

      {/* Career Goals & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Goals */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-neon-purple flex-shrink-0" />
              <span>Career Aspirations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.careerGoals.map((goal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 glass-card border-border/30 tilt-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Star className="w-4 h-4 text-neon-teal flex-shrink-0" />
                  <span className="font-medium truncate">{goal}</span>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                  Target
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full glass-button bg-transparent">
              <Target className="w-4 h-4 mr-2" />
              Add New Goal
            </Button>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-neon-orange flex-shrink-0" />
              <span>AI Recommendations</span>
            </CardTitle>
            <CardDescription>Personalized opportunities for your growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 glass-card border-border/30 tilt-3d hover:scale-[1.02] transition-transform cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">{rec.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm truncate">{rec.title}</h4>
                      <p className="text-xs text-foreground-secondary truncate">
                        {"department" in rec
                          ? rec.department
                          : "provider" in rec
                            ? rec.provider
                            : "role" in rec
                              ? rec.role
                              : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs flex-shrink-0 ${rec.match >= 85 ? "border-neon-green text-neon-green" : "border-neon-teal text-neon-teal"}`}
                  >
                    {rec.match}% match
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="btn-gradient-primary flex-1">
                    {rec.type === "job" ? "Apply" : rec.type === "course" ? "Enroll" : "Connect"}
                  </Button>
                  <Button size="sm" variant="outline" className="glass-button bg-transparent">
                    Details
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full glass-button bg-transparent">
              <BookOpen className="w-4 h-4 mr-2" />
              View All Recommendations
            </Button>
          </CardContent>
        </Card>
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
          <div className="text-xl font-bold text-gradient-primary">3</div>
          <div className="text-xs text-foreground-secondary">Achievements</div>
        </Card>
      </div>
      
      {/* Render the AI chat modal */}
      <AICareerChat open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  )
}

export default EmployeeDashboard