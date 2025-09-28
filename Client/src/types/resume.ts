export interface WorkExperience {
  title: string
  company: string
  start_date: string
  end_date: string
  location: string
  responsibilities: string[]
  achievements: string[]
}

export interface EducationItem {
  degree: string
  institution: string
  graduation_year: string
  location: string
}

export interface CertificationItem {
  name: string
  organization: string
  year: string
}

export interface ProjectItem {
  name: string
  description: string
  tech_stack: string[]
  link: string
  impact: string
}

export interface Links {
  linkedin: string
  github: string
  portfolio: string
  website: string
}

export interface IndustryInsights {
  strengths: string[]
  weaknesses: string[]
  role_fit: string[]
  improvement_suggestions: string[]
}

export interface ResumeAnalysis {
  name: string
  email: string
  phone: string
  location: string
  summary: string
  total_experience_years: number
  current_role: string
  target_roles: string[]
  skills: {
    technical: string[]
    soft: string[]
    tools: string[]
    domains: string[]
  }
  work_experience: WorkExperience[]
  education: EducationItem[]
  certifications: CertificationItem[]
  projects: ProjectItem[]
  languages: string[]
  links: Links
  industry_insights: IndustryInsights
}
