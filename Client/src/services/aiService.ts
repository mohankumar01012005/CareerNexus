// Gemini AI Service for Resume Analysis and Career Chat

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing Gemini API key');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize the model
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ResumeAnalysis {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  experience: {
    company: string;
    position: string;
    duration: string;
    responsibilities: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  certifications: string[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  strengths: string[];
  weaknesses: string[];
  careerSuggestions: string[];
  improvementAreas: string[];
}

// Parse resume text and extract structured data
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  try {
    const prompt = `
    Analyze the following resume and extract structured information. Return ONLY a JSON object with the following structure:

    {
      "personalInfo": {
        "name": "string",
        "email": "string", 
        "phone": "string",
        "location": "string"
      },
      "summary": "string - professional summary",
      "skills": {
        "technical": ["array of technical skills"],
        "soft": ["array of soft skills"],
        "languages": ["array of programming/spoken languages"]
      },
      "experience": [
        {
          "company": "string",
          "position": "string", 
          "duration": "string",
          "responsibilities": ["array of key responsibilities"]
        }
      ],
      "education": [
        {
          "degree": "string",
          "institution": "string",
          "year": "string",
          "gpa": "string (optional)"
        }
      ],
      "certifications": ["array of certifications"],
      "projects": [
        {
          "name": "string",
          "description": "string",
          "technologies": ["array of technologies used"]
        }
      ],
      "strengths": ["array of identified strengths"],
      "weaknesses": ["array of potential improvement areas"],
      "careerSuggestions": ["array of career path suggestions"],
      "improvementAreas": ["array of skills to develop"]
    }

    Resume Content:
    ${resumeText}

    Return ONLY the JSON object, no additional text or formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response
    text = text.replace(/```json|```/g, '').trim();
    
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // Return a default structure if parsing fails
      return {
        personalInfo: { name: '', email: '', phone: '', location: '' },
        summary: 'Unable to parse resume summary',
        skills: { technical: [], soft: [], languages: [] },
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        strengths: [],
        weaknesses: [],
        careerSuggestions: [],
        improvementAreas: []
      };
    }
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw new Error('Failed to analyze resume');
  }
};

// Generate career advice based on resume data and user question
export const generateCareerAdvice = async (
  resumeData: ResumeAnalysis, 
  userQuestion: string
): Promise<string> => {
  try {
    const prompt = `
    You are an AI career counselor. Based on the following resume data and user question, provide helpful career advice.

    Resume Data:
    - Name: ${resumeData.personalInfo.name}
    - Current Role: ${resumeData.experience[0]?.position || 'Not specified'}
    - Skills: ${[...resumeData.skills.technical, ...resumeData.skills.soft].join(', ')}
    - Experience: ${resumeData.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
    - Strengths: ${resumeData.strengths.join(', ')}
    - Improvement Areas: ${resumeData.improvementAreas.join(', ')}
    - Career Suggestions: ${resumeData.careerSuggestions.join(', ')}

    User Question: ${userQuestion}

    Provide a helpful, personalized response that:
    1. Addresses the specific question
    2. References relevant information from their resume
    3. Offers actionable advice
    4. Suggests specific next steps
    5. Is encouraging and professional

    Keep the response conversational and under 300 words.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Career advice generation error:', error);
    throw new Error('Failed to generate career advice');
  }
};

// Extract text from PDF (for client-side processing)
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // For now, we'll use a simple text extraction
        // In production, you might want to use a PDF parsing library
        const text = new TextDecoder().decode(arrayBuffer);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};