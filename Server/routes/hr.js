const express = require("express")
const { requireHR } = require("../middleware/auth")
const {
  getAllEmployees,
  getEmployeeById,
  getPendingCareerGoals,
  updateCareerGoalStatus,
  getCareerGoalsStats,
  updateEmployeeStatus,
} = require("../controllers/hrController")

const router = express.Router()

// All routes require HR authentication
router.use(requireHR)

// Get all employees
router.get("/employees", getAllEmployees)

// Get employee by ID
router.get("/employees/:id", getEmployeeById)

// Get pending career goals
router.get("/career-goals/pending", getPendingCareerGoals)

// Update career goal status
router.put("/career-goals/status", updateCareerGoalStatus)

// Get career goals statistics
router.get("/career-goals/stats", getCareerGoalsStats)

// Update employee status
router.put("/employees/status", updateEmployeeStatus)

module.exports = router