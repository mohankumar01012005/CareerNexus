const express = require("express")
const { authMiddleware, requireEmployee } = require("../middleware/auth")
const {
  getDashboardData,
  updateSkills,
  addCareerGoal,
  updateResumeLink,
  addResumeData,
} = require("../controllers/employeeController")

const router = express.Router()

// All routes require employee authentication
router.use(authMiddleware, requireEmployee)

// Get employee dashboard
router.get("/dashboard", getDashboardData)

// Update skills
router.put("/skills", updateSkills)

// Add career goal
router.post("/career-goals", addCareerGoal)

// Expects body: { email, password, resumeLink } (or publicUrl / resume_link)
router.post("/resume", updateResumeLink)

// Expects body: { email, password, resumeData } (or resume_data / parsedData)
router.post("/resume-data", addResumeData)

module.exports = router
