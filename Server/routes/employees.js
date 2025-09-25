const express = require('express');
const { authMiddleware, requireEmployee } = require('../middleware/auth');
const { getDashboardData, updateSkills, addCareerGoal } = require('../controllers/employeeController');
const { uploadResume, getResume, deleteResume, generateCareerAdvice } = require('../controllers/resumeController');

const router = express.Router();

// All routes require employee authentication
router.use(authMiddleware, requireEmployee);

// Get employee dashboard
router.get('/dashboard', getDashboardData);

// Update skills
router.put('/skills', updateSkills);

// Add career goal
router.post('/career-goals', addCareerGoal);

// Resume management routes
router.post('/resume', uploadResume);
router.get('/resume', getResume);
router.delete('/resume', deleteResume);

// AI career advice
router.post('/career-advice', generateCareerAdvice);

module.exports = router;