"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import { Badge } from "../../components/ui/badge"
import { Zap, ChevronDown, ChevronUp } from "lucide-react"

interface ResumeSkill {
  id: string
  name: string
  level: number
  category: string
  icon: string
}

interface SkillArenaProps {
  displaySkills: ResumeSkill[]
  isLoadingResume: boolean
  skillsSource: string
  credentials: { email: string; password: string } | null
}

const SkillArena: React.FC<SkillArenaProps> = ({
  displaySkills,
  isLoadingResume,
  skillsSource,
  credentials
}) => {
  const [showAllSkills, setShowAllSkills] = useState(false)

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

  // Calculate skills for 2 rows (10 skills total - 5 per row)
  const skillsPerRow = 5
  const initialSkillsToShow = skillsPerRow * 2 // 10 skills for 2 rows
  const skillsToShow = showAllSkills ? displaySkills : displaySkills.slice(0, initialSkillsToShow)

  return (
    <Card className="glass-card">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {skillsToShow.map((skill, index) => (
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
            
            {/* Show View All / Show Less button if there are more than initial skills */}
            {displaySkills.length > initialSkillsToShow && (
              <div className="flex justify-center mt-6">
                <Button 
                  variant="outline" 
                  className="glass-button border-border/50"
                  onClick={() => setShowAllSkills(!showAllSkills)}
                >
                  {showAllSkills ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      View All Skills ({displaySkills.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SkillArena