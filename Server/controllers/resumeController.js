const Resume = require('../models/Resume');
const Employee = require('../models/Employee');
const { analyzeResume } = require('../services/aiService');
const { getPublicUrl } = require('../services/supabaseService');

// Upload and analyze resume
const uploadResume = async (req, res) => {
  try {
    const { fileName, fileUrl, filePath, fileSize, fileType, resumeText } = req.body;

    if (!fileName || !fileUrl || !filePath) {
      return res.status(400).json({
        success: false,
        message: 'Missing required resume file data'
      });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resume text content is required for AI analysis'
      });
    }

    // Find employee
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Analyze resume with AI
    console.log('Analyzing resume with AI...');
    const analysisData = await analyzeResume(resumeText);

    // Check if employee already has a resume
    const existingResume = await Resume.findOne({ employee: employee._id });

    if (existingResume) {
      // Update existing resume
      existingResume.fileName = fileName;
      existingResume.fileUrl = fileUrl;
      existingResume.filePath = filePath;
      existingResume.fileSize = fileSize;
      existingResume.fileType = fileType;
      existingResume.analysisData = analysisData;
      existingResume.lastAnalyzed = new Date();
      existingResume.version += 1;
      
      await existingResume.save();

      res.json({
        success: true,
        message: 'Resume updated successfully',
        resume: existingResume
      });
    } else {
      // Create new resume record
      const newResume = new Resume({
        employee: employee._id,
        fileName,
        fileUrl,
        filePath,
        fileSize,
        fileType,
        analysisData
      });

      await newResume.save();

      res.status(201).json({
        success: true,
        message: 'Resume uploaded and analyzed successfully',
        resume: newResume
      });
    }

    // Update employee skills based on resume analysis
    if (analysisData.skills && analysisData.skills.technical) {
      const updatedSkills = analysisData.skills.technical.map(skill => ({
        name: skill,
        proficiency: 70, // Default proficiency for resume-detected skills
        category: 'Technical'
      }));

      // Merge with existing skills (avoid duplicates)
      const existingSkillNames = employee.skills.map(s => s.name.toLowerCase());
      const newSkills = updatedSkills.filter(skill => 
        !existingSkillNames.includes(skill.name.toLowerCase())
      );

      if (newSkills.length > 0) {
        employee.skills.push(...newSkills);
        await employee.save();
      }
    }

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing resume'
    });
  }
};

// Get employee resume
const getResume = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const resume = await Resume.findOne({ employee: employee._id, isActive: true });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    res.json({
      success: true,
      resume: resume
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resume'
    });
  }
};

// Delete resume
const deleteResume = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const resume = await Resume.findOne({ employee: employee._id });
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    // Soft delete - mark as inactive
    resume.isActive = false;
    await resume.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting resume'
    });
  }
};

// Generate career advice based on resume and question
const generateCareerAdvice = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Get resume data
    const resume = await Resume.findOne({ employee: employee._id, isActive: true });
    
    let advice;
    if (resume && resume.analysisData) {
      // Use resume data for personalized advice
      const { generateCareerAdvice } = require('../services/aiService');
      advice = await generateCareerAdvice(resume.analysisData, question);
    } else {
      // Provide general career advice
      const { generateGeneralCareerAdvice } = require('../services/aiService');
      advice = await generateGeneralCareerAdvice(question);
    }

    res.json({
      success: true,
      advice: advice,
      hasResumeData: !!resume
    });
  } catch (error) {
    console.error('Career advice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating career advice'
    });
  }
};

module.exports = {
  uploadResume,
  getResume,
  deleteResume,
  generateCareerAdvice
};