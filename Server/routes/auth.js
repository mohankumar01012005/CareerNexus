const express = require("express")
const { authMiddleware } = require("../middleware/auth")
const { hrLogin, employeeLogin, createEmployee } = require("../controllers/authController")
const { requireHR } = require("../middleware/auth")

const router = express.Router()

// HR Login
router.post("/hr/login", authMiddleware, hrLogin)

// Employee Login
router.post("/employee/login", authMiddleware, employeeLogin)

// Create Employee (HR only) - HR should authenticate via Authorization header
router.post("/employees", requireHR, createEmployee)

module.exports = router
