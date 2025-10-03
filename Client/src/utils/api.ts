// src/utils/api.ts

// API Utility Functions

import { API_CONFIG, HR_CREDENTIALS, createBasicAuthHeader, type ApiResponse } from "../config/api"

// Generic API request function
export const apiRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
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
    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.")
    }
    throw error
  }
}

// HR Authentication API
export const hrLogin = async (email: string, password: string) => {
  return apiRequest("/auth/hr/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// Employee Authentication API
export const employeeLogin = async (email: string, password: string) => {
  return apiRequest("/auth/employee/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// Create Employee API (HR only)
export const createEmployeeApi = async (employeeData: any) => {
  return apiRequest("/auth/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
    },
    body: JSON.stringify(employeeData),
  })
}

// Health Check API
export const healthCheck = async () => {
  return apiRequest("/health", {
    method: "GET",
  })
}

// Employee Dashboard API
export const getEmployeeDashboard = async (authToken?: string) => {
  return apiRequest("/employee/dashboard", {
    method: "GET",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  })
}

// Update Employee Resume API (via apiRequest)
export const updateEmployeeResume = async (params: {
  email: string
  password: string
  resumeLink: string
}) => {
  return apiRequest("/employee/resume", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      resumeLink: params.resumeLink,
    }),
  })
}

// Fetch Employee Resume Data API (using body-auth creds)
export const getEmployeeResumeData = async (params: { email: string; password: string }) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/get-resume-data`
  console.log("[v0][api] getEmployeeResumeData: request", {
    endpoint,
    hasEmail: !!params?.email,
    hasPassword: !!params?.password,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    console.log("[v0][api] getEmployeeResumeData: status", resp.status)

    let json: any = null
    try {
      json = await resp.json()
    } catch (e) {
      console.error("[v0][api] getEmployeeResumeData: failed to parse JSON", e)
      throw e
    }

    console.log("[v0][api] getEmployeeResumeData: response", json)
    return json
  } catch (e) {
    console.error("[v0][api] getEmployeeResumeData: error", e)
    throw e
  }
}

// ------------------------------------------------------------------
// Extra direct fetch-based APIs
// ------------------------------------------------------------------

export const API_BASE_URL = "http://localhost:5000/api"

type Creds = { email: string; password: string }

export async function updateEmployeeResumeDirect(
  params: Creds & { resumeLink?: string; publicUrl?: string; resume_data?: any; resumeData?: any },
) {
  const resp = await fetch(`${API_BASE_URL}/employee/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  return resp.json()
}

export async function updateEmployeeResumeData(params: Creds & { resumeData: any }) {
  const resp = await fetch(`${API_BASE_URL}/employee/resume-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  return resp.json()
}

// Fetch Employee Resume Parsed Data API for AI Career Chat
export const getEmployeeResumeParsedData = async (params: { email: string; password: string }) => {
  const resp = await fetch(`${API_CONFIG.BASE_URL}/employee/get-resume-parsed-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  return resp.json()
}
