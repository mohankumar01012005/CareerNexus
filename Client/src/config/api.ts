/// <reference types="vite/client" />

// Extend ImportMetaEnv for our custom variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_HR_EMAIL: string
  readonly VITE_HR_PASSWORD: string
  // add more variables if needed later
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// API Configuration and Helper Functions
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000, // 10 seconds
}

export const HR_CREDENTIALS = {
  EMAIL: import.meta.env.VITE_HR_EMAIL || 'hr@company.com',
  PASSWORD: import.meta.env.VITE_HR_PASSWORD || 'admin123',
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  user?: T
  employee?: T
}

// API Error Handler
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Create Basic Auth Header
export const createBasicAuthHeader = (email: string, password: string): string => {
  return `Basic ${btoa(`${email}:${password}`)}`
}

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  HR_LOGIN: '/auth/hr/login',
  EMPLOYEE_LOGIN: '/auth/employee/login',
  CREATE_EMPLOYEE: '/auth/employees',
  EMPLOYEE_DASHBOARD: '/employee/dashboard',
  UPDATE_SKILLS: '/employee/skills',
  ADD_CAREER_GOAL: '/employee/career-goals',
} as const
