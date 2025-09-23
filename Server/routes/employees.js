const express = require('express');
const { authMiddleware, requireEmployee } = require('../middleware/auth');
const { getDashboardData, updateSkills, addCareerGoal } = require('../controllers/employeeController');

const router = express.Router();

// All routes require employee authentication
router.use(authMiddleware, requireEmployee);

// Get employee dashboard
router.get('/dashboard', getDashboardData);

// Update skills
router.put('/skills', updateSkills);

// Add career goal
router.post('/career-goals', addCareerGoal);

module.exports = router;