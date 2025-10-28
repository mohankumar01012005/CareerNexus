// [file name]: employees.js (Backend - fix duplicate route)

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
  updateResumeDataByCredentials,
  getCareerGoalsByCredentials,
  addCareerGoalByCredentials,
  updateCareerGoalsByCredentials,
  deleteCareerGoalByCredentials,
  getEmployeeProfileByCredentials,
  updateEmployeeProfileByCredentials,
} = require("../controllers/employeeController")

const router = express.Router()

// Public credential-based routes (no session/JWT; email+password in body)
router.post("/get-resume-link", getResumeLinkByCredentials)
router.post("/get-resume-data", getResumeDataByCredentials)
router.post("/update-resume-link", updateResumeLinkByCredentials)
router.post("/update-resume-data", updateResumeDataByCredentials)
router.post("/get-career-goals", getCareerGoalsByCredentials)
router.post("/add-career-goal", addCareerGoalByCredentials)
router.post("/update-career-goals", updateCareerGoalsByCredentials)
router.post("/delete-career-goal", deleteCareerGoalByCredentials)
router.post("/get-profile", getEmployeeProfileByCredentials)
router.post("/update-profile", updateEmployeeProfileByCredentials)

// Protect only employee-session routes after this point
router.use(authMiddleware, requireEmployee)

// Get employee dashboard
router.get("/dashboard", getDashboardData)

// Update skills
router.put("/skills", updateSkills)

// Add career goal (employee session)
router.post("/career-goals", addCareerGoal)

// Resume routes with JWT
router.post("/resume", updateResumeLink)
router.post("/resume-data", addResumeData)
router.post("/resume/get", getResumeLink) // changed from GET /resume
router.post("/resume-data/get", getResumeData) // changed from GET /resume-data

module.exports = router
