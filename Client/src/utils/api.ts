// src/utils/api.ts

// API Utility Functions

import { API_CONFIG, HR_CREDENTIALS, createBasicAuthHeader, type ApiResponse } from "../config/api"
import { supabase } from "../lib/supabase"

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
  // Map UI form keys -> backend schema
  const payload = {
    fullName: employeeData.fullName ?? employeeData.name,
    email: employeeData.email,
    password: employeeData.password,
    phoneNumber: employeeData.phoneNumber ?? employeeData.phone ?? "",
    department: employeeData.department,
    role: employeeData.role,
    joiningDate: employeeData.joiningDate ?? employeeData.joinDate,
    // Accept strings array and normalize to objects if needed
    skills: Array.isArray(employeeData.skills)
      ? employeeData.skills.map((s: any) =>
          typeof s === "string" ? { name: s, proficiency: 50, category: "Frontend" } : s,
        )
      : undefined,
  }

  return apiRequest("/auth/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
    },
    body: JSON.stringify(payload),
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

// Update Employee Resume API (via apiRequest) - USING NEW CREDENTIAL-BASED ENDPOINT
export const updateEmployeeResume = async (params: {
  email: string
  password: string
  resumeLink: string
}) => {
  return apiRequest("/employee/update-resume-link", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      resumeLink: params.resumeLink,
      resume_link: params.resumeLink,
      publicUrl: params.resumeLink,
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

export const API_BASE_URL = "https://skillcompassserver.vercel.app/api"

type Creds = { email: string; password: string }

export async function updateEmployeeResumeDirect(
  params: Creds & { resumeLink?: string; publicUrl?: string; resume_data?: any; resumeData?: any },
) {
  const resp = await fetch(`${API_CONFIG.BASE_URL}/employee/update-resume-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  return resp.json()
}

export async function updateEmployeeResumeData(params: Creds & { resumeData: any }) {
  console.log("[v0][api] updateEmployeeResumeData: Sending request with params:", {
    email: params.email,
    hasPassword: !!params.password,
    resumeDataKeys: Object.keys(params.resumeData || {}),
  })

  try {
    const resp = await fetch(`${API_CONFIG.BASE_URL}/employee/update-resume-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[v0][api] updateEmployeeResumeData: Response received:", result)
    return result
  } catch (error) {
    console.error("[v0][api] updateEmployeeResumeData: Request failed:", error)
    throw error
  }
}

// Fetch Employee Resume Parsed Data API for AI Career Chat
export const getEmployeeResumeParsedData = async (params: { email: string; password: string }) => {
  const resp = await fetch(`${API_CONFIG.BASE_URL}/employee/get-resume-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  return resp.json()
}

// NEW: Career Goals APIs
export const getEmployeeCareerGoals = async (params: { email: string; password: string }) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/get-career-goals`
  console.log("[v0][api] getEmployeeCareerGoals: request", {
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

    const result = await resp.json()
    console.log("[v0][api] getEmployeeCareerGoals: response", result)
    return result
  } catch (error) {
    console.error("[v0][api] getEmployeeCareerGoals: error", error)
    throw error
  }
}

export const addEmployeeCareerGoal = async (params: {
  email: string
  password: string
  targetRole: string
  priority?: string
  targetDate?: string
  skillsRequired?: string[]
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/add-career-goal`
  console.log("[v0][api] addEmployeeCareerGoal: request", {
    endpoint,
    hasEmail: !!params?.email,
    hasPassword: !!params?.password,
    targetRole: params.targetRole,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    const result = await resp.json()
    console.log("[v0][api] addEmployeeCareerGoal: response", result)
    return result
  } catch (error) {
    console.error("[v0][api] addEmployeeCareerGoal: error", error)
    throw error
  }
}

export const updateEmployeeCareerGoals = async (params: {
  email: string
  password: string
  careerGoals: any[]
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/update-career-goals`
  console.log("[v0][api] updateEmployeeCareerGoals: request", {
    endpoint,
    hasEmail: !!params?.email,
    hasPassword: !!params?.password,
    careerGoalsCount: params.careerGoals?.length || 0,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    const result = await resp.json()
    console.log("[v0][api] updateEmployeeCareerGoals: response", result)
    return result
  } catch (error) {
    console.error("[v0][api] updateEmployeeCareerGoals: error", error)
    throw error
  }
}
// Delete career goal by credentials
export const deleteCareerGoalByCredentials = async (params: {
  email: string
  password: string
  goalId: string
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/delete-career-goal`
  console.log("[v0][api] deleteCareerGoalByCredentials: request", {
    endpoint,
    hasEmail: !!params?.email,
    hasPassword: !!params?.password,
    goalId: params.goalId,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    const result = await resp.json()
    console.log("[v0][api] deleteCareerGoalByCredentials: response", result)
    return result
  } catch (error) {
    console.error("[v0][api] deleteCareerGoalByCredentials: error", error)
    throw error
  }
}
// HR APIs
export const getAllEmployeesHR = async () => {
  const endpoint = `${API_CONFIG.BASE_URL}/hr/employees`
  console.log("[HR][api] getAllEmployeesHR: request", { endpoint })

  try {
    const resp = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
      },
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[HR][api] getAllEmployeesHR: response", result)
    return result
  } catch (error) {
    console.error("[HR][api] getAllEmployeesHR: error", error)
    throw error
  }
}

export const getPendingCareerGoalsHR = async () => {
  const endpoint = `${API_CONFIG.BASE_URL}/hr/career-goals/pending`
  console.log("[HR][api] getPendingCareerGoalsHR: request", { endpoint })

  try {
    const resp = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
      },
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[HR][api] getPendingCareerGoalsHR: response", result)
    return result
  } catch (error) {
    console.error("[HR][api] getPendingCareerGoalsHR: error", error)
    throw error
  }
}

export const updateCareerGoalStatusHR = async (params: {
  employeeId: string
  goalId: string
  status: "approved" | "rejected"
  reviewNotes?: string
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/hr/career-goals/status`
  console.log("[HR][api] updateCareerGoalStatusHR: request", { endpoint, params })

  try {
    const resp = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
      },
      body: JSON.stringify(params),
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[HR][api] updateCareerGoalStatusHR: response", result)
    return result
  } catch (error) {
    console.error("[HR][api] updateCareerGoalStatusHR: error", error)
    throw error
  }
}

export const getCareerGoalsStatsHR = async () => {
  const endpoint = `${API_CONFIG.BASE_URL}/hr/career-goals/stats`
  console.log("[HR][api] getCareerGoalsStatsHR: request", { endpoint })

  try {
    const resp = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
      },
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[HR][api] getCareerGoalsStatsHR: response", result)
    return result
  } catch (error) {
    console.error("[HR][api] getCareerGoalsStatsHR: error", error)
    throw error
  }
}

// Course Management APIs
export const saveCourseApi = async (params: {
  email: string
  password: string
  course: any
}) => {
  const endpoint = `https://skillcompassserver.vercel.app/api/employee/save-course`
  console.log("[api] saveCourseApi: request", {
    endpoint,
    email: params.email,
    courseTitle: params.course.title,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    const result = await resp.json()
    console.log("[api] saveCourseApi: response", result)
    return result
  } catch (error) {
    console.error("[api] saveCourseApi: error", error)
    throw error
  }
}

export const getSavedCoursesApi = async (params: {
  email: string
  password: string
}) => {
  const endpoint = `https://skillcompassserver.vercel.app/api/employee/my-saved-courses`
  console.log("[api] getSavedCoursesApi: request", {
    endpoint,
    email: params.email,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    const result = await resp.json()
    console.log("[api] getSavedCoursesApi: response", result)
    return result
  } catch (error) {
    console.error("[api] getSavedCoursesApi: error", error)
    throw error
  }
}

export const completeCourseApi = async (params: {
  email: string
  password: string
  courseId: string
  proof: { file?: string; link?: string }
}) => {
  const endpoint = `https://skillcompassserver.vercel.app/api/employee/complete-course`
  console.log("[api] completeCourseApi: request", {
    endpoint,
    email: params.email,
    courseId: params.courseId,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    const result = await resp.json()
    console.log("[api] completeCourseApi: response", result)
    return result
  } catch (error) {
    console.error("[api] completeCourseApi: error", error)
    throw error
  }
}

export const deleteCourseApi = async (params: {
  email: string
  password: string
  courseId: string
}) => {
  const endpoint = `https://skillcompassserver.vercel.app/api/employee/delete-course`
  console.log("[api] deleteCourseApi: request", {
    endpoint,
    email: params.email,
    courseId: params.courseId,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    const result = await resp.json()
    console.log("[api] deleteCourseApi: response", result)
    return result
  } catch (error) {
    console.error("[api] deleteCourseApi: error", error)
    throw error
  }
}

// HR Course Management APIs
export const getEmployeeSavedCoursesHR = async (employeeEmail: string) => {
  const endpoint = `https://skillcompassserver.vercel.app/api/hr/get-saved-courses`
  console.log("[HR][api] getEmployeeSavedCoursesHR: request", {
    endpoint,
    employeeEmail,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
      },
      body: JSON.stringify({ employeeEmail }),
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[HR][api] getEmployeeSavedCoursesHR: response", result)
    return result
  } catch (error) {
    console.error("[HR][api] getEmployeeSavedCoursesHR: error", error)
    throw error
  }
}

// Certificate Upload Function (similar to resume upload)
export const uploadCertificate = async (file: File, bucket = "SkillCompass") => {
  console.log("[api] Starting certificate upload process...", {
    fileName: file.name,
    fileSize: file.size,
    bucket,
  })

  try {
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `certificate_${timestamp}.${fileExtension}`

    console.log("[api] Generated certificate filename:", fileName)

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    })

    if (error) {
      console.error("[api] Certificate upload error:", error)
      throw error
    }

    console.log("[api] Certificate uploaded successfully:", data)

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
    console.log("[api] Certificate public URL generated:", publicUrlData.publicUrl)

    return {
      success: true,
      fileName,
      publicUrl: publicUrlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error("[api] Certificate upload failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// utils/api.ts (add these functions)

// HR: Get pending course completions
export const getPendingCourseCompletions = async (): Promise<{
  success: boolean
  pendingCompletions: any[]
  count: number
}> => {
  try {
    const response = await fetch("/api/hr/pending-course-completions", {
      headers: {
        Authorization: `Basic ${btoa(`${process.env.HR_EMAIL}:${process.env.HR_PASSWORD}`)}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch pending course completions")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching pending course completions:", error)
    return { success: false, pendingCompletions: [], count: 0 }
  }
}

// HR: Update course completion status
export const updateCourseCompletionStatus = async (data: {
  courseId: string
  employeeId: string
  status: "completed" | "active"
  notes?: string
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch("/api/hr/update-course-status", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${process.env.HR_EMAIL}:${process.env.HR_PASSWORD}`)}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update course status")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating course status:", error)
    return { success: false, message: "Failed to update course status" }
  }
}

export { HR_CREDENTIALS, createBasicAuthHeader }

// Employee Job APIs
export const getActiveJobsForEmployee = async (params: {
  email: string
  password: string
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/jobs/active-jobs`
  console.log("[api] getActiveJobsForEmployee: request", {
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

    const result = await resp.json()
    console.log("[api] getActiveJobsForEmployee: response", result)
    return result
  } catch (error) {
    console.error("[api] getActiveJobsForEmployee: error", error)
    throw error
  }
}

export const submitJobSwitchRequest = async (params: {
  email: string
  password: string
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/jobs/job-switch-request`
  console.log("[api] submitJobSwitchRequest: request", {
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

    const result = await resp.json()
    console.log("[api] submitJobSwitchRequest: response", result)
    return result
  } catch (error) {
    console.error("[api] submitJobSwitchRequest: error", error)
    throw error
  }
}
// Add to api.ts file in the HR APIs section

// HR Job Switch Request APIs
export const updateJobSwitchRequestStatusHR = async (params: {
  requestId: string
  status: "approved" | "rejected"
  rejectionReason?: string
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/hr/job-management/job-switch-requests/status`
  console.log("[HR][api] updateJobSwitchRequestStatusHR: request", { endpoint, params })

  try {
    const resp = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createBasicAuthHeader(HR_CREDENTIALS.EMAIL, HR_CREDENTIALS.PASSWORD),
      },
      body: JSON.stringify(params),
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[HR][api] updateJobSwitchRequestStatusHR: response", result)
    return result
  } catch (error) {
    console.error("[HR][api] updateJobSwitchRequestStatusHR: error", error)
    throw error
  }
}

// Employee Job Application API
export const applyForJobApi = async (params: {
  email: string
  password: string
  jobId: string
  resumeType: "current" | "updated"
  updatedResume?: string
}) => {
  const endpoint = `${API_CONFIG.BASE_URL}/employee/jobs/${params.jobId}/apply`
  console.log("[api] applyForJobApi: request", {
    endpoint,
    hasEmail: !!params?.email,
    hasPassword: !!params?.password,
    jobId: params.jobId,
    resumeType: params.resumeType,
  })

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[api] applyForJobApi: response", result)
    return result
  } catch (error) {
    console.error("[api] applyForJobApi: error", error)
    throw error
  }
}

// Add to utils/api.ts
export const getEmployeeProfile = async (params: { email: string; password: string }) => {
  const endpoint = `https://skillcompassserver.vercel.app/api/employee/get-profile`
  console.log("[api] getEmployeeProfile: request", {
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

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`)
    }

    const result = await resp.json()
    console.log("[api] getEmployeeProfile: response", result)
    return result
  } catch (error) {
    console.error("[api] getEmployeeProfile: error", error)
    throw error
  }
}

export const updateEmployeeProfile = async (params: {
  email: string
  password: string
  updates: {
    phoneNumber?: string
    avatar?: string
    skills?: any[]
  }
}) => {
  const endpoint = `https://skillcompassserver.vercel.app/api/employee/update-profile`
  console.log("[api] updateEmployeeProfile: request", {
    endpoint,
    hasEmail: !!params?.email,
    hasPassword: !!params?.password,
    updates: params.updates,
  })

  try {
    const updatePayload: any = {
      email: params.email,
      password: params.password,
      updates: {},
    }

    // Only include fields that are explicitly provided
    if (params.updates.phoneNumber !== undefined) {
      updatePayload.updates.phoneNumber = params.updates.phoneNumber
    }
    if (params.updates.avatar !== undefined) {
      updatePayload.updates.avatar = params.updates.avatar
    }
    // Only include skills if they are provided and valid
    if (params.updates.skills && Array.isArray(params.updates.skills) && params.updates.skills.length > 0) {
      updatePayload.updates.skills = params.updates.skills
    }

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    })

    if (!resp.ok) {
      let errorMessage = `HTTP error! status: ${resp.status}`
      try {
        const errorData = await resp.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // If response is not JSON, use default error message
      }
      throw new Error(errorMessage)
    }

    const result = await resp.json()
    console.log("[api] updateEmployeeProfile: response", result)
    return result
  } catch (error) {
    console.error("[api] updateEmployeeProfile: error", error)
    throw error
  }
}
