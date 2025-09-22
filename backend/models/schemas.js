// SkillCompass AI Talent Management Platform
// Complete MongoDB Schema Design with Mongoose
// Industry Standard Node.js + Express + MongoDB Implementation

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// =============================================
// CORE SYSTEM SCHEMAS
// =============================================

// System Configuration Schema
const systemConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  configValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'system_configs'
});

// Company/Organization Schema for multi-tenant support
const companySchema = new mongoose.Schema({
  companyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 20,
    match: /^[A-Z0-9]+$/
  },
  companyName: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  industry: {
    type: String,
    maxlength: 100
  },
  companySize: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise']
  },
  headquartersLocation: String,
  websiteUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  logoUrl: String,
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    default: 'basic'
  },
  maxEmployees: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'companies'
});

// Department Schema
const departmentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  departmentName: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  departmentCode: {
    type: String,
    required: true,
    uppercase: true,
    maxlength: 20
  },
  description: String,
  headEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  budgetAllocated: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'departments'
});

// Compound index for company-department uniqueness
departmentSchema.index({ companyId: 1, departmentCode: 1 }, { unique: true });

// =============================================
// USER MANAGEMENT & AUTHENTICATION
// =============================================

// Main Users Schema (HR and Employees)
const userSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    required: true,
    enum: ['hr', 'employee']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Employee Profile Schema (Extended user information)
const employeeProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  fullName: {
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  currentRole: {
    type: String,
    required: true,
    maxlength: 100
  },
  jobLevel: {
    type: String,
    enum: ['intern', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'vp', 'c-level']
  },
  phoneNumber: {
    type: String,
    match: /^\+?[\d\s\-\(\)]+$/
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  nationality: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  joinDate: {
    type: Date,
    required: true
  },
  probationEndDate: Date,
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  workLocation: {
    type: String,
    enum: ['office', 'remote', 'hybrid'],
    default: 'office'
  },
  salary: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    frequency: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatarUrl: String,
  bio: {
    type: String,
    maxlength: 500
  },
  linkedinUrl: String,
  githubUrl: String,
  portfolioUrl: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'employee_profiles'
});

// Virtual for full name
employeeProfileSchema.pre('save', function(next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

// HR Profile Schema
const hrProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['hr_admin', 'hr_manager', 'hr_specialist', 'hr_director']
  },
  permissions: [{
    type: String,
    enum: [
      'create_employees',
      'manage_jobs',
      'view_analytics',
      'approve_requests',
      'manage_settings',
      'export_data',
      'manage_departments'
    ]
  }],
  phoneNumber: String,
  avatarUrl: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'hr_profiles'
});

hrProfileSchema.pre('save', function(next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

// =============================================
// SKILLS MANAGEMENT
// =============================================

// Skills Master Data
const skillSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  skillCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'soft_skills', 'business', 'leadership', 'design', 'data', 'other']
  },
  subcategory: String,
  description: String,
  icon: String,
  isActive: {
    type: Boolean,
    default: true
  },
  industryRelevance: [{
    industry: String,
    relevanceScore: {
      type: Number,
      min: 1,
      max: 10
    }
  }]
}, {
  timestamps: true,
  collection: 'skills'
});

// Employee Skills Assessment
const employeeSkillSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  proficiencyLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  proficiencyLabel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50
  },
  lastAssessedDate: {
    type: Date,
    default: Date.now
  },
  assessmentMethod: {
    type: String,
    enum: ['self_assessment', 'manager_review', 'peer_review', 'test', 'certification']
  },
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    verificationUrl: String
  }],
  isEndorsed: {
    type: Boolean,
    default: false
  },
  endorsedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    endorsementDate: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  targetLevel: Number,
  improvementPlan: String
}, {
  timestamps: true,
  collection: 'employee_skills'
});

// Compound index for employee-skill uniqueness
employeeSkillSchema.index({ employeeId: 1, skillId: 1 }, { unique: true });

// Update proficiency label based on level
employeeSkillSchema.pre('save', function(next) {
  if (this.proficiencyLevel <= 25) this.proficiencyLabel = 'beginner';
  else if (this.proficiencyLevel <= 50) this.proficiencyLabel = 'intermediate';
  else if (this.proficiencyLevel <= 75) this.proficiencyLabel = 'advanced';
  else this.proficiencyLabel = 'expert';
  next();
});

// =============================================
// CAREER MANAGEMENT
// =============================================

// Career Goals
const careerGoalSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goalTitle: {
    type: String,
    required: true,
    maxlength: 200
  },
  targetRole: String,
  targetDepartment: String,
  targetLevel: String,
  description: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetDate: Date,
  status: {
    type: String,
    enum: ['active', 'in_progress', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  requiredSkills: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    currentLevel: Number,
    targetLevel: Number,
    gap: Number
  }],
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'career_goals'
});

// Career Path Templates
const careerPathSchema = new mongoose.Schema({
  pathName: {
    type: String,
    required: true,
    maxlength: 200
  },
  fromRole: {
    type: String,
    required: true
  },
  toRole: {
    type: String,
    required: true
  },
  department: String,
  estimatedDuration: {
    months: {
      type: Number,
      min: 1,
      max: 120
    }
  },
  steps: [{
    stepNumber: Number,
    title: String,
    description: String,
    estimatedDuration: Number, // in months
    requiredSkills: [{
      skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      },
      minimumLevel: Number
    }],
    recommendedActions: [String],
    resources: [{
      type: String,
      title: String,
      url: String,
      provider: String
    }]
  }],
  successRate: {
    type: Number,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'career_paths'
});

// Employee Career Journey
const careerJourneySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  careerPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerPath'
  },
  currentStep: {
    type: Number,
    default: 1
  },
  overallProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  readinessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expectedCompletionDate: Date,
  actualCompletionDate: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  stepProgress: [{
    stepNumber: Number,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    startDate: Date,
    completedDate: Date,
    notes: String
  }],
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'career_journeys'
});

// =============================================
// JOB MANAGEMENT
// =============================================

// Job Postings
const jobPostingSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  jobTitle: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  jobCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  reportingManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  jobLevel: {
    type: String,
    enum: ['intern', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'vp', 'c-level']
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  workLocation: {
    type: String,
    enum: ['office', 'remote', 'hybrid'],
    default: 'office'
  },
  location: {
    city: String,
    state: String,
    country: String,
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  salaryRange: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    frequency: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  responsibilities: [String],
  requirements: [String],
  preferredQualifications: [String],
  requiredSkills: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    minimumLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  benefits: [String],
  applicationDeadline: Date,
  startDate: Date,
  numberOfPositions: {
    type: Number,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'cancelled'],
    default: 'draft'
  },
  isInternal: {
    type: Boolean,
    default: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedDate: Date,
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'job_postings'
});

// Job Applications
const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'selected', 'rejected', 'withdrawn'],
    default: 'submitted'
  },
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  skillsMatch: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    required: Boolean,
    applicantLevel: Number,
    requiredLevel: Number,
    matchScore: Number
  }],
  coverLetter: String,
  resumeUrl: String,
  additionalDocuments: [{
    name: String,
    url: String,
    type: String
  }],
  applicationSource: {
    type: String,
    enum: ['internal_portal', 'referral', 'direct_application'],
    default: 'internal_portal'
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  interviewSchedule: [{
    round: Number,
    type: {
      type: String,
      enum: ['phone', 'video', 'in_person', 'technical', 'hr', 'final']
    },
    scheduledDate: Date,
    duration: Number, // in minutes
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  finalDecision: {
    decision: {
      type: String,
      enum: ['selected', 'rejected', 'on_hold']
    },
    decisionDate: Date,
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    feedback: String,
    rejectionReason: String
  },
  offerDetails: {
    salary: Number,
    startDate: Date,
    offerDate: Date,
    acceptanceDeadline: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'negotiating']
    }
  }
}, {
  timestamps: true,
  collection: 'job_applications'
});

// Compound index for job-applicant uniqueness
jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

// =============================================
// APPROVAL WORKFLOWS
// =============================================

// Approval Requests (Generic)
const approvalRequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    required: true,
    enum: ['mentor_request', 'role_change', 'training_request', 'leave_request', 'expense_claim', 'other']
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  requestData: {
    type: mongoose.Schema.Types.Mixed // Flexible data based on request type
  },
  approvalWorkflow: [{
    level: Number,
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    actionDate: Date,
    comments: String,
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  finalDecision: {
    status: {
      type: String,
      enum: ['approved', 'rejected']
    },
    decisionDate: Date,
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    finalComments: String
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  dueDate: Date,
  completedDate: Date
}, {
  timestamps: true,
  collection: 'approval_requests'
});

// Mentor Requests (Specific)
const mentorRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestReason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  mentorshipGoals: [String],
  preferredDuration: {
    type: Number, // in months
    min: 1,
    max: 24
  },
  meetingFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'as-needed']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  startDate: Date,
  endDate: Date,
  mentorshipSessions: [{
    sessionDate: Date,
    duration: Number, // in minutes
    topics: [String],
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }]
}, {
  timestamps: true,
  collection: 'mentor_requests'
});

// Training Requests
const trainingRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseName: {
    type: String,
    required: true,
    maxlength: 200
  },
  provider: String,
  courseUrl: String,
  duration: String,
  cost: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  businessJustification: {
    type: String,
    required: true,
    maxlength: 1000
  },
  expectedOutcomes: [String],
  skillsToImprove: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    currentLevel: Number,
    expectedLevel: Number
  }],
  preferredStartDate: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  completionDate: Date,
  certificateUrl: String,
  feedback: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true,
  collection: 'training_requests'
});

// =============================================
// ANALYTICS & REPORTING
// =============================================

// Employee Performance Metrics
const performanceMetricSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  reviewType: {
    type: String,
    enum: ['quarterly', 'annual', 'probation', 'project_based'],
    default: 'quarterly'
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  ratingLabel: {
    type: String,
    enum: ['exceeds_expectations', 'meets_expectations', 'below_expectations', 'unsatisfactory']
  },
  goals: [{
    goalDescription: String,
    targetDate: Date,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'overdue']
    },
    achievement: {
      type: Number,
      min: 0,
      max: 100
    },
    comments: String
  }],
  competencyRatings: [{
    competency: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  }],
  strengths: [String],
  areasForImprovement: [String],
  developmentPlan: String,
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewDate: {
    type: Date,
    default: Date.now
  },
  employeeComments: String,
  nextReviewDate: Date
}, {
  timestamps: true,
  collection: 'performance_metrics'
});

// Update rating label based on overall rating
performanceMetricSchema.pre('save', function(next) {
  if (this.overallRating >= 4.5) this.ratingLabel = 'exceeds_expectations';
  else if (this.overallRating >= 3.5) this.ratingLabel = 'meets_expectations';
  else if (this.overallRating >= 2.5) this.ratingLabel = 'below_expectations';
  else this.ratingLabel = 'unsatisfactory';
  next();
});

// Analytics Dashboard Data
const analyticsDashboardSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  metrics: {
    totalEmployees: Number,
    newHires: Number,
    terminations: Number,
    promotions: Number,
    internalHires: Number,
    attritionRate: Number,
    engagementScore: Number,
    diversityIndex: Number,
    averageTenure: Number,
    openPositions: Number,
    timeToFill: Number, // average days
    costPerHire: Number
  },
  departmentBreakdown: [{
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    employeeCount: Number,
    newHires: Number,
    attritionRate: Number,
    avgSatisfaction: Number,
    openPositions: Number,
    productivity: Number
  }],
  skillsGapAnalysis: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    currentSupply: Number,
    marketDemand: Number,
    gapPercentage: Number,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],
  diversityMetrics: {
    gender: {
      male: Number,
      female: Number,
      other: Number
    },
    ageGroups: {
      under25: Number,
      age25to35: Number,
      age36to45: Number,
      over45: Number
    },
    ethnicity: {
      asian: Number,
      white: Number,
      hispanic: Number,
      black: Number,
      other: Number
    }
  },
  performanceDistribution: {
    exceedsExpectations: Number,
    meetsExpectations: Number,
    belowExpectations: Number,
    unsatisfactory: Number
  }
}, {
  timestamps: true,
  collection: 'analytics_dashboard'
});

// =============================================
// NOTIFICATIONS & COMMUNICATIONS
// =============================================

// Notifications
const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'job_application',
      'application_status',
      'mentor_request',
      'training_approval',
      'performance_review',
      'system_update',
      'reminder',
      'announcement'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: String,
  relatedEntityId: mongoose.Schema.Types.ObjectId,
  relatedEntityType: String,
  expiresAt: Date,
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }]
}, {
  timestamps: true,
  collection: 'notifications'
});

// =============================================
// SYSTEM AUDIT & LOGGING
// =============================================

// Audit Logs
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    maxlength: 100
  },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  oldValues: mongoose.Schema.Types.Mixed,
  newValues: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String
}, {
  timestamps: false, // Using custom timestamp field
  collection: 'audit_logs'
});

// =============================================
// EXPORT MODELS
// =============================================

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
const Company = mongoose.model('Company', companySchema);
const Department = mongoose.model('Department', departmentSchema);
const User = mongoose.model('User', userSchema);
const EmployeeProfile = mongoose.model('EmployeeProfile', employeeProfileSchema);
const HRProfile = mongoose.model('HRProfile', hrProfileSchema);
const Skill = mongoose.model('Skill', skillSchema);
const EmployeeSkill = mongoose.model('EmployeeSkill', employeeSkillSchema);
const CareerGoal = mongoose.model('CareerGoal', careerGoalSchema);
const CareerPath = mongoose.model('CareerPath', careerPathSchema);
const CareerJourney = mongoose.model('CareerJourney', careerJourneySchema);
const JobPosting = mongoose.model('JobPosting', jobPostingSchema);
const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);
const MentorRequest = mongoose.model('MentorRequest', mentorRequestSchema);
const TrainingRequest = mongoose.model('TrainingRequest', trainingRequestSchema);
const PerformanceMetric = mongoose.model('PerformanceMetric', performanceMetricSchema);
const AnalyticsDashboard = mongoose.model('AnalyticsDashboard', analyticsDashboardSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = {
  SystemConfig,
  Company,
  Department,
  User,
  EmployeeProfile,
  HRProfile,
  Skill,
  EmployeeSkill,
  CareerGoal,
  CareerPath,
  CareerJourney,
  JobPosting,
  JobApplication,
  ApprovalRequest,
  MentorRequest,
  TrainingRequest,
  PerformanceMetric,
  AnalyticsDashboard,
  Notification,
  AuditLog
};