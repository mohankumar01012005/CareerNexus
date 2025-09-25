const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing Gemini API key in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Analyze resume text and extract structured data
const analyzeResume = async (resumeText) => {
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
const generateCareerAdvice = async (resumeData, userQuestion) => {
  try {
    const prompt = `
    You are an AI career counselor. Based on the following resume data and user question, provide helpful career advice.

    Resume Data:
    - Name: ${resumeData.personalInfo?.name || 'Not specified'}
    - Current Role: ${resumeData.experience[0]?.position || 'Not specified'}
    - Skills: ${[...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])].join(', ')}
    - Experience: ${resumeData.experience?.map(exp => `${exp.position} at ${exp.company}`).join(', ') || 'Not specified'}
    - Strengths: ${resumeData.strengths?.join(', ') || 'Not specified'}
    - Improvement Areas: ${resumeData.improvementAreas?.join(', ') || 'Not specified'}
    - Career Suggestions: ${resumeData.careerSuggestions?.join(', ') || 'Not specified'}

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

// Generate general career advice (when no resume data available)
const generateGeneralCareerAdvice = async (userQuestion) => {
  try {
    const prompt = `
    You are a professional career counselor. Answer the following career question with helpful, actionable advice:
    
    Question: ${userQuestion}
    
    Provide a helpful response that:
    1. Addresses the specific question
    2. Offers practical advice
    3. Suggests actionable next steps
    4. Is encouraging and professional
    
    Keep the response conversational and under 250 words.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('General career advice error:', error);
    throw new Error('Failed to generate career advice');
  }
};

module.exports = {
  analyzeResume,
  generateCareerAdvice,
  generateGeneralCareerAdvice
};