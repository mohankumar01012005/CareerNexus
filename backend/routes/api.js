// SkillCompass API Routes
// Complete routing structure for all application endpoints

const express = require('express');
const router = express.Router();

// Import middleware
const { 
  authenticateToken, 
  authorizeHR, 
  authorizeEmployee, 
  authorizeEmployeeAccess,
  rateLimitAuth,
  validateCompanyAccess 
} = require('../middleware/auth');

// Import controllers
const authController = require('../controllers/authController');
const employeeController = require('../controllers/employeeController');
const hrController = require('../controllers/hrController');
const jobController = require('../controllers/jobController');
const skillsController = require('../controllers/skillsController');
const careerController = require('../controllers/careerController');
const approvalController = require('../controllers/approvalController');
const analyticsController = require('../controllers/analyticsController');
const notificationController = require('../controllers/notificationController');

// =============================================
// AUTHENTICATION ROUTES
// =============================================

// Public routes (no authentication required)
router.post('/auth/login', rateLimitAuth(5, 15 * 60 * 1000), authController.loginUser);

// Protected routes (authentication required)
router.use('/auth', authenticateToken);
router.post('/auth/logout', authController.logoutUser);
router.get('/auth/me', authController.getCurrentUser);
router.put('/auth/change-password', authController.changePassword);

// HR-only authentication routes
router.post('/auth/create-employee', authorizeHR, authController.createEmployeeAccount);
router.put('/auth/reset-password', authorizeHR, authController.resetEmployeePassword);

// =============================================
// EMPLOYEE MANAGEMENT ROUTES
// =============================================

router.use('/employees', authenticateToken);

// Employee profile routes
router.get('/employees/profile', authorizeEmployee, employeeController.getMyProfile);
router.put('/employees/profile', authorizeEmployee, employeeController.updateMyProfile);
router.post('/employees/upload-avatar', authorizeEmployee, employeeController.uploadAvatar);

// Employee skills routes
router.get('/employees/skills', authorizeEmployee, employeeController.getMySkills);
router.put('/employees/skills', authorizeEmployee, employeeController.updateMySkills);
router.post('/employees/skills/assessment', authorizeEmployee, employeeController.submitSkillAssessment);

// Employee career routes
router.get('/employees/career-goals', authorizeEmployee, employeeController.getMyCareerGoals);
router.post('/employees/career-goals', authorizeEmployee, employeeController.createCareerGoal);
router.put('/employees/career-goals/:goalId', authorizeEmployee, employeeController.updateCareerGoal);
router.delete('/employees/career-goals/:goalId', authorizeEmployee, employeeController.deleteCareerGoal);

// Employee dashboard routes
router.get('/employees/dashboard', authorizeEmployee, employeeController.getDashboardData);
router.get('/employees/recommendations', authorizeEmployee, employeeController.getRecommendations);

// =============================================
// HR MANAGEMENT ROUTES
// =============================================

router.use('/hr', authenticateToken, authorizeHR);

// HR Dashboard
router.get('/hr/dashboard', hrController.getDashboardMetrics);
router.get('/hr/analytics', hrController.getAnalyticsData);

// Employee Management (HR)
router.get('/hr/employees', hrController.getAllEmployees);
router.get('/hr/employees/:employeeId', hrController.getEmployeeDetails);
router.put('/hr/employees/:employeeId', hrController.updateEmployee);
router.delete('/hr/employees/:employeeId', hrController.deactivateEmployee);
router.get('/hr/employees/:employeeId/performance', hrController.getEmployeePerformance);
router.post('/hr/employees/:employeeId/performance', hrController.addPerformanceReview);

// Department Management
router.get('/hr/departments', hrController.getDepartments);
router.post('/hr/departments', hrController.createDepartment);
router.put('/hr/departments/:departmentId', hrController.updateDepartment);
router.delete('/hr/departments/:departmentId', hrController.deleteDepartment);

// Company Settings
router.get('/hr/company', hrController.getCompanySettings);
router.put('/hr/company', hrController.updateCompanySettings);

// =============================================
// JOB MANAGEMENT ROUTES
// =============================================

router.use('/jobs', authenticateToken);

// Public job routes (both HR and employees)
router.get('/jobs', jobController.getJobs);
router.get('/jobs/:jobId', jobController.getJobDetails);

// Employee job routes
router.post('/jobs/:jobId/apply', authorizeEmployee, jobController.applyForJob);
router.get('/jobs/my-applications', authorizeEmployee, jobController.getMyApplications);
router.put('/jobs/applications/:applicationId/withdraw', authorizeEmployee, jobController.withdrawApplication);

// HR job management routes
router.post('/jobs', authorizeHR, jobController.createJob);
router.put('/jobs/:jobId', authorizeHR, jobController.updateJob);
router.delete('/jobs/:jobId', authorizeHR, jobController.deleteJob);
router.get('/jobs/:jobId/applications', authorizeHR, jobController.getJobApplications);
router.put('/jobs/applications/:applicationId/status', authorizeHR, jobController.updateApplicationStatus);
router.post('/jobs/applications/:applicationId/interview', authorizeHR, jobController.scheduleInterview);

// =============================================
// SKILLS MANAGEMENT ROUTES
// =============================================

router.use('/skills', authenticateToken);

// Public skills routes
router.get('/skills', skillsController.getAllSkills);
router.get('/skills/categories', skillsController.getSkillCategories);
router.get('/skills/:skillId', skillsController.getSkillDetails);

// Employee skills routes
router.get('/skills/my-skills', authorizeEmployee, skillsController.getMySkills);
router.post('/skills/endorse/:employeeId/:skillId', skillsController.endorseSkill);

// HR skills management
router.post('/skills', authorizeHR, skillsController.createSkill);
router.put('/skills/:skillId', authorizeHR, skillsController.updateSkill);
router.delete('/skills/:skillId', authorizeHR, skillsController.deleteSkill);
router.get('/skills/gap-analysis', authorizeHR, skillsController.getSkillsGapAnalysis);

// =============================================
// CAREER DEVELOPMENT ROUTES
// =============================================

router.use('/career', authenticateToken);

// Career paths and journeys
router.get('/career/paths', careerController.getCareerPaths);
router.get('/career/paths/:pathId', careerController.getCareerPathDetails);
router.post('/career/journey/start', authorizeEmployee, careerController.startCareerJourney);
router.get('/career/journey', authorizeEmployee, careerController.getMyCareerJourney);
router.put('/career/journey/progress', authorizeEmployee, careerController.updateJourneyProgress);

// Mentorship
router.get('/career/mentors', careerController.getAvailableMentors);
router.post('/career/mentor-request', authorizeEmployee, careerController.requestMentor);
router.get('/career/mentorship', careerController.getMentorshipDetails);

// HR career management
router.post('/career/paths', authorizeHR, careerController.createCareerPath);
router.put('/career/paths/:pathId', authorizeHR, careerController.updateCareerPath);
router.get('/career/analytics', authorizeHR, careerController.getCareerAnalytics);

// =============================================
// APPROVAL WORKFLOWS ROUTES
// =============================================

router.use('/approvals', authenticateToken);

// Employee approval requests
router.get('/approvals/my-requests', authorizeEmployee, approvalController.getMyRequests);
router.post('/approvals/mentor-request', authorizeEmployee, approvalController.createMentorRequest);
router.post('/approvals/training-request', authorizeEmployee, approvalController.createTrainingRequest);
router.post('/approvals/role-change-request', authorizeEmployee, approvalController.createRoleChangeRequest);

// HR approval management
router.get('/approvals/pending', authorizeHR, approvalController.getPendingApprovals);
router.get('/approvals/:requestId', authorizeHR, approvalController.getApprovalDetails);
router.put('/approvals/:requestId/approve', authorizeHR, approvalController.approveRequest);
router.put('/approvals/:requestId/reject', authorizeHR, approvalController.rejectRequest);
router.get('/approvals/analytics', authorizeHR, approvalController.getApprovalAnalytics);

// =============================================
// ANALYTICS & REPORTING ROUTES
// =============================================

router.use('/analytics', authenticateToken, authorizeHR);

// Dashboard analytics
router.get('/analytics/dashboard', analyticsController.getDashboardAnalytics);
router.get('/analytics/skills-gap', analyticsController.getSkillsGapAnalysis);
router.get('/analytics/performance', analyticsController.getPerformanceAnalytics);
router.get('/analytics/diversity', analyticsController.getDiversityMetrics);
router.get('/analytics/hiring-trends', analyticsController.getHiringTrends);

// Report generation
router.post('/analytics/reports/generate', analyticsController.generateReport);
router.get('/analytics/reports', analyticsController.getReports);
router.get('/analytics/reports/:reportId', analyticsController.getReportDetails);
router.get('/analytics/reports/:reportId/download', analyticsController.downloadReport);

// =============================================
// NOTIFICATIONS ROUTES
// =============================================

router.use('/notifications', authenticateToken);

// User notifications
router.get('/notifications', notificationController.getMyNotifications);
router.put('/notifications/:notificationId/read', notificationController.markAsRead);
router.put('/notifications/mark-all-read', notificationController.markAllAsRead);
router.delete('/notifications/:notificationId', notificationController.deleteNotification);

// HR notification management
router.post('/notifications/broadcast', authorizeHR, notificationController.broadcastNotification);
router.get('/notifications/analytics', authorizeHR, notificationController.getNotificationAnalytics);

// =============================================
// SYSTEM ROUTES
// =============================================

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillCompass API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

// API documentation
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillCompass API Documentation',
    endpoints: {
      authentication: '/api/auth/*',
      employees: '/api/employees/*',
      hr: '/api/hr/*',
      jobs: '/api/jobs/*',
      skills: '/api/skills/*',
      career: '/api/career/*',
      approvals: '/api/approvals/*',
      analytics: '/api/analytics/*',
      notifications: '/api/notifications/*'
    }
  });
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;