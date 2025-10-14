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
  deleteCareerGoalByCredentials
} = require("../controllers/employeeController")

const router = express.Router()

// Public credential-based routes (no JWT required) - MUST come first
router.post("/get-resume-link", getResumeLinkByCredentials)
router.post("/get-resume-data", getResumeDataByCredentials)
router.post("/update-resume-link", updateResumeLinkByCredentials)
router.post("/update-resume-data", updateResumeDataByCredentials)
router.post("/get-career-goals", getCareerGoalsByCredentials)
router.post("/add-career-goal", addCareerGoalByCredentials)
router.post("/update-career-goals", updateCareerGoalsByCredentials)
router.post("/delete-career-goal", deleteCareerGoalByCredentials)

// JWT protected routes - apply middleware only to these routes
router.get("/dashboard", authMiddleware, requireEmployee, getDashboardData)
router.put("/skills", authMiddleware, requireEmployee, updateSkills)
router.post("/career-goals", authMiddleware, requireEmployee, addCareerGoal)
router.post("/resume", authMiddleware, requireEmployee, updateResumeLink)
router.post("/resume-data", authMiddleware, requireEmployee, addResumeData)
router.get("/resume", authMiddleware, requireEmployee, getResumeLink)
router.get("/resume-data", authMiddleware, requireEmployee, getResumeData)

module.exports = router