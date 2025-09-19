// Authentication and User Type Definitions

export interface Employee {
  id: string
  email: string
  name: string
  avatar?: string
  skills: Skill[]
  careerGoals: string[]
  currentRole: string
  department: string
  readinessScore: number
  joinDate: string
  phone?: string
  password?: string // For HR to set initial password
}

export interface Skill {
  id: string
  name: string
  level: number // 0-100
  category: string
  icon: string
}

export interface Job {
  id: string
  title: string
  department: string
  requiredSkills: string[]
  description: string
  postedDate: string
  isInternal: boolean
  matchedEmployees?: EmployeeMatch[]
}

export interface EmployeeMatch {
  employeeId: string
  employee: Employee
  matchPercentage: number
  matchReasons: string[]
  status: "pending" | "approved" | "rejected"
}

export interface AuthState {
  isAuthenticated: boolean
  userType: "employee" | "hr" | null
  user: Employee | HRUser | null
}

export interface HRUser {
  id: string
  email: string
  name: string
  role: "hr"
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface EmployeeSignupData extends LoginCredentials {
  name: string
}

export interface CreateEmployeeData {
  name: string
  email: string
  password: string
  department: string
  role: string
  joinDate: string
  phone?: string
  skills?: string[]
}

// Dashboard Data Types
export interface DashboardMetrics {
  totalEmployees: number
  internalHires: number
  attritionRisk: number
  openJobs: number
  skillGaps: SkillGap[]
}

export interface SkillGap {
  skill: string
  currentLevel: number
  requiredLevel: number
  employeesAffected: number
}

export interface Recommendation {
  id: string
  type: "job" | "course" | "mentor" | "project"
  title: string
  description: string
  matchPercentage: number
  icon: string
  reasons: string[]
  actionUrl?: string
}

export interface Notification {
  id: string
  type: "mentor" | "application" | "training" | "system"
  title: string
  message: string
  timestamp: string
  read: boolean
  actionRequired?: boolean
}

export interface CareerPath {
  current: string
  target: string
  steps: CareerStep[]
  timeEstimate: string
  readinessScore: number
}

export interface CareerStep {
  id: string
  title: string
  description: string
  skillsNeeded: string[]
  estimatedTime: string
  completed: boolean
}
