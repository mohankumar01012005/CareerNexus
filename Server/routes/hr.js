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

// Employee management routes
router.get("/employees", getAllEmployees)
router.get("/employees/:id", getEmployeeById)
router.put("/employees/status", updateEmployeeStatus)

// Career goals routes
router.get("/career-goals/pending", getPendingCareerGoals)
router.put("/career-goals/status", updateCareerGoalStatus)
router.get("/career-goals/stats", getCareerGoalsStats)

// Job management routes (import from jobRoutes)
router.use("/jobs", require("./jobRoutes"))

module.exports = router