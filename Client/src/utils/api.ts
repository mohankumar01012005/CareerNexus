// src/utils/api.ts

// API Utility Functions

import { API_CONFIG, HR_CREDENTIALS, createBasicAuthHeader, type ApiResponse } from '../config/api'

// Generic API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.')
    }
    throw error
  }
}

// HR Authentication API
export const hrLogin = async (email: string, password: string) => {
  return apiRequest('/auth/hr/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// Employee Authentication API
export const employeeLogin = async (email: string, password: string) => {
  return apiRequest('/auth/employee/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// Create Employee API (HR only)
export const createEmployeeApi = async (employeeData: any) => {
  return apiRequest('/auth/employees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
    },
    body: JSON.stringify(employeeData),
  })
}

// Health Check API
export const healthCheck = async () => {
  return apiRequest('/health', {
    method: 'GET',
  })
}

// Employee Dashboard API
export const getEmployeeDashboard = async (authToken?: string) => {
  return apiRequest('/employee/dashboard', {
    method: 'GET',
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
  })
}

// <CHANGE> add API to persist resume link to backend
export const updateEmployeeResume = async (params: {
  email: string
  password: string
  resumeLink: string
}) => {
  return apiRequest('/employee/resume', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      resumeLink: params.resumeLink,
    }),
  })
}