const User = require("../models/User")
const Employee = require("../models/Employee")
const HR = require("../models/HR")

// Initialize HR account
const initializeHRAccount = async () => {
  try {
    console.log("Initializing HR account...")

    const existingHR = await User.findOne({ email: process.env.HR_EMAIL })
    if (!existingHR) {
      console.log("Creating default HR account...")

      const hrUser = new User({
        email: process.env.HR_EMAIL,
        password: process.env.HR_PASSWORD,
        userType: "hr",
      })
      await hrUser.save()

      const hrProfile = new HR({
        user: hrUser._id,
        fullName: "HR Manager",
      })
      await hrProfile.save()

      console.log("HR account initialized successfully")
    } else {
      console.log("HR account already exists")
    }
  } catch (error) {
    console.error("Error initializing HR account:", error.message)
  }
}

// HR Login
const hrLogin = async (req, res) => {
  try {
    const user = req.user

    if (user.userType !== "hr") {
      return res.status(403).json({
        success: false,
        message: "Access denied. HR account required.",
      })
    }

    const hrProfile = await HR.findOne({ user: user._id })

    res.json({
      success: true,
      message: "HR login successful",
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: hrProfile,
      },
    })
  } catch (error) {
    console.error("HR login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during HR login",
    })
  }
}

// Employee Login
const employeeLogin = async (req, res) => {
  try {
    const user = req.user

    if (user.userType !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Employee account required.",
      })
    }

    const employeeProfile = await Employee.findOne({ user: user._id }).populate("user", "email lastLogin")

    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    res.json({
      success: true,
      message: "Employee login successful",
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: employeeProfile,
      },
    })
  } catch (error) {
    console.error("Employee login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during employee login",
    })
  }
}

// Create Employee Account (HR only)
const createEmployee = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, department, role, joiningDate, skills } = req.body

    // Validate required fields
    if (!fullName || !email || !password || !department || !role || !joiningDate) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      })
    }

    // Check if employee already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists",
      })
    }

    // Create user account
    const user = new User({
      email: email.toLowerCase(),
      password: password,
      userType: "employee",
    })
    await user.save()

    let skillsArray = []
    if (skills) {
      if (Array.isArray(skills)) {
        // Skills is already an array of objects
        skillsArray = skills
      } else if (typeof skills === "string") {
        // Skills is a string, split and convert to objects
        skillsArray = skills.split(",").map((skill) => ({
          name: skill.trim(),
          proficiency: 0,
          category: "Frontend",
        }))
      }
    }

    // Create employee profile
    const employee = new Employee({
      user: user._id,
      fullName,
      phoneNumber: phoneNumber || "",
      department,
      role,
      joiningDate: new Date(joiningDate),
      skills: skillsArray,
    })
    await employee.save()

    res.status(201).json({
      success: true,
      message: "Employee account created successfully",
      employee: {
        id: employee._id,
        fullName: employee.fullName,
        email: user.email,
        department: employee.department,
        role: employee.role,
        skills: employee.skills,
      },
    })
  } catch (error) {
    console.error("Create employee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while creating employee account",
    })
  }
}

module.exports = {
  initializeHRAccount,
  hrLogin,
  employeeLogin,
  createEmployee,
}
