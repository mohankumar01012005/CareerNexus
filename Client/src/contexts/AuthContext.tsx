"use client"

// Authentication Context with Backend API Integration

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"
import type {
  AuthState,
  Employee,
  HRUser,
  LoginCredentials,
  EmployeeSignupData,
  CreateEmployeeData,
} from "../types/auth"

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials, userType: "employee" | "hr") => Promise<boolean>
  signup: (data: EmployeeSignupData) => Promise<boolean>
  logout: () => void
  createEmployee: (data: CreateEmployeeData) => Promise<boolean>
  getAllEmployees: () => Employee[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api'

// Mock employees for frontend display (will be replaced with API calls later)
const mockEmployees: Employee[] = [
  {
    id: "emp-1",
    email: "john.doe@company.com",
    name: "John Doe",
    password: "password123",
    currentRole: "Software Developer",
    department: "Engineering",
    readinessScore: 75,
    joinDate: "2023-01-15",
    phone: "+1-555-0123",
    careerGoals: ["Senior Engineer", "Tech Lead", "Product Manager"],
    skills: [
      { id: "s1", name: "React", level: 85, category: "Frontend", icon: "⚛️" },
      { id: "s2", name: "TypeScript", level: 80, category: "Programming", icon: "📘" },
      { id: "s3", name: "Node.js", level: 70, category: "Backend", icon: "🟢" },
      { id: "s4", name: "Leadership", level: 45, category: "Soft Skills", icon: "👑" },
      { id: "s5", name: "Product Strategy", level: 30, category: "Business", icon: "📊" },
    ],
  },
  {
    id: "emp-2",
    email: "maria.garcia@company.com",
    name: "Maria Garcia",
    password: "password123",
    currentRole: "UX Designer",
    department: "Design",
    readinessScore: 88,
    joinDate: "2022-08-20",
    phone: "+1-555-0124",
    careerGoals: ["Senior Designer", "Design Manager", "Head of Design"],
    skills: [
      { id: "s6", name: "Figma", level: 95, category: "Design", icon: "🎨" },
      { id: "s7", name: "User Research", level: 85, category: "Research", icon: "🔍" },
      { id: "s8", name: "Prototyping", level: 90, category: "Design", icon: "⚡" },
      { id: "s9", name: "Team Management", level: 60, category: "Leadership", icon: "👥" },
    ],
  },
]

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userType: null,
    user: null,
  })

  const login = async (credentials: LoginCredentials, userType: "employee" | "hr"): Promise<boolean> => {
    try {
      const endpoint = userType === "hr" ? "/auth/hr/login" : "/auth/employee/login"
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success) {
        if (userType === "hr") {
          const hrUser: HRUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.profile?.fullName || "HR Manager",
            role: "hr",
          }
          
          setAuthState({
            isAuthenticated: true,
            userType: "hr",
            user: hrUser,
          })
        } else {
          // Transform backend employee data to frontend format
          const employee: Employee = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.profile?.fullName || "Employee",
            currentRole: data.user.profile?.role || "Employee",
            department: data.user.profile?.department || "General",
            readinessScore: data.user.profile?.careerReadinessScore || 0,
            joinDate: data.user.profile?.joiningDate ? new Date(data.user.profile.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            phone: data.user.profile?.phoneNumber || "",
            careerGoals: data.user.profile?.careerGoals?.map((goal: any) => goal.targetRole) || [],
            skills: data.user.profile?.skills?.map((skill: any, index: number) => ({
              id: `skill_${index}`,
              name: skill.name,
              level: skill.proficiency,
              category: skill.category,
              icon: getSkillIcon(skill.category),
            })) || [],
          }
          
          setAuthState({
            isAuthenticated: true,
            userType: "employee",
            user: employee,
          })
        }
        return true
      } else {
        console.error('Login failed:', data.message)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const signup = async (data: EmployeeSignupData): Promise<boolean> => {
    // Employee signup is not available - employees are created by HR
    console.log('Employee signup is not available. Employees are created by HR.')
    return false
  }

  const createEmployee = async (data: CreateEmployeeData): Promise<boolean> => {
    try {
      // Get HR credentials from environment or use default
      const hrEmail = "hr@company.com"
      const hrPassword = "admin123"
      
      // Create Basic Auth header
      const credentials = btoa(`${hrEmail}:${hrPassword}`)
      
      // Transform frontend data to backend format
      const backendData = {
        fullName: data.name,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone || "",
        department: data.department,
        role: data.role,
        joiningDate: data.joinDate,
        skills: data.skills?.map((skillName: any) => ({
          name: skillName,
          proficiency: 50, // Default proficiency
          category: "Frontend" // Default category
        })) || []
      }

      const response = await fetch(`${API_BASE_URL}/auth/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify(backendData),
      })

      const result = await response.json()

      if (result.success) {
        // Add to mock employees for frontend display
        const newEmployee: Employee = {
          id: result.employee.id,
          email: result.employee.email,
          name: result.employee.fullName,
          currentRole: result.employee.role,
          department: result.employee.department,
          readinessScore: 0,
          joinDate: data.joinDate,
          phone: data.phone || "",
          careerGoals: [],
          skills: result.employee.skills?.map((skill: any, index: number) => ({
            id: `skill_${index}`,
            name: skill.name,
            level: skill.proficiency,
            category: skill.category,
            icon: getSkillIcon(skill.category),
          })) || [],
        }
        
        mockEmployees.push(newEmployee)
        return true
      } else {
        console.error('Create employee failed:', result.message)
        return false
      }
    } catch (error) {
      console.error('Create employee error:', error)
      return false
    }
  }

  const getAllEmployees = (): Employee[] => {
    return [...mockEmployees]
  }

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      userType: null,
      user: null,
    })
  }

  // Helper function to get skill icons
  const getSkillIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'Frontend': '⚛️',
      'Backend': '🟢',
      'Leadership': '👑',
      'Business': '📊',
      'Design': '🎨',
      'Data': '📈',
      'DevOps': '⚙️',
      'Soft Skills': '🤝',
    }
    return iconMap[category] || '🔧'
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        createEmployee,
        getAllEmployees,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const getMockEmployees = () => [...mockEmployees]