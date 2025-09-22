# SkillCompass - AI Talent Management Platform

## Complete MongoDB Schema Documentation

This document provides a comprehensive overview of the SkillCompass database schema designed for MongoDB with Node.js and Express.js backend.

## 🏗️ Architecture Overview

SkillCompass is built as a multi-tenant SaaS platform with the following key architectural principles:

- **Multi-tenant Architecture**: Each company has isolated data with shared infrastructure
- **Role-based Access Control**: HR and Employee user types with different permissions
- **HR-controlled Employee Creation**: Only HR users can create employee accounts
- **Comprehensive Audit Trail**: All actions are logged for compliance and security
- **Scalable Design**: Optimized for performance with proper indexing strategies

## 📊 Database Schema Structure

### Core System Collections

#### 1. **system_configs**
System-wide configuration settings
```javascript
{
  configKey: String (unique),
  configValue: Mixed,
  description: String,
  isActive: Boolean
}
```

#### 2. **companies**
Multi-tenant company management
```javascript
{
  companyCode: String (unique, uppercase),
  companyName: String,
  industry: String,
  companySize: Enum,
  subscriptionPlan: Enum,
  maxEmployees: Number,
  isActive: Boolean
}
```

#### 3. **departments**
Organizational structure within companies
```javascript
{
  companyId: ObjectId (ref: Company),
  departmentName: String,
  departmentCode: String,
  headEmployeeId: ObjectId (ref: User),
  budgetAllocated: Number,
  isActive: Boolean
}
```

### User Management Collections

#### 4. **users**
Core authentication and user management
```javascript
{
  companyId: ObjectId (ref: Company),
  email: String (unique, lowercase),
  passwordHash: String,
  userType: Enum ['hr', 'employee'],
  isActive: Boolean,
  emailVerified: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdBy: ObjectId (ref: User) // HR who created the account
}
```

#### 5. **employee_profiles**
Extended employee information
```javascript
{
  userId: ObjectId (ref: User, unique),
  employeeId: String (unique),
  firstName: String,
  lastName: String,
  fullName: String (auto-generated),
  departmentId: ObjectId (ref: Department),
  currentRole: String,
  jobLevel: Enum,
  managerId: ObjectId (ref: User),
  joinDate: Date,
  salary: {
    amount: Number,
    currency: String,
    frequency: Enum
  },
  employmentType: Enum,
  workLocation: Enum,
  // ... additional profile fields
}
```

#### 6. **hr_profiles**
HR user profiles with permissions
```javascript
{
  userId: ObjectId (ref: User, unique),
  firstName: String,
  lastName: String,
  role: Enum ['hr_admin', 'hr_manager', 'hr_specialist', 'hr_director'],
  permissions: [String], // Array of permission strings
  isActive: Boolean
}
```

### Skills Management Collections

#### 7. **skills**
Master skills database
```javascript
{
  skillName: String (unique),
  skillCode: String (unique, uppercase),
  category: Enum,
  subcategory: String,
  description: String,
  icon: String,
  isActive: Boolean,
  industryRelevance: [{
    industry: String,
    relevanceScore: Number (1-10)
  }]
}
```

#### 8. **employee_skills**
Employee skill assessments and proficiency tracking
```javascript
{
  employeeId: ObjectId (ref: User),
  skillId: ObjectId (ref: Skill),
  proficiencyLevel: Number (0-100),
  proficiencyLabel: Enum (auto-calculated),
  yearsOfExperience: Number,
  lastAssessedDate: Date,
  assessmentMethod: Enum,
  certifications: [Object],
  endorsedBy: [Object],
  targetLevel: Number,
  improvementPlan: String
}
```

### Career Development Collections

#### 9. **career_goals**
Employee career aspirations and goals
```javascript
{
  employeeId: ObjectId (ref: User),
  goalTitle: String,
  targetRole: String,
  targetDepartment: String,
  description: String,
  priority: Enum,
  targetDate: Date,
  status: Enum,
  progress: Number (0-100),
  requiredSkills: [Object],
  milestones: [Object]
}
```

#### 10. **career_paths**
Predefined career progression templates
```javascript
{
  pathName: String,
  fromRole: String,
  toRole: String,
  department: String,
  estimatedDuration: { months: Number },
  steps: [Object], // Detailed progression steps
  successRate: Number,
  isActive: Boolean
}
```

#### 11. **career_journeys**
Individual employee career progression tracking
```javascript
{
  employeeId: ObjectId (ref: User),
  careerPathId: ObjectId (ref: CareerPath),
  currentStep: Number,
  overallProgress: Number (0-100),
  readinessScore: Number (0-100),
  status: Enum,
  stepProgress: [Object],
  mentorId: ObjectId (ref: User)
}
```

### Job Management Collections

#### 12. **job_postings**
Internal job postings and opportunities
```javascript
{
  companyId: ObjectId (ref: Company),
  jobTitle: String,
  jobCode: String (unique, uppercase),
  departmentId: ObjectId (ref: Department),
  reportingManagerId: ObjectId (ref: User),
  jobLevel: Enum,
  employmentType: Enum,
  workLocation: Enum,
  salaryRange: Object,
  description: String,
  responsibilities: [String],
  requirements: [String],
  requiredSkills: [Object],
  status: Enum,
  isInternal: Boolean,
  postedBy: ObjectId (ref: User),
  applicationCount: Number
}
```

#### 13. **job_applications**
Employee job applications and tracking
```javascript
{
  jobId: ObjectId (ref: JobPosting),
  applicantId: ObjectId (ref: User),
  applicationDate: Date,
  status: Enum,
  matchPercentage: Number (0-100),
  skillsMatch: [Object],
  coverLetter: String,
  resumeUrl: String,
  interviewSchedule: [Object],
  finalDecision: Object,
  offerDetails: Object
}
```

### Approval Workflow Collections

#### 14. **approval_requests**
Generic approval workflow system
```javascript
{
  requestType: Enum,
  requesterId: ObjectId (ref: User),
  title: String,
  description: String,
  priority: Enum,
  status: Enum,
  requestData: Mixed, // Flexible data based on request type
  approvalWorkflow: [Object],
  finalDecision: Object,
  attachments: [Object],
  dueDate: Date
}
```

#### 15. **mentor_requests**
Mentorship program requests
```javascript
{
  requesterId: ObjectId (ref: User),
  mentorId: ObjectId (ref: User),
  requestReason: String,
  mentorshipGoals: [String],
  preferredDuration: Number,
  meetingFrequency: Enum,
  status: Enum,
  mentorshipSessions: [Object]
}
```

#### 16. **training_requests**
Employee training and development requests
```javascript
{
  requesterId: ObjectId (ref: User),
  courseName: String,
  provider: String,
  duration: String,
  cost: Object,
  businessJustification: String,
  expectedOutcomes: [String],
  skillsToImprove: [Object],
  status: Enum,
  completionDate: Date,
  certificateUrl: String
}
```

### Analytics & Performance Collections

#### 17. **performance_metrics**
Employee performance reviews and ratings
```javascript
{
  employeeId: ObjectId (ref: User),
  reviewPeriod: {
    startDate: Date,
    endDate: Date
  },
  reviewType: Enum,
  overallRating: Number (1-5),
  ratingLabel: Enum (auto-calculated),
  goals: [Object],
  competencyRatings: [Object],
  strengths: [String],
  areasForImprovement: [String],
  reviewerId: ObjectId (ref: User)
}
```

#### 18. **analytics_dashboard**
Aggregated analytics data for reporting
```javascript
{
  companyId: ObjectId (ref: Company),
  reportDate: Date,
  reportType: Enum,
  metrics: {
    totalEmployees: Number,
    newHires: Number,
    attritionRate: Number,
    engagementScore: Number,
    // ... additional metrics
  },
  departmentBreakdown: [Object],
  skillsGapAnalysis: [Object],
  diversityMetrics: Object,
  performanceDistribution: Object
}
```

### Communication Collections

#### 19. **notifications**
User notifications and alerts
```javascript
{
  recipientId: ObjectId (ref: User),
  senderId: ObjectId (ref: User),
  type: Enum,
  title: String,
  message: String,
  priority: Enum,
  isRead: Boolean,
  readAt: Date,
  actionRequired: Boolean,
  actionUrl: String,
  relatedEntityId: ObjectId,
  relatedEntityType: String,
  expiresAt: Date,
  channels: [Object]
}
```

### Audit & Security Collections

#### 20. **audit_logs**
Comprehensive audit trail for all system actions
```javascript
{
  userId: ObjectId (ref: User),
  action: String,
  entityType: String,
  entityId: ObjectId,
  oldValues: Mixed,
  newValues: Mixed,
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  timestamp: Date,
  success: Boolean,
  errorMessage: String
}
```

## 🔐 Security & Access Control

### Authentication Flow
1. **HR Login**: Direct login with email/password
2. **Employee Login**: Uses credentials provided by HR
3. **JWT Tokens**: Secure session management
4. **Rate Limiting**: Protection against brute force attacks
5. **Account Lockout**: Automatic lockout after failed attempts

### Authorization Levels
- **HR Users**: Full administrative access within their company
- **Employees**: Limited access to personal data and applications
- **Company Isolation**: Multi-tenant data separation
- **Role-based Permissions**: Granular permission system

## 📈 Performance Optimization

### Indexing Strategy
- **Primary Indexes**: Unique constraints and primary keys
- **Compound Indexes**: Multi-field queries optimization
- **Text Indexes**: Full-text search capabilities
- **TTL Indexes**: Automatic data cleanup for logs and notifications

### Query Optimization
- **Aggregation Pipelines**: Complex analytics queries
- **Population Strategies**: Efficient data relationships
- **Pagination**: Large dataset handling
- **Caching**: Redis integration for frequently accessed data

## 🚀 Key Features Implementation

### 1. Employee Account Creation (HR-Only)
```javascript
// Only HR can create employee accounts
POST /api/auth/create-employee
Authorization: HR role required
```

### 2. Skills Assessment System
```javascript
// Comprehensive skill tracking with proficiency levels
// Auto-calculated labels based on numeric scores
// Endorsement system for peer validation
```

### 3. Career Path Planning
```javascript
// AI-powered career progression recommendations
// Step-by-step development roadmaps
// Progress tracking and milestone management
```

### 4. Job Matching Algorithm
```javascript
// Skills-based job matching with percentage scores
// Internal mobility prioritization
// Application tracking and interview scheduling
```

### 5. Approval Workflows
```javascript
// Multi-level approval processes
// Mentor requests, training approvals, role changes
// Automated notifications and deadline tracking
```

### 6. Analytics Dashboard
```javascript
// Real-time HR analytics and insights
// Skills gap analysis and diversity metrics
// Performance distribution and hiring trends
```

## 🛠️ Technical Implementation

### Backend Stack
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: Authentication and authorization
- **Bcrypt**: Password hashing and security

### API Architecture
- **RESTful Design**: Standard HTTP methods and status codes
- **Middleware Stack**: Authentication, validation, error handling
- **Rate Limiting**: DDoS protection and abuse prevention
- **CORS Configuration**: Cross-origin resource sharing

### Data Validation
- **Mongoose Schemas**: Built-in validation rules
- **Joi Validation**: Advanced input validation
- **Sanitization**: MongoDB injection prevention
- **Type Safety**: Strict data type enforcement

## 📋 Development Guidelines

### Code Organization
```
backend/
├── models/           # Mongoose schemas and models
├── controllers/      # Business logic and request handlers
├── middleware/       # Authentication and validation
├── routes/          # API endpoint definitions
├── config/          # Database and application configuration
├── utils/           # Helper functions and utilities
├── scripts/         # Database seeding and migration scripts
└── tests/           # Unit and integration tests
```

### Environment Configuration
- **Development**: Local MongoDB with seeded data
- **Testing**: In-memory MongoDB for unit tests
- **Production**: MongoDB Atlas with SSL/TLS encryption
- **Environment Variables**: Secure configuration management

This comprehensive schema provides a solid foundation for the SkillCompass AI Talent Management Platform, ensuring scalability, security, and maintainability while supporting all the features demonstrated in the frontend application.