import type { ResumeAnalysis } from "./../types/resume"

console.log("[v0] Environment variable debug:")
console.log("[v0] import.meta.env:", import.meta.env)
console.log("[v0] VITE_GEMINIAI_API_KEY:", import.meta.env.VITE_GEMINIAI_API_KEY)

const GEMINI_KEY = import.meta.env.VITE_GEMINIAI_API_KEY

type GoogleGenerativeAIType = any

async function getModel() {
  // Lazy import to avoid bundling overhead until needed
  const { GoogleGenerativeAI } = (await import("@google/generative-ai")) as {
    GoogleGenerativeAI: new (key: string) => GoogleGenerativeAIType
  }

  console.log("[v0] Environment variable check:")
  console.log("[v0] GEMINI_KEY value:", GEMINI_KEY ? "✓ Present" : "✗ Missing")
  console.log("[v0] GEMINI_KEY length:", GEMINI_KEY?.length || 0)

  if (!GEMINI_KEY) {
    console.error("[v0] Missing VITE_GEMINIAI_API_KEY environment variable")
    throw new Error(
      "Missing VITE_GEMINIAI_API_KEY environment variable. Please add it to your .env file with VITE_ prefix.",
    )
  }
  console.log("[v0] Initializing Gemini AI with API key:", GEMINI_KEY ? "✓ Present" : "✗ Missing")
  const genAI = new GoogleGenerativeAI(GEMINI_KEY)
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("[v0] Converting file to base64:", file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const res = (reader.result as string).split(",")[1] || ""
      console.log("[v0] File converted to base64, length:", res.length)
      resolve(res)
    }
    reader.onerror = (e) => {
      console.error("[v0] File conversion error:", e)
      reject(e)
    }
    reader.readAsDataURL(file)
  })
}

function guessMimeTypeFromUrl(url: string): string {
  const lower = url.toLowerCase()
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (lower.endsWith(".doc")) return "application/msword"
  if (lower.endsWith(".txt")) return "text/plain"
  return "application/octet-stream"
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

function withDefaults(result: Partial<ResumeAnalysis>): ResumeAnalysis {
  console.log("[v0] Applying defaults to parsed result:", Object.keys(result))
  return {
    name: result.name || "",
    email: result.email || "",
    phone: result.phone || "",
    location: result.location || "",
    summary: result.summary || "",
    total_experience_years: typeof result.total_experience_years === "number" ? result.total_experience_years : 0,
    current_role: result.current_role || "",
    target_roles: result.target_roles || [],
    skills: {
      technical: result.skills?.technical || [],
      soft: result.skills?.soft || [],
      tools: result.skills?.tools || [],
      domains: result.skills?.domains || [],
    },
    work_experience: (result.work_experience || []).map((w) => ({
      title: w?.title || "",
      company: w?.company || "",
      start_date: w?.start_date || "",
      end_date: w?.end_date || "",
      location: w?.location || "",
      responsibilities: w?.responsibilities || [],
      achievements: w?.achievements || [],
    })),
    education: (result.education || []).map((e) => ({
      degree: e?.degree || "",
      institution: e?.institution || "",
      graduation_year: e?.graduation_year || "",
      location: e?.location || "",
    })),
    certifications: (result.certifications || []).map((c) => ({
      name: c?.name || "",
      organization: c?.organization || "",
      year: c?.year || "",
    })),
    projects: (result.projects || []).map((p) => ({
      name: p?.name || "",
      description: p?.description || "",
      tech_stack: p?.tech_stack || [],
      link: p?.link || "",
      impact: p?.impact || "",
    })),
    languages: result.languages || [],
    links: {
      linkedin: result.links?.linkedin || "",
      github: result.links?.github || "",
      portfolio: result.links?.portfolio || "",
      website: result.links?.website || "",
    },
    industry_insights: {
      strengths: result.industry_insights?.strengths || [],
      weaknesses: result.industry_insights?.weaknesses || [],
      role_fit: result.industry_insights?.role_fit || [],
      improvement_suggestions: result.industry_insights?.improvement_suggestions || [],
    },
  }
}

function stripFences(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  console.log("[v0] Stripped JSON fences, cleaned length:", cleaned.length)
  return cleaned
}

export async function analyzeResumeFromUrl(
  url: string,
  mimeTypeHint?: string,
  opts?: { retries?: number; delayMs?: number },
): Promise<ResumeAnalysis> {
  console.log("[v0] Fetching resume from public URL for analysis:", url)

  const retries = Math.max(1, opts?.retries ?? 3)
  const baseDelay = Math.max(250, opts?.delayMs ?? 500)

  const cacheBusted = new URL(url)
  cacheBusted.searchParams.set("t", String(Date.now()))

  let lastBlobSize = 0
  let lastError: unknown = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(cacheBusted.toString(), { mode: "cors", cache: "no-store" })
      if (!resp.ok) {
        throw new Error(`Failed to fetch file from URL: ${resp.status}`)
      }

      const respClone = resp.clone()
      const blob = await resp.blob()
      const inferredType = blob.type || mimeTypeHint || guessMimeTypeFromUrl(url)

      if (blob.size > 0) {
        const nameFromUrl = url.split("/").pop() || `resume.${inferredType.split("/")[1] || "bin"}`
        const file = new File([blob], nameFromUrl, { type: inferredType })
        return analyzeResumeFile(file)
      }

      console.log(`[v0] Attempt ${attempt}/${retries}: fetched blob is empty. size=${blob.size}`)
      lastBlobSize = blob.size

      // If this was the last attempt, fall back to text-based analysis using the cloned response
      if (attempt === retries) {
        const text = await respClone.text().catch((e) => {
          console.warn("[v0] Fallback text read failed:", e)
          return ""
        })
        return analyzeResumeText(text, url, inferredType)
      }

      await sleep(baseDelay * attempt)
    } catch (err) {
      lastError = err
      console.warn(`[v0] URL analysis attempt ${attempt} failed:`, err)
      if (attempt < retries) {
        await sleep(baseDelay * attempt)
      }
    }
  }

  console.error("[v0] All URL analysis attempts failed. Last blob size:", lastBlobSize, "Last error:", lastError)
  return analyzeResumeText("", url, mimeTypeHint || guessMimeTypeFromUrl(url))
}

async function analyzeResumeText(text: string, url: string, mimeType: string): Promise<ResumeAnalysis> {
  console.log("[v0] Analyzing resume text from URL:", url)
  // Implement text-based analysis logic here
  // For now, return a default structure with error information
  const errorResult = withDefaults({
    summary: `Error analyzing resume from URL: ${url}`,
    industry_insights: {
      weaknesses: ["Resume analysis failed - please try uploading again"],
      improvement_suggestions: ["Ensure the file is a valid resume in PDF, DOC, or DOCX format"],
      strengths: [],
      role_fit: [],
    },
  })

  return errorResult
}

export async function analyzeResumeFile(file: File): Promise<ResumeAnalysis> {
  console.log("[v0] Starting resume analysis for file:", file.name, "Size:", file.size, "Type:", file.type)

  try {
    const model = await getModel()
    console.log("[v0] Gemini model initialized successfully")

    const base64 = await fileToBase64(file)
    if (!base64 || base64.length === 0) {
      throw new Error("Selected file appears to be empty (no bytes read)")
    }

    console.log("[v0] File converted to base64 successfully")

    // Enhanced prompt for better extraction
    const prompt = `
You are an expert ATS-grade resume parser and industry recruiter assistant.
Analyze the attached resume file and extract ALL available information in strict JSON format.

IMPORTANT: Return ONLY valid JSON with no additional text, comments, or explanations.

Extract the following structure:

{
  "name": "string",
  "email": "string", 
  "phone": "string",
  "location": "string",
  "summary": "string - professional summary or objective",
  "total_experience_years": number,
  "current_role": "string - most recent job title",
  "target_roles": ["string - roles they might be targeting"],
  "skills": {
    "technical": ["string - programming languages, frameworks, tools"],
    "soft": ["string - communication, leadership, teamwork"],
    "tools": ["string - software, platforms, applications"],
    "domains": ["string - industry knowledge, business domains"]
  },
  "work_experience": [
    {
      "title": "string",
      "company": "string", 
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY or 'Present'",
      "location": "string",
      "responsibilities": ["string - key duties and tasks"],
      "achievements": ["string - quantifiable accomplishments"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "graduation_year": "YYYY",
      "location": "string"
    }
  ],
  "certifications": [
    { "name": "string", "organization": "string", "year": "YYYY" }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "tech_stack": ["string"],
      "link": "string - URL if available",
      "impact": "string - business impact or results"
    }
  ],
  "languages": ["string - spoken languages"],
  "links": {
    "linkedin": "string - LinkedIn URL",
    "github": "string - GitHub URL", 
    "portfolio": "string - Portfolio URL",
    "website": "string - Personal website URL"
  },
  "industry_insights": {
    "strengths": ["string - key professional strengths from recruiter perspective"],
    "weaknesses": ["string - areas for improvement from industry standpoint"],
    "role_fit": ["string - types of roles this candidate would excel in"],
    "improvement_suggestions": ["string - actionable career development advice"]
  }
}

EXTRACTION GUIDELINES:
- Extract ALL information present in the resume
- For missing fields, use appropriate defaults (empty string "", empty array [], or 0)
- Calculate total_experience_years based on work history
- Identify strengths/weaknesses from an industry hiring manager perspective
- Be thorough in extracting technical skills, tools, and domain knowledge
- Include quantifiable achievements and impacts where available
- Return ONLY the JSON object, no other text
    `.trim()

    console.log("[v0] Sending request to Gemini API...")

    const result = await model.generateContent([
      {
        text: prompt,
      },
      {
        inlineData: {
          mimeType: file.type || "application/octet-stream",
          data: base64,
        },
      },
    ])

    console.log("[v0] Received response from Gemini API")

    const raw = result?.response?.text?.() ?? "{}"
    console.log("[v0] Raw AI response length:", raw.length)
    console.log("[v0] Raw AI response preview:", raw.substring(0, 200) + "...")

    const cleaned = stripFences(raw)
    console.log("[v0] Cleaned response preview:", cleaned.substring(0, 200) + "...")

    let parsed: Partial<ResumeAnalysis> = {}
    try {
      parsed = JSON.parse(cleaned)
      console.log("[v0] Successfully parsed JSON response")
      console.log("[v0] Parsed fields:", Object.keys(parsed))
    } catch (err) {
      console.error("[v0] JSON parse failed for AI response:", err)
      console.error("[v0] Failed to parse:", cleaned.substring(0, 500))
    }

    const finalized = withDefaults(parsed || {})
    console.log("[v0] Finalized resume analysis with", Object.keys(finalized).length, "top-level fields")
    console.log("[v0] Analysis summary:", {
      name: finalized.name,
      email: finalized.email,
      experience_years: finalized.total_experience_years,
      skills_count: finalized.skills.technical.length + finalized.skills.soft.length,
      work_experience_count: finalized.work_experience.length,
      education_count: finalized.education.length,
    })

    return finalized
  } catch (error) {
    console.error("[v0] Resume analysis failed:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))

    // Return a default structure with error information
    const errorResult = withDefaults({
      summary: `Error analyzing resume: ${error instanceof Error ? error.message : "Unknown error"}`,
      industry_insights: {
        weaknesses: ["Resume analysis failed - please try uploading again"],
        improvement_suggestions: ["Ensure the file is a valid resume in PDF, DOC, or DOCX format"],
        strengths: [],
        role_fit: [],
      },
    })

    return errorResult
  }
}
// Add to gemini.ts

export interface SkillGapAnalysis {
  missingSkills: string[]
  recommendedSkills: string[]
  readinessGain: number
  priority: "High" | "Medium" | "Low"
}

export interface AICourseRecommendation {
  title: string
  provider: string
  duration: string
  costType: "Free" | "Paid"
  skillsCovered: string[]
  enrollLink: string
  rating: number
  reviews: number
  level: "Beginner" | "Intermediate" | "Advanced"
  certificate: boolean
  description: string
  readinessGain: number
}

// Generate consistent course recommendations based on skill gaps
export async function generateAICourseRecommendations(
  currentSkills: string[],
  careerGoals: Array<{
    targetRole: string
    skillsRequired: string[]
    priority: "High" | "Medium" | "Low"
  }>
): Promise<AICourseRecommendation[]> {
  try {
    const model = await getModel()
    
    const prompt = `
You are an expert AI career advisor and learning path specialist. Analyze the skill gaps and recommend relevant courses.

CURRENT SKILLS: ${JSON.stringify(currentSkills)}
CAREER GOALS: ${JSON.stringify(careerGoals)}

Generate exactly 8 course recommendations (4 Free + 4 Paid) that bridge the skill gaps. Follow these rules:

1. For HIGH priority goals: Generate 2 Free + 2 Paid courses
2. For MEDIUM priority goals: Generate 1 Free + 1 Paid courses  
3. For LOW priority goals: Generate 1 Free + 1 Paid courses
4. Total must be 8 courses (4 Free + 4 Paid)

For each course, provide:
- title: Relevant to target roles and skill gaps
- provider: Real platforms (Coursera, Udemy, edX, LinkedIn Learning, Pluralsight, Google Cloud Skills, Udacity)
- duration: Realistic timeframe
- costType: "Free" or "Paid"
- skillsCovered: Specific skills from the gaps
- enrollLink: Valid URL to course platform
- rating: 4.0-4.9
- reviews: Realistic number (1000-50000)
- level: "Beginner", "Intermediate", or "Advanced"
- certificate: true for Paid, false for Free
- description: Brief course description
- readinessGain: 5-20% based on relevance

Ensure courses are from real providers with valid links. Return ONLY JSON array:

[
  {
    "title": "Course Title",
    "provider": "Provider Name",
    "duration": "6 weeks",
    "costType": "Free",
    "skillsCovered": ["Skill1", "Skill2"],
    "enrollLink": "https://real-platform.com/course",
    "rating": 4.5,
    "reviews": 12000,
    "level": "Intermediate",
    "certificate": false,
    "description": "Course description",
    "readinessGain": 12
  }
]
`.trim()

    console.log("[AI] Generating course recommendations with Gemini...")
    
    const result = await model.generateContent([{ text: prompt }])
    const raw = result?.response?.text() ?? "[]"
    const cleaned = stripFences(raw)
    
    let recommendations: AICourseRecommendation[] = []
    try {
      recommendations = JSON.parse(cleaned)
      console.log("[AI] Successfully generated", recommendations.length, "course recommendations")
    } catch (err) {
      console.error("[AI] Failed to parse course recommendations:", err)
      // Fallback to consistent mock data based on inputs
      return generateConsistentFallbackCourses(currentSkills, careerGoals)
    }

    return recommendations
  } catch (error) {
    console.error("[AI] Course recommendation failed:", error)
    // Fallback to consistent mock data
    return generateConsistentFallbackCourses(currentSkills, careerGoals)
  }
}

// Fallback function that generates consistent courses based on inputs
function generateConsistentFallbackCourses(
  currentSkills: string[],
  careerGoals: Array<{
    targetRole: string
    skillsRequired: string[]
    priority: "High" | "Medium" | "Low"
  }>
): AICourseRecommendation[] {
  console.log("[AI] Using consistent fallback course generation")
  
  const allCourses: AICourseRecommendation[] = []
  const skillGaps = calculateSkillGaps(currentSkills, careerGoals)
  
  // Generate consistent courses based on skill gaps and goals
  careerGoals.forEach(goal => {
    const gaps = skillGaps[goal.targetRole] || []
    
    if (gaps.length > 0) {
      if (goal.priority === "High") {
        // 2 Free + 2 Paid for High priority
        allCourses.push(...generateGoalSpecificCourses(goal, gaps, "Free", 2))
        allCourses.push(...generateGoalSpecificCourses(goal, gaps, "Paid", 2))
      } else if (goal.priority === "Medium") {
        // 1 Free + 1 Paid for Medium priority
        allCourses.push(...generateGoalSpecificCourses(goal, gaps, "Free", 1))
        allCourses.push(...generateGoalSpecificCourses(goal, gaps, "Paid", 1))
      } else {
        // 1 Free + 1 Paid for Low priority
        allCourses.push(...generateGoalSpecificCourses(goal, gaps, "Free", 1))
        allCourses.push(...generateGoalSpecificCourses(goal, gaps, "Paid", 1))
      }
    }
  })

  // Ensure exactly 8 courses (4 Free + 4 Paid)
  return balanceCourses(allCourses)
}

function calculateSkillGaps(currentSkills: string[], careerGoals: any[]) {
  const gaps: { [key: string]: string[] } = {}
  
  careerGoals.forEach(goal => {
    const requiredSkills = goal.skillsRequired || []
    const missingSkills = requiredSkills.filter((skill: string) => 
      !currentSkills.some(current => 
        current.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(current.toLowerCase())
      )
    )
    gaps[goal.targetRole] = missingSkills.slice(0, 4) // Limit to top 4 gaps
  })
  
  return gaps
}

function generateGoalSpecificCourses(
  goal: any,
  gaps: string[],
  costType: "Free" | "Paid",
  count: number
): AICourseRecommendation[] {
  const courses: AICourseRecommendation[] = []
  const providers = ["Coursera", "Udemy", "edX", "LinkedIn Learning", "Pluralsight", "Google Cloud Skills", "Udacity"]
  
  for (let i = 0; i < count && i < providers.length; i++) {
    const provider = providers[i]
    const skillsCovered = gaps.slice(0, 2) // Cover 2 skills per course
    
    courses.push({
      title: `${goal.targetRole} ${costType === "Free" ? "Fundamentals" : "Professional Certificate"}`,
      provider,
      duration: costType === "Free" ? "4-6 weeks" : "8-12 weeks",
      costType,
      skillsCovered,
      enrollLink: `https://www.${provider.toLowerCase().replace(/\s+/g, '')}.com/course/${goal.targetRole.toLowerCase().replace(/\s+/g, '-')}`,
      rating: 4.3 + (Math.random() * 0.4),
      reviews: 5000 + (Math.random() * 20000),
      level: gaps.length > 2 ? "Intermediate" : "Beginner",
      certificate: costType === "Paid",
      description: `Comprehensive course covering ${skillsCovered.join(", ")} for ${goal.targetRole} role`,
      readinessGain: 8 + (Math.random() * 12)
    })
  }
  
  return courses
}

function balanceCourses(courses: AICourseRecommendation[]): AICourseRecommendation[] {
  const freeCourses = courses.filter(c => c.costType === "Free")
  const paidCourses = courses.filter(c => c.costType === "Paid")
  
  // Ensure exactly 4 Free and 4 Paid
  while (freeCourses.length < 4) {
    freeCourses.push(generateGenericCourse("Free"))
  }
  while (paidCourses.length < 4) {
    paidCourses.push(generateGenericCourse("Paid"))
  }
  
  return [...freeCourses.slice(0, 4), ...paidCourses.slice(0, 4)]
}

function generateGenericCourse(costType: "Free" | "Paid"): AICourseRecommendation {
  const providers = ["Coursera", "Udemy", "edX", "LinkedIn Learning"]
  const skills = ["Communication", "Problem Solving", "Project Management", "Leadership"]
  
  return {
    title: `Professional Development ${costType} Course`,
    provider: providers[Math.floor(Math.random() * providers.length)],
    duration: costType === "Free" ? "4 weeks" : "8 weeks",
    costType,
    skillsCovered: [skills[Math.floor(Math.random() * skills.length)]],
    enrollLink: `https://example.com/course`,
    rating: 4.0 + (Math.random() * 0.9),
    reviews: 1000 + (Math.random() * 10000),
    level: "Beginner",
    certificate: costType === "Paid",
    description: "General professional development course",
    readinessGain: 5 + (Math.random() * 10)
  }
}
