"use client"

// Authentication Context with Mock Data and State Management

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"
import type {
  AuthState,
  Employee,
  HRUser,
  LoginCredentials,
  EmployeeSignupData,
  CreateEmployeeData,
} from "@/types/auth"

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials, userType: "employee" | "hr") => Promise<boolean>
  signup: (data: EmployeeSignupData) => Promise<boolean>
  logout: () => void
  createEmployee: (data: CreateEmployeeData) => Promise<boolean>
  getAllEmployees: () => Employee[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock HR User
const mockHRUser: HRUser = {
  id: "hr-1",
  email: "hr@company.com",
  name: "Sarah Chen",
  role: "hr",
}

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
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (userType === "hr") {
      // HR Login - Fixed credentials
      if (credentials.email === "hr@company.com" && credentials.password === "admin123") {
        setAuthState({
          isAuthenticated: true,
          userType: "hr",
          user: mockHRUser,
        })
        return true
      }
      return false
    } else {
      const employee = mockEmployees.find(
        (emp) => emp.email === credentials.email && emp.password === credentials.password,
      )
      if (employee) {
        setAuthState({
          isAuthenticated: true,
          userType: "employee",
          user: employee,
        })
        return true
      }
      return false
    }
  }

  const signup = async (data: EmployeeSignupData): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if email already exists
    const existingEmployee = mockEmployees.find((emp) => emp.email === data.email)
    if (existingEmployee) {
      return false
    }

    // Create new employee (mock)
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      email: data.email,
      name: data.name,
      password: data.password,
      currentRole: "New Employee",
      department: "Unassigned",
      readinessScore: 0,
      joinDate: new Date().toISOString().split("T")[0],
      careerGoals: [],
      skills: [],
    }

    mockEmployees.push(newEmployee)

    setAuthState({
      isAuthenticated: true,
      userType: "employee",
      user: newEmployee,
    })

    return true
  }

  const createEmployee = async (data: CreateEmployeeData): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if email already exists
    const existingEmployee = mockEmployees.find((emp) => emp.email === data.email)
    if (existingEmployee) {
      return false
    }

    // Create new employee
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      email: data.email,
      name: data.name,
      password: data.password,
      currentRole: data.role,
      department: data.department,
      readinessScore: 0,
      joinDate: data.joinDate,
      phone: data.phone,
      careerGoals: [],
      skills: data.skills
        ? data.skills.map((skill, index) => ({
            id: `s-${Date.now()}-${index}`,
            name: skill,
            level: 50, // Default level
            category: "General",
            icon: "🔧",
          }))
        : [],
    }

    mockEmployees.push(newEmployee)
    return true
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
