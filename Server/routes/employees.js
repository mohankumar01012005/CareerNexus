const express = require("express")
const { authMiddleware, requireEmployee } = require("../middleware/auth")
const {
  getDashboardData,
  updateSkills,
  addCareerGoal,
  updateResumeLink,
  addResumeData,
  getResumeLink,
  getResumeData,
  getResumeLinkByCredentials,
  getResumeDataByCredentials,
  updateResumeLinkByCredentials,
  updateResumeDataByCredentials
} = require("../controllers/employeeController")

const router = express.Router()

// JWT protected routes
router.use(authMiddleware, requireEmployee)

// Get employee dashboard
router.get("/dashboard", getDashboardData)

// Update skills
router.put("/skills", updateSkills)

// Add career goal
router.post("/career-goals", addCareerGoal)

// Resume routes with JWT
router.post("/resume", updateResumeLink)
router.post("/resume-data", addResumeData)
router.get("/resume", getResumeLink)
router.get("/resume-data", getResumeData)

// Public credential-based routes (no JWT required)
router.post("/get-resume-link", getResumeLinkByCredentials)
router.post("/get-resume-data", getResumeDataByCredentials)

// NEW: Update routes with credentials (no JWT required)
router.post("/update-resume-link", updateResumeLinkByCredentials)
router.post("/update-resume-data", updateResumeDataByCredentials)

module.exports = router