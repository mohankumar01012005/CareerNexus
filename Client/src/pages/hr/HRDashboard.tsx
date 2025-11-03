"use client"

// HR Dashboard with Executive-Level Analytics and Professional Design

import type React from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  UserCheck,
  Clock,
  Target,
  BarChart3,
  Award,
  Filter,
  Download,
  UserPlus,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const HRDashboard: React.FC = () => {
  const { getAllEmployees } = useAuth()
  const employees = getAllEmployees()
  const navigate = useNavigate()

  const kpiData = {
    totalEmployees: employees.length,
    internalHires: Math.floor(employees.length * 0.68), // 68% internal hire rate
    attritionRisk: Math.floor(employees.length * 0.18), // 18% at risk
    openJobs: 42,
    avgTimeToFill: 28,
    skillsGapScore: 76,
  }

  const departmentData = employees.reduce(
    (acc, emp) => {
      const existing = acc.find((d: { name: any }) => d.name === emp.department)
      if (existing) {
        existing.employees += 1
      } else {
        acc.push({
          name: emp.department,
          employees: 1,
          openJobs: Math.floor(Math.random() * 10) + 2, // Mock open jobs
          attritionRisk: Math.floor(Math.random() * 20) + 5, // Mock risk
        })
      }
      return acc
    },
    [] as Array<{ name: string; employees: number; openJobs: number; attritionRisk: number }>,
  )

  const topSkillGaps = [
    { skill: "Leadership", gap: 45, priority: "high" },
    { skill: "Data Analysis", gap: 38, priority: "high" },
    { skill: "Product Strategy", gap: 32, priority: "medium" },
    { skill: "AI/ML", gap: 28, priority: "medium" },
    { skill: "Cloud Architecture", gap: 25, priority: "low" },
  ]

  const recentActivities = [
    { type: "hire", message: "Sarah Chen joined as Senior UX Designer", time: "2 hours ago", department: "Design" },
    { type: "promotion", message: "John Doe promoted to Tech Lead", time: "4 hours ago", department: "Engineering" },
    {
      type: "application",
      message: "5 new internal applications for Product Manager role",
      time: "6 hours ago",
      department: "Product",
    },
    { type: "training", message: "Leadership cohort completed Q1 training", time: "1 day ago", department: "All" },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-400/10 border-red-400/30"
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
      case "low":
        return "text-green-400 bg-green-400/10 border-green-400/30"
      default:
        return "text-blue-400 bg-blue-400/10 border-blue-400/30"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "hire":
        return <UserCheck className="w-4 h-4 text-neon-green" />
      case "promotion":
        return <TrendingUp className="w-4 h-4 text-neon-purple" />
      case "application":
        return <Briefcase className="w-4 h-4 text-neon-teal" />
      case "training":
        return <Award className="w-4 h-4 text-neon-blue" />
      default:
        return <Users className="w-4 h-4 text-foreground-secondary" />
    }
  }

  // Navigation handlers
  const handleAddEmployee = () => {
    navigate("/hr/employees")
  }

  const handlePostInternalJob = () => {
    navigate("/hr/jobs")
  }

  const handleReviewApprovals = () => {
    navigate("/hr/approvals")
  }

  const handleGenerateReport = () => {
    navigate("/hr/analytics")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space text-gradient-primary">HR Analytics Hub</h1>
          <p className="text-foreground-secondary mt-1">Real-time insights into your talent ecosystem</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="glass-button bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="btn-gradient-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Total Employees</p>
                <p className="text-2xl font-bold text-gradient-primary">{kpiData.totalEmployees.toLocaleString()}</p>
                <p className="text-xs text-neon-green mt-1">+12% from last quarter</p>
              </div>
              <Users className="w-8 h-8 text-neon-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Internal Hires</p>
                <p className="text-2xl font-bold text-gradient-primary">{kpiData.internalHires}</p>
                <p className="text-xs text-neon-green mt-1">68% of total hires</p>
              </div>
              <UserCheck className="w-8 h-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Attrition Risk</p>
                <p className="text-2xl font-bold text-gradient-primary">{kpiData.attritionRisk}</p>
                <p className="text-xs text-red-400 mt-1">Requires attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-neon-orange" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card tilt-3d">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-secondary">Open Positions</p>
                <p className="text-2xl font-bold text-gradient-primary">{kpiData.openJobs}</p>
                <p className="text-xs text-neon-teal mt-1">Avg {kpiData.avgTimeToFill} days to fill</p>
              </div>
              <Briefcase className="w-8 h-8 text-neon-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview & Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-neon-teal" />
              <span>Department Overview</span>
            </CardTitle>
            <CardDescription>Team sizes, open positions, and attrition risk by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentData.map((dept: { name: boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.Key | null | undefined; employees: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; openJobs: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; attritionRisk: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined }, index: number) => (
              <div
                key={typeof dept.name === "string" || typeof dept.name === "number" ? dept.name : `dept-${index}`}
                className="p-4 glass-card border-border/30 tilt-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{String(dept.name ?? "")}</h4>
                  <Badge variant="outline" className="text-xs">
                    {dept.employees} employees
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground-secondary">Open Jobs</p>
                    <p className="font-semibold text-neon-teal">{dept.openJobs}</p>
                  </div>
                  <div>
                    <p className="text-foreground-secondary">At Risk</p>
                    <p className={`font-semibold ${
                      typeof dept.attritionRisk === "number" && dept.attritionRisk > 15
                        ? "text-red-400"
                        : "text-neon-green"
                    }`}>
                      {typeof dept.attritionRisk === "number" ? dept.attritionRisk : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Skill Gaps */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-neon-purple" />
              <span>Critical Skill Gaps</span>
            </CardTitle>
            <CardDescription>Skills with the highest demand across your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSkillGaps.map((skill, index) => (
              <div
                key={skill.skill}
                className="p-4 glass-card border-border/30 tilt-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{skill.skill}</h4>
                  <Badge className={`text-xs ${getPriorityColor(skill.priority)} border`}>
                    {skill.priority} priority
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Gap Score</span>
                    <span className="font-semibold">{skill.gap}%</span>
                  </div>
                  <Progress value={skill.gap} className="h-2" />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full glass-button bg-transparent">
              <Target className="w-4 h-4 mr-2" />
              View Detailed Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-neon-blue" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates across your talent pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 glass-card border-border/30 tilt-3d"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-foreground-secondary">{activity.time}</p>
                    <Badge variant="outline" className="text-xs">
                      {activity.department}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="btn-gradient-primary w-full justify-start"
              onClick={handleAddEmployee}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Employee
            </Button>
            <Button 
              className="glass-button w-full justify-start"
              onClick={handlePostInternalJob}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Post Internal Job
            </Button>
            <Button 
              className="glass-button w-full justify-start"
              onClick={handleGenerateReport}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button 
              className="glass-button w-full justify-start"
              onClick={handleReviewApprovals}
            >
              <Award className="w-4 h-4 mr-2" />
              Review Approvals
            </Button>
            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-foreground-secondary mb-2">System Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                <span className="text-xs">All systems operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default HRDashboard