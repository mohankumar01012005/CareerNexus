const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    location: String
  },
  summary: String,
  skills: {
    technical: [String],
    soft: [String],
    languages: [String]
  },
  experience: [{
    company: String,
    position: String,
    duration: String,
    responsibilities: [String]
  }],
  education: [{
    degree: String,
    institution: String,
    year: String,
    gpa: String
  }],
  certifications: [String],
  projects: [{
    name: String,
    description: String,
    technologies: [String]
  }],
  strengths: [String],
  weaknesses: [String],
  careerSuggestions: [String],
  improvementAreas: [String]
});

const resumeSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true // One resume per employee
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  analysisData: {
    type: resumeAnalysisSchema,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastAnalyzed: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for efficient queries
resumeSchema.index({ employee: 1 });
resumeSchema.index({ uploadDate: -1 });

module.exports = mongoose.model('Resume', resumeSchema);