// Resume and AI Analysis Type Definitions

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface Skills {
  technical: string[];
  soft: string[];
  languages: string[];
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  responsibilities: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface ResumeAnalysis {
  personalInfo: PersonalInfo;
  summary: string;
  skills: Skills;
  experience: Experience[];
  education: Education[];
  certifications: string[];
  projects: Project[];
  strengths: string[];
  weaknesses: string[];
  careerSuggestions: string[];
  improvementAreas: string[];
}

export interface ResumeData {
  id?: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  analysisData: ResumeAnalysis;
  uploadDate: string;
  lastAnalyzed: string;
  version: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface CareerAdviceResponse {
  success: boolean;
  advice: string;
  hasResumeData: boolean;
}